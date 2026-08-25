<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ConfirmedReservation = {
  customer_name: string
  phone: string
  reservation_date: string
  reservation_time: string
  guests: number
  notes: string | null
  status: string
}

const emit = defineEmits<{
  confirmed: [reservation: ConfirmedReservation]
}>()

const form = ref<ReservationInsert>({
  customer_name: '',
  phone: '',
  reservation_date: '',
  reservation_time: '',
  guests: 2,
  notes: '',
})

const errors = ref<Partial<Record<'customer_name' | 'phone' | 'reservation_date' | 'reservation_time' | 'guests', string>>>({})
const submitError = ref(false)
const submitting = ref(false)
const attempted = ref(false)

// ponytail: dedup payload identik <5 detik — guard submitting saja tidak menutup
// double-click yang jedanya melewati durasi request
let lastSubmitSignature = ''
let lastSubmitAt = 0

// Tanggal minimum hari ini, format lokal (bukan UTC) untuk input type=date
const minDate = computed(() => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
})

function validate(): boolean {
  const next: typeof errors.value = {}
  if (!form.value.customer_name.trim()) next.customer_name = 'Please enter your name.'
  const phone = form.value.phone.replace(/[\s-]/g, '')
  if (!/^(?:\+62|62|0)8\d{7,11}$/.test(phone)) {
    next.phone = 'Enter a valid Indonesian phone number (e.g. 081234567890).'
  }
  if (!form.value.reservation_date) {
    next.reservation_date = 'Please pick a date.'
  } else if (form.value.reservation_date < minDate.value) {
    next.reservation_date = 'Date cannot be in the past.'
  }
  if (!form.value.reservation_time) next.reservation_time = 'Please pick a time.'
  if (!Number.isInteger(form.value.guests) || form.value.guests < 1) {
    next.guests = 'At least 1 guest is required.'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function onInput() {
  if (attempted.value) validate()
}

async function handleSubmit() {
  attempted.value = true
  submitError.value = false
  if (!validate() || submitting.value) return

  const payload = {
    customer_name: form.value.customer_name.trim(),
    phone: form.value.phone.replace(/[\s-]/g, ''),
    reservation_date: form.value.reservation_date,
    reservation_time: form.value.reservation_time,
    guests: form.value.guests,
    notes: form.value.notes?.trim() || null,
  }
  const signature = JSON.stringify(payload)
  if (signature === lastSubmitSignature && Date.now() - lastSubmitAt < 5000) return

  submitting.value = true
  // Insert tanpa .select(): anon tidak punya SELECT policy di reservations (by design),
  // RETURNING row akan 401. Data konfirmasi diambil dari payload form.
  const { error } = await supabase.from('reservations').insert(payload)
  submitting.value = false

  if (error) {
    submitError.value = true
    return
  }
  lastSubmitSignature = signature
  lastSubmitAt = Date.now()
  emit('confirmed', { ...payload, status: 'pending' })
}
</script>

<template>
  <form class="glass-panel rounded-3xl bg-ivory/60 p-7 md:p-9" novalidate @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div class="md:col-span-2">
        <label for="res-name" class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/70">
          Name
        </label>
        <input
          id="res-name"
          v-model="form.customer_name"
          type="text"
          autocomplete="name"
          class="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm text-espresso transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold/60"
          :class="errors.customer_name ? 'border-terracotta' : 'border-espresso/15'"
          @input="onInput"
        />
        <p v-if="errors.customer_name" class="mt-1.5 font-sans text-xs text-terracotta">
          {{ errors.customer_name }}
        </p>
      </div>

      <div class="md:col-span-2">
        <label for="res-phone" class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/70">
          Phone
        </label>
        <input
          id="res-phone"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
          placeholder="081234567890"
          class="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm text-espresso transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold/60"
          :class="errors.phone ? 'border-terracotta' : 'border-espresso/15'"
          @input="onInput"
        />
        <p v-if="errors.phone" class="mt-1.5 font-sans text-xs text-terracotta">{{ errors.phone }}</p>
      </div>

      <div>
        <label for="res-date" class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/70">
          Date
        </label>
        <input
          id="res-date"
          v-model="form.reservation_date"
          type="date"
          :min="minDate"
          class="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/60"
          :class="errors.reservation_date ? 'border-terracotta' : 'border-espresso/15'"
          @input="onInput"
        />
        <p v-if="errors.reservation_date" class="mt-1.5 font-sans text-xs text-terracotta">
          {{ errors.reservation_date }}
        </p>
      </div>

      <div>
        <label for="res-time" class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/70">
          Time
        </label>
        <input
          id="res-time"
          v-model="form.reservation_time"
          type="time"
          class="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/60"
          :class="errors.reservation_time ? 'border-terracotta' : 'border-espresso/15'"
          @input="onInput"
        />
        <p v-if="errors.reservation_time" class="mt-1.5 font-sans text-xs text-terracotta">
          {{ errors.reservation_time }}
        </p>
      </div>

      <div class="md:col-span-2">
        <label for="res-guests" class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/70">
          Guests
        </label>
        <input
          id="res-guests"
          v-model.number="form.guests"
          type="number"
          min="1"
          step="1"
          class="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/60"
          :class="errors.guests ? 'border-terracotta' : 'border-espresso/15'"
          @input="onInput"
        />
        <p v-if="errors.guests" class="mt-1.5 font-sans text-xs text-terracotta">{{ errors.guests }}</p>
      </div>

      <div class="md:col-span-2">
        <label for="res-notes" class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/70">
          Notes <span class="normal-case tracking-normal text-espresso/40">(optional)</span>
        </label>
        <textarea
          id="res-notes"
          v-model="form.notes"
          rows="3"
          class="mt-2 w-full resize-none rounded-xl border border-espresso/15 bg-white px-4 py-3 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/60"
        />
      </div>
    </div>

    <p v-if="submitError" class="mt-5 font-sans text-sm text-terracotta">
      Something went wrong while sending your reservation. Please try again.
    </p>

    <button
      type="submit"
      :disabled="submitting"
      class="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-espresso px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream transition-all duration-300 hover:bg-terracotta active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
    >
      {{ submitting ? 'Sending…' : 'Reserve a Table' }}
    </button>
    <p class="mt-3 text-center font-sans text-xs text-espresso/50">
      Your reservation will be confirmed by our team.
    </p>
  </form>
</template>
