<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGsap } from '../../composables/useGsap'
import { useReducedMotion } from '../../composables/useReducedMotion'

const videoSection = ref<HTMLElement | null>(null)
const { gsap } = useGsap()
const { isReducedMotion } = useReducedMotion()

const videos = [
  { src: '/media/gallery-06.mp4', title: 'Boulalulue in motion — 01' },
  { src: '/media/gallery-07.mp4', title: 'Boulalulue in motion — 02' },
]

onMounted(() => {
  if (!videoSection.value || isReducedMotion.value) return

  gsap.from('.video-card', {
    autoAlpha: 0,
    y: 32,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: videoSection.value, start: 'top 85%', once: true },
  })
})
</script>

<template>
  <section
    ref="videoSection"
    class="bg-ivory py-16 sm:py-24"
    aria-labelledby="video-section-title"
  >
    <div class="mx-auto max-w-[1400px] px-6 sm:px-10 md:px-14">
      <header class="max-w-xl">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">In Motion</p>
        <h2 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">
          Moments in Motion
        </h2>
        <p class="mt-4 font-sans text-base leading-relaxed text-espresso/70">
          Glimpses of daily rhythm at Boulalulue — from the pour to the plate.
        </p>
      </header>

      <div class="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          v-for="video in videos"
          :key="video.src"
          class="relative group overflow-hidden rounded-2xl border border-espresso/10 bg-white"
        >
          <video
            :src="video.src"
            :title="video.title"
            muted
            loop
            autoplay
            playsinline
            preload="metadata"
            class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            @mouseenter="($event.target as HTMLVideoElement).play()"
            @mouseleave="($event.target as HTMLVideoElement).pause()"
          ></video>
          <div class="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" />
          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between p-4">
            <h3 class="font-serif text-lg text-cream">{{ video.title }}</h3>
            <span class="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-espresso/80 px-3 py-1.5 text-[0.7rem] font-sans font-medium text-cream">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-3.5 w-3.5" aria-hidden="true">
                <polygon points="5 3 19 12 5 21" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="font-sans text-[0.65rem] font-medium">Play on hover</span>
            </span>
          </div>
        </div>
      </div>

      <p class="mt-10 text-center font-sans text-sm text-espresso/50">
        <a
          href="/gallery"
          class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-terracotta underline-offset-4 hover:underline"
        >
          View full gallery →
        </a>
      </p>
    </div>
  </section>
</template>