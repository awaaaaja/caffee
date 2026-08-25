<script setup lang="ts">
import { onMounted } from 'vue'
import { useHomepageContent } from '../../composables/useHomepageContent'
import { useGsap } from '../../composables/useGsap'
import BaseButton from '../ui/BaseButton.vue'
import { ref } from 'vue'

const { section, load: loadContent } = useHomepageContent()
const root = ref<HTMLElement | null>(null)
const { gsap } = useGsap()

onMounted(async () => {
  await loadContent()
  if (!root.value) return
  gsap.from(root.value.querySelectorAll('[data-cta-reveal]'), {
    autoAlpha: 0,
    y: 20,
    stagger: 0.1,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.value, start: 'top 82%', once: true },
  })
})
</script>

<template>
  <section v-if="section('reservation_cta')" class="relative overflow-hidden bg-espresso text-cream">
    <div class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
    <div ref="root" class="mx-auto max-w-[1400px] px-6 py-16 text-center sm:px-10 md:px-14 md:py-24">
      <p data-cta-reveal class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
        {{ section('reservation_cta')?.subtitle }}
      </p>
      <h2 data-cta-reveal class="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
        {{ section('reservation_cta')?.title }}
      </h2>
      <p
        v-if="section('reservation_cta')?.description"
        data-cta-reveal
        class="mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed text-cream/70"
      >
        {{ section('reservation_cta')?.description }}
      </p>
      <div
        v-if="section('reservation_cta')?.cta_label && section('reservation_cta')?.cta_url"
        data-cta-reveal
        class="mt-8"
      >
        <BaseButton variant="primary" :to="section('reservation_cta')?.cta_url ?? undefined" class="!bg-gold !text-espresso hover:!bg-cream">
          {{ section('reservation_cta')?.cta_label }}
        </BaseButton>
      </div>
    </div>
  </section>
</template>
