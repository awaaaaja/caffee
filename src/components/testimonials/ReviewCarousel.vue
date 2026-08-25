<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useReviews } from '../../composables/useReviews'
import { useGsap } from '../../composables/useGsap'
import SectionHeading from '../ui/SectionHeading.vue'

const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const { reviews, loading, error, load } = useReviews()
const { gsap } = useGsap()

function scrollByCard(direction: 1 | -1) {
  const card = track.value?.querySelector('article')
  const width = card ? card.getBoundingClientRect().width + 24 : 360
  track.value?.scrollBy({ left: width * direction, behavior: 'smooth' })
}

onMounted(async () => {
  await load()
  if (!root.value || loading.value) return
  gsap.from(root.value.querySelectorAll('[data-review-card]'), {
    autoAlpha: 0,
    y: 24,
    stagger: 0.1,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.value, start: 'top 80%', once: true },
  })
})
</script>

<template>
  <section class="bg-ivory">
    <div ref="root" class="mx-auto max-w-[1400px] px-6 py-16 sm:px-10 md:px-14 md:py-24">
      <div class="flex items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="What our guests say."
        />
        <div class="hidden shrink-0 gap-3 md:flex">
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-espresso/20 text-espresso transition-colors duration-300 hover:border-gold hover:text-terracotta"
            aria-label="Previous reviews"
            @click="scrollByCard(-1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-espresso/20 text-espresso transition-colors duration-300 hover:border-gold hover:text-terracotta"
            aria-label="Next reviews"
            @click="scrollByCard(1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="loading" class="mt-10 flex gap-6 overflow-hidden" aria-label="Loading reviews">
        <div v-for="index in 3" :key="index" class="h-44 w-[320px] shrink-0 animate-pulse rounded-2xl bg-espresso/10" />
      </div>

      <p v-else-if="error" class="mt-10 font-sans text-sm text-espresso/60">
        Reviews are unavailable right now.
      </p>

      <div
        v-else-if="reviews.length"
        ref="track"
        class="-mx-6 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0"
      >
        <article
          v-for="review in reviews"
          :key="review.id"
          data-review-card
          class="w-[300px] shrink-0 snap-start rounded-2xl border border-espresso/10 bg-white p-6 sm:w-[340px]"
        >
          <div class="flex gap-1" :aria-label="`Rated ${review.rating} out of 5`">
            <svg
              v-for="star in 5"
              :key="star"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              :class="star <= review.rating ? 'fill-gold' : 'fill-espresso/15'"
              aria-hidden="true"
            >
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
            </svg>
          </div>
          <p class="mt-4 font-sans text-sm leading-relaxed text-espresso/80">
            “{{ review.review_text }}”
          </p>
          <p class="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
            {{ review.customer_name }}
          </p>
        </article>
      </div>

      <p v-else class="mt-10 font-serif text-2xl text-espresso">No reviews yet — be our first guest.</p>
    </div>
  </section>
</template>
