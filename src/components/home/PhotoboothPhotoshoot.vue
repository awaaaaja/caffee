<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { parseBullets, useHomepageContent } from '../../composables/useHomepageContent'
import { useGsap } from '../../composables/useGsap'
import BaseButton from '../ui/BaseButton.vue'

const { section, load: loadContent } = useHomepageContent()
const root = ref<HTMLElement | null>(null)
const { gsap } = useGsap()

function ctaUrl(key: 'photobooth' | 'photoshoot'): string | undefined {
  return section(key)?.cta_url ?? undefined
}

function isExternalPdf(url: string | null | undefined): boolean {
  return !!url && url.toLowerCase().endsWith('.pdf')
}

onMounted(async () => {
  await loadContent()
  if (!root.value) return
  gsap.from(root.value.querySelectorAll('[data-service-card]'), {
    autoAlpha: 0,
    y: 24,
    stagger: 0.12,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.value, start: 'top 82%', once: true },
  })
})
</script>

<template>
  <section class="bg-cream">
    <div ref="root" class="mx-auto max-w-[1400px] px-6 py-16 sm:px-10 md:px-14 md:py-24">
      <div class="max-w-xl">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Capture the moment</p>
        <h2 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">
          Photobooth & photoshoot.
        </h2>
      </div>

      <div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article
          v-for="key in (['photobooth', 'photoshoot'] as const)"
          :key="key"
          data-service-card
          class="flex flex-col rounded-3xl border border-espresso/10 bg-ivory p-8"
        >
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {{ section(key)?.subtitle }}
          </p>
          <h3 class="mt-3 font-serif text-3xl text-espresso">{{ section(key)?.title }}</h3>
          <p class="mt-4 font-sans text-sm leading-relaxed text-espresso/70">
            {{ section(key)?.description }}
          </p>

          <ul v-if="parseBullets(section(key)?.extra ?? null).length" class="mt-5 space-y-2.5">
            <li
              v-for="bullet in parseBullets(section(key)?.extra ?? null)"
              :key="bullet"
              class="flex items-start gap-2.5 font-sans text-sm text-espresso/80"
            >
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              {{ bullet }}
            </li>
          </ul>

          <div
            v-if="section(key)?.cta_label && section(key)?.cta_url"
            class="mt-auto pt-6"
          >
            <a
              v-if="isExternalPdf(section(key)?.cta_url)"
              :href="ctaUrl(key)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-terracotta underline-offset-4 hover:underline"
            >
              {{ section(key)?.cta_label }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-3.5 w-3.5" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
            <BaseButton v-else variant="outline" :to="ctaUrl(key)">
              {{ section(key)?.cta_label }}
            </BaseButton>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
