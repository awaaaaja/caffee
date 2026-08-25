<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import MapView from '../components/location/MapView.vue'
import type { Database } from '../types/database'
import { supabase } from '../lib/supabase'

type LocationRow = Database['public']['Tables']['locations']['Row']

// shallowRef: opening_hours bertipe Json rekursif — deep unwrap membuat TS2589
const location = shallowRef<LocationRow | null>(null)
const loading = ref(true)
const error = ref(false)

const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const dayLabels: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

const hours = computed(() => {
  const raw = location.value?.opening_hours
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const entries = raw as Record<string, string>
  return dayOrder
    .filter((day) => entries[day])
    .map((day) => ({ day: dayLabels[day], value: entries[day] }))
})

onMounted(async () => {
  const { data, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .limit(1)
    .single()
  if (fetchError) error.value = true
  else location.value = data
  loading.value = false
})
</script>

<template>
  <main class="min-h-[100dvh] bg-cream px-6 pb-24 pt-28 sm:px-10 md:px-14 md:pt-36">
    <Navbar />
    <div class="mx-auto max-w-[1400px]">
      <header class="max-w-2xl">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Location</p>
        <h1 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">Find your way to us.</h1>
      </header>

      <div v-if="loading" class="mt-12 space-y-4" aria-label="Loading location">
        <div class="h-72 w-full animate-pulse rounded-3xl bg-espresso/10" />
        <div class="h-6 w-1/2 animate-pulse rounded bg-espresso/10" />
      </div>

      <div v-else-if="error || !location" class="mt-16 text-center">
        <p class="font-serif text-2xl text-espresso">Location is unavailable right now.</p>
      </div>

      <template v-else>
        <div class="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <MapView :location="location" />

          <div>
            <h2 class="font-serif text-3xl text-espresso">{{ location.name }}</h2>
            <p class="mt-3 font-sans text-base leading-relaxed text-espresso/70">
              {{ location.address }}
            </p>

            <div
              v-if="location.is_verified === false"
              class="mt-5 flex items-start gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3"
              role="note"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <p class="font-sans text-xs leading-relaxed text-espresso/70">
                Address and hours are indicative and may change — contact us to confirm before visiting.
              </p>
            </div>

            <h3 class="mt-8 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-espresso/50">
              Opening hours
            </h3>
            <ul class="mt-3 divide-y divide-espresso/10 rounded-2xl border border-espresso/10 bg-ivory px-5">
              <li
                v-for="entry in hours"
                :key="entry.day"
                class="flex items-center justify-between gap-4 py-3 font-sans text-sm"
              >
                <span class="text-espresso/70">{{ entry.day }}</span>
                <span class="font-semibold text-espresso">{{ entry.value }}</span>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </div>
  </main>
</template>
