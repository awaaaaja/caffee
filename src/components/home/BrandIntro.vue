<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { parseStats, type HomepageSection } from '../../composables/useHomepageContent'
import { useGsap } from '../../composables/useGsap'
import { useMenu } from '../../composables/useMenu'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{
  section: HomepageSection | undefined
}>()

const root = ref<HTMLElement | null>(null)
const { gsap, createContext } = useGsap()
const { items, load: loadMenu } = useMenu()

const stats = computed(() => parseStats(props.section?.extra ?? null))

const statValue = computed(() => (value: string) =>
  value === 'live_count' ? String(items.value.length) : value,
)

onMounted(() => {
  void loadMenu()
  if (!root.value || !props.section) return

  createContext(root.value, () => {
    const image = root.value?.querySelector('[data-intro-image]')
    const text = root.value?.querySelectorAll('[data-intro-reveal]')
    if (!image || !text?.length) return

    gsap.from(image, {
      autoAlpha: 0,
      x: 48,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: root.value, start: 'top 75%', once: true },
    })
    gsap.from(text, {
      autoAlpha: 0,
      y: 28,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: root.value, start: 'top 75%', once: true },
    })
  })
})
</script>

<template>
  <section v-if="section" class="overflow-hidden bg-ivory">
    <div
      ref="root"
      class="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-6 py-16 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:px-14 md:py-24"
    >
      <div>
        <p data-intro-reveal class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
          {{ section.subtitle }}
        </p>
        <h2 data-intro-reveal class="mt-4 font-serif text-4xl leading-[1.05] text-espresso md:text-5xl">
          {{ section.title }}
        </h2>
        <p data-intro-reveal class="mt-6 max-w-xl font-sans text-base leading-relaxed text-espresso/70">
          {{ section.description }}
        </p>

        <dl v-if="stats.length" data-intro-reveal class="mt-10 flex flex-wrap gap-x-12 gap-y-6">
          <div v-for="stat in stats" :key="stat.label">
            <dd class="font-serif text-4xl text-terracotta">{{ statValue(stat.value) }}</dd>
            <dt class="mt-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-espresso/50">
              {{ stat.label }}
            </dt>
          </div>
        </dl>

        <div v-if="section.cta_label && section.cta_url" data-intro-reveal class="mt-10">
          <BaseButton variant="primary" :to="section.cta_url ?? undefined">{{ section.cta_label }}</BaseButton>
        </div>
      </div>

      <div data-intro-image class="relative">
        <img
          v-if="section.image_url"
          :src="section.image_url"
          :alt="section.title ?? 'Brand story image'"
          loading="lazy"
          class="aspect-[4/5] w-full rounded-3xl object-cover md:aspect-[5/6]"
        />
      </div>
    </div>
  </section>
</template>
