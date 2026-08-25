<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type LocationRow = Database['public']['Tables']['locations']['Row']

// shallowRef: opening_hours bertipe Json rekursif — deep unwrap membuat TS2589
const location = shallowRef<LocationRow | null>(null)
const email = ref('')
const newsletterState = ref<'idle' | 'sending' | 'done' | 'error' | 'invalid'>('idle')

const exploreLinks = [
  { label: 'Menu', to: '/menu' },
  { label: 'Our Story', to: '/story' },
  { label: 'Experience', to: '/experience' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Reservation', to: '/reservation' },
]

const hoursSummary = computed(() => {
  const raw = location.value?.opening_hours
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const entries = raw as Record<string, string>
  const weekdays = entries.mon
  const weekend = entries.sat
  if (!weekdays || !weekend || weekdays === weekend) return weekdays ?? null
  return `Mon–Fri ${weekdays} · Sat–Sun ${weekend}`
})

async function subscribe() {
  const value = email.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    newsletterState.value = 'invalid'
    return
  }
  newsletterState.value = 'sending'
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: value.toLowerCase() })
  newsletterState.value = error && error.code !== '23505' ? 'error' : 'done'
  if (newsletterState.value === 'done') email.value = ''
}

onMounted(async () => {
  const { data } = await supabase.from('locations').select('*').limit(1).single()
  location.value = data
})
</script>

<template>
  <footer class="bg-espresso text-cream">
    <div class="mx-auto max-w-[1400px] px-6 pb-10 pt-16 sm:px-10 md:px-14 md:pt-20">
      <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_0.9fr_1.2fr]">
        <div>
          <p class="font-serif text-3xl">Boulalulue</p>
          <p class="mt-3 max-w-xs font-sans text-sm leading-relaxed text-cream/60">
            Baked with precision. Served with grace.
          </p>
          <!-- TODO_VERIFY: handle Instagram resmi belum dikonfirmasi -->
          <a
            href="https://www.instagram.com/boulalulue"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-6 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 hover:text-cream"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
            </svg>
            Instagram
          </a>
        </div>

        <nav aria-label="Footer navigation">
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-cream/40">Explore</p>
          <ul class="mt-4 space-y-2.5">
            <li v-for="link in exploreLinks" :key="link.to">
              <RouterLink
                :to="link.to"
                class="font-sans text-sm text-cream/75 transition-colors duration-300 hover:text-gold"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div>
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-cream/40">Visit</p>
          <p class="mt-4 font-sans text-sm leading-relaxed text-cream/75">{{ location?.address }}</p>
          <p v-if="hoursSummary" class="mt-2 font-sans text-sm text-cream/60">{{ hoursSummary }}</p>
          <a
            v-if="location?.google_maps_url"
            :href="location.google_maps_url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-block font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold transition-colors duration-300 hover:text-cream"
          >
            Get Directions
          </a>
        </div>

        <div>
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-cream/40">Newsletter</p>
          <p class="mt-4 font-sans text-sm leading-relaxed text-cream/60">
            Fresh bakes and quiet updates, once in a while. No noise.
          </p>
          <form class="mt-4 flex gap-2" novalidate @submit.prevent="subscribe">
            <label for="newsletter-email" class="sr-only">Email address</label>
            <input
              id="newsletter-email"
              v-model="email"
              type="email"
              placeholder="you@email.com"
              class="w-full min-w-0 rounded-full border border-cream/20 bg-cream/5 px-4 py-2.5 font-sans text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
            <button
              type="submit"
              :disabled="newsletterState === 'sending'"
              class="shrink-0 rounded-full bg-gold px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso transition-colors duration-300 hover:bg-cream active:scale-[0.98] disabled:opacity-60"
            >
              Join
            </button>
          </form>
          <p v-if="newsletterState === 'done'" class="mt-2 font-sans text-xs text-gold">
            You are in — see you at the counter.
          </p>
          <p v-else-if="newsletterState === 'invalid'" class="mt-2 font-sans text-xs text-terracotta">
            Please enter a valid email address.
          </p>
          <p v-else-if="newsletterState === 'error'" class="mt-2 font-sans text-xs text-terracotta">
            Something went wrong. Please try again.
          </p>
        </div>
      </div>

      <div class="mt-14 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 sm:flex-row">
        <p class="font-sans text-xs text-cream/40">© {{ new Date().getFullYear() }} Boulalulue. All rights reserved.</p>
        <p class="font-sans text-xs uppercase tracking-[0.25em] text-cream/40">Digital Café Experience</p>
      </div>
    </div>
  </footer>
</template>
