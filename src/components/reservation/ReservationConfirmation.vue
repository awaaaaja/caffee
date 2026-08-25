<script setup lang="ts">
import { computed } from 'vue'

export type ConfirmedReservation = {
  customer_name: string
  phone: string
  reservation_date: string
  reservation_time: string
  guests: number
  notes: string | null
  status: string
}

const props = defineProps<{
  reservation: ConfirmedReservation
}>()

const emit = defineEmits<{
  reset: []
}>()

const formattedDate = computed(() => {
  const date = new Date(`${props.reservation.reservation_date}T${props.reservation.reservation_time}`)
  return date.toLocaleDateString('en-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

function addToCalendar() {
  const r = props.reservation
  // Durasi kalender estimasi 2 jam — konfirmasi akhir oleh tim
  const start = new Date(`${r.reservation_date}T${r.reservation_time}`)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Boulalulue//Reservation//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@boulalulue`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Table at Boulalulue — ${r.customer_name} (${r.guests} guests)`,
    'DESCRIPTION:Reservation status: pending until confirmed by our team.',
    'LOCATION:Boulalulue, Padang',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'boulalulue-reservation.ics'
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="glass-panel rounded-3xl bg-ivory/60 p-7 text-center md:p-10">
    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6 text-gold" aria-hidden="true">
        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <h2 class="mt-6 font-serif text-3xl text-espresso md:text-4xl">Reservation received.</h2>
    <p class="mt-3 font-sans text-sm leading-relaxed text-espresso/70">
      Thank you, {{ reservation.customer_name }}. Your table request is
      <span class="font-semibold uppercase tracking-[0.14em] text-terracotta">pending</span> — our team will
      confirm shortly.
    </p>

    <dl class="mx-auto mt-8 max-w-sm divide-y divide-espresso/10 rounded-2xl border border-espresso/10 bg-white px-6 text-left">
      <div class="flex items-center justify-between gap-4 py-3.5">
        <dt class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/50">Date</dt>
        <dd class="font-sans text-sm font-semibold text-espresso">{{ formattedDate }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-3.5">
        <dt class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/50">Time</dt>
        <dd class="font-sans text-sm font-semibold text-espresso">{{ reservation.reservation_time }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-3.5">
        <dt class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/50">Guests</dt>
        <dd class="font-sans text-sm font-semibold text-espresso">{{ reservation.guests }}</dd>
      </div>
      <div v-if="reservation.notes" class="flex items-center justify-between gap-4 py-3.5">
        <dt class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso/50">Notes</dt>
        <dd class="text-right font-sans text-sm text-espresso">{{ reservation.notes }}</dd>
      </div>
    </dl>

    <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-espresso px-7 py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream transition-colors duration-300 hover:bg-terracotta active:scale-[0.98]"
        @click="addToCalendar"
      >
        Add to Calendar
      </button>
      <button
        type="button"
        class="rounded-full border border-gold px-7 py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-espresso transition-colors duration-300 hover:bg-gold/10 active:scale-[0.98]"
        @click="emit('reset')"
      >
        Make another reservation
      </button>
    </div>
    <p class="mt-4 font-sans text-xs text-espresso/40">
      Calendar entry uses an estimated 2-hour duration.
    </p>
  </div>
</template>
