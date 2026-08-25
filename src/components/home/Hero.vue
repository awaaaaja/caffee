<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGsap } from '../../composables/useGsap'
import { useReducedMotion } from '../../composables/useReducedMotion'
import { useHomepageContent } from '../../composables/useHomepageContent'
import BaseButton from '../ui/BaseButton.vue'

const heroRoot = ref<HTMLElement | null>(null)
const { gsap, createContext } = useGsap()
const { isReducedMotion } = useReducedMotion()
const { section, load: loadContent } = useHomepageContent()

const hero = computed(() => section('hero'))
const heroImage = computed(() => hero.value?.image_url || '/hero.webp')
const eyebrow = computed(() => hero.value?.subtitle ?? 'Digital Café Experience')
const headline = computed(() => hero.value?.title ?? 'Baked with precision. Served with grace.')
const description = computed(() => hero.value?.description ?? 'A warm table for thoughtful food, coffee, and the small rituals between.')
const primaryCta = computed(() => ({
  label: hero.value?.cta_label ?? 'Explore Menu',
  to: hero.value?.cta_url ?? '/menu',
}))
const secondaryCta = computed(() => {
  const extra = hero.value?.extra
  const secondary = extra && typeof extra === 'object' && !Array.isArray(extra)
    ? (extra as { secondary_cta_label?: string; secondary_cta_url?: string })
    : null
  return {
    label: secondary?.secondary_cta_label ?? 'Reserve a Table',
    to: secondary?.secondary_cta_url ?? '/reservation',
  }
})

const particles = [
  { left: '13%', top: '23%', delay: '0s', duration: '9s' },
  { left: '27%', top: '68%', delay: '-3s', duration: '11s' },
  { left: '66%', top: '22%', delay: '-6s', duration: '10s' },
  { left: '79%', top: '64%', delay: '-2s', duration: '12s' },
  { left: '53%', top: '79%', delay: '-7s', duration: '13s' },
]

onMounted(async () => {
  if (!heroRoot.value) return

  // hero copy dari CMS (homepage_sections 'hero') — fallback ke copy default
  if (!hero.value) await loadContent()

  createContext(heroRoot.value, () => {
    const image = heroRoot.value?.querySelector('[data-hero-image]')
    const logo = heroRoot.value?.querySelector('[data-hero-logo]')
    const headline = heroRoot.value?.querySelector('[data-hero-headline]')
    const description = heroRoot.value?.querySelector('[data-hero-description]')
    const cta = heroRoot.value?.querySelector('[data-hero-cta]')
    const navbar = document.querySelector('[data-site-navbar]')

    if (!image || !logo || !headline || !description || !cta) return

    if (isReducedMotion.value) {
      gsap.set(image, { scale: 1 })
      gsap.set([logo, description, cta, navbar], { autoAlpha: 1, y: 0 })
      gsap.set(headline, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', y: 0 })
      return
    }

    gsap.set(image, { scale: 1.08 })
    gsap.set([logo, navbar, description, cta], { autoAlpha: 0 })
    gsap.set(headline, { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' })

    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .to(logo, { autoAlpha: 1, duration: 0.35 }, 0.05)
      .to(navbar, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.25)
      .to(headline, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.7 }, 0.55)
      .to(description, { autoAlpha: 1, y: 0, duration: 0.45 }, 1.05)
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.45 }, 1.2)
      .to(image, { scale: 1, duration: 1, ease: 'power2.out' }, 0.9)
  })
})
</script>

<template>
  <section
    ref="heroRoot"
    class="relative isolate flex min-h-[100dvh] items-end overflow-hidden bg-espresso text-cream md:items-center"
    aria-labelledby="hero-title"
  >
    <img
      data-hero-image
      :src="heroImage"
      :alt="hero?.title ?? 'Boulalulue drinks served on a warm wooden table'"
      width="1600"
      height="1600"
      fetchpriority="high"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover object-[58%_center] will-change-transform md:object-[62%_center]"
    />
    <div class="absolute inset-0 bg-espresso/20" aria-hidden="true" />
    <div
      class="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/35 to-transparent md:bg-gradient-to-r md:from-espresso/95 md:via-espresso/55 md:to-transparent"
      aria-hidden="true"
    />

    <div
      class="relative mx-auto grid min-h-[100dvh] w-full max-w-[1400px] grid-cols-1 items-end px-6 pb-14 pt-32 sm:px-10 md:grid-cols-[0.85fr_1.15fr] md:items-center md:px-14 md:pb-20 xl:px-16"
    >
      <div class="max-w-xl md:pb-4">
        <div data-hero-logo class="mb-8 flex items-center gap-3 opacity-0">
          <span class="h-px w-10 bg-gold" aria-hidden="true" />
          <span class="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gold">
            {{ eyebrow }}
          </span>
        </div>

        <h1
          id="hero-title"
          data-hero-headline
          class="max-w-2xl font-serif text-5xl leading-[0.92] tracking-tight text-cream opacity-0 sm:text-6xl md:text-7xl xl:text-[5.8rem]"
        >
          {{ headline }}
        </h1>

        <p
          data-hero-description
          class="mt-7 max-w-md translate-y-4 font-sans text-base leading-relaxed text-cream/75 opacity-0 sm:text-lg"
        >
          {{ description }}
        </p>

        <div data-hero-cta class="mt-9 flex translate-y-4 flex-wrap gap-3 opacity-0">
          <BaseButton variant="primary" :to="primaryCta.to">{{ primaryCta.label }}</BaseButton>
          <BaseButton
            variant="outline"
            :to="secondaryCta.to"
            class="!border-cream/70 !text-cream hover:!border-gold hover:!text-gold"
          >
            {{ secondaryCta.label }}
          </BaseButton>
        </div>
      </div>

      <div class="hidden self-end justify-self-end pb-4 pr-2 md:flex md:flex-col md:items-end md:gap-3">
        <span class="h-20 w-px bg-cream/40" aria-hidden="true" />
        <span class="font-sans text-[0.6rem] uppercase tracking-[0.35em] text-cream/60 [writing-mode:vertical-rl]">
          A moment worth lingering over
        </span>
      </div>
    </div>

    <div v-if="!isReducedMotion" class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span
        v-for="(particle, index) in particles"
        :key="index"
        class="hero-particle absolute h-2.5 w-1.5 rounded-full bg-gold/30 blur-[0.5px]"
        :style="{
          left: particle.left,
          top: particle.top,
          animationDelay: particle.delay,
          animationDuration: particle.duration,
        }"
      />
    </div>

    <div class="absolute bottom-7 right-6 hidden items-center gap-3 text-cream/50 md:flex" aria-hidden="true">
      <span class="font-sans text-[0.6rem] uppercase tracking-[0.3em]">Scroll to explore</span>
      <span class="h-8 w-px bg-cream/40" />
    </div>
  </section>
</template>

<style scoped>
.hero-particle {
  animation: hero-particle-drift ease-in-out infinite;
}

@keyframes hero-particle-drift {
  0%,
  100% {
    opacity: 0.15;
    transform: translate3d(0, 0, 0) rotate(28deg);
  }

  50% {
    opacity: 0.38;
    transform: translate3d(8px, -18px, 0) rotate(48deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-particle {
    animation: none;
  }
}
</style>
