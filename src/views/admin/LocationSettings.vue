<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type LocationRow = Database['public']['Tables']['locations']['Row']

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

const location = shallowRef<LocationRow | null>(null)
const hours = ref<Record<string, string>>({})
const saving = ref(false)
const savedNotice = ref('')
const actionError = ref('')
const loaded = ref(false)

onMounted(async () => {
  const { data } = await supabase.from('locations').select('*').limit(1).single()
  if (data) {
    location.value = data
    const raw = data.opening_hours
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      hours.value = { ...(raw as Record<string, string>) }
    }
  }
  loaded.value = true
})

async function save() {
  if (!location.value) return
  actionError.value = ''
  savedNotice.value = ''
  saving.value = true
  const { error } = await supabase
    .from('locations')
    .update({
      name: location.value.name,
      address: location.value.address,
      latitude: location.value.latitude,
      longitude: location.value.longitude,
      google_maps_url: location.value.google_maps_url,
      opening_hours: hours.value,
      is_verified: location.value.is_verified,
    })
    .eq('id', location.value.id)
  saving.value = false
  if (error) {
    actionError.value = error.message
    return
  }
  savedNotice.value = 'Saved — public /location reflects this immediately.'
}
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Location settings</h1>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <div v-if="!loaded" class="mt-6 space-y-3" aria-label="Loading">
      <div v-for="index in 4" :key="index" class="h-14 animate-pulse rounded-xl bg-espresso/10" />
    </div>

    <form v-else-if="location" class="mt-6 max-w-3xl space-y-5" @submit.prevent="save">
      <div class="rounded-2xl border border-espresso/10 bg-white p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="loc-name" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Name</label>
          <input id="loc-name" v-model="location.name" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div class="sm:col-span-2">
          <label for="loc-address" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Address</label>
          <input id="loc-address" v-model="location.address" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="loc-lat" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Latitude</label>
          <input id="loc-lat" v-model="location.latitude" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="loc-lng" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Longitude</label>
          <input id="loc-lng" v-model="location.longitude" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div class="sm:col-span-2">
          <label for="loc-maps" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Google Maps URL</label>
          <input id="loc-maps" v-model="location.google_maps_url" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>

        <fieldset class="sm:col-span-2">
          <legend class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Opening hours (e.g. 10:00-22:00)</legend>
          <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div v-for="day in DAYS" :key="day" class="flex items-center gap-3">
              <span class="w-20 font-sans text-xs text-espresso/60">{{ DAY_LABELS[day] }}</span>
              <input v-model="hours[day]" type="text" :placeholder="day === 'sun' ? 'closed' : '10:00-22:00'" class="w-full rounded-xl border border-espresso/15 bg-cream/40 px-3 py-2 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
          </div>
        </fieldset>

        <label class="flex items-center gap-3 sm:col-span-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
          <input v-model="location.is_verified" type="checkbox" class="h-4 w-4 accent-[#963D20]" />
          <span class="font-sans text-xs leading-relaxed text-espresso/80">
            <strong>Verified</strong> — centang HANYA jika alamat & jam sudah dikonfirmasi Boulalulue.
            Jika tidak, publik melihat indikator "dapat berubah" (PRD.md §8.1).
          </span>
        </label>
      </div>

      <div class="flex items-center justify-end gap-3">
        <span v-if="savedNotice" class="font-sans text-xs font-semibold text-green-700">{{ savedNotice }}</span>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-espresso px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors duration-300 hover:bg-terracotta disabled:opacity-60"
        >
          {{ saving ? 'Saving…' : 'Save location' }}
        </button>
      </div>
    </form>

    <p v-else class="mt-6 font-sans text-sm text-espresso/50">No location row — seed one via migration first.</p>
  </AdminLayout>
</template>
