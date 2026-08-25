<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { parseSteps, type HomepageSection } from '../../composables/useHomepageContent'
import { useScrollReveal } from '../../composables/useScrollReveal'

const props = defineProps<{
  section: HomepageSection | undefined
}>()

const root = ref<HTMLElement | null>(null)
const { reveal } = useScrollReveal()

onMounted(() => {
  if (!root.value || !props.section) return
  root.value.querySelectorAll('[data-step]').forEach((step) => {
    reveal(step, { y: 32, start: 'top 80%' })
  })
})
</script>

<template>
  <section v-if="section" class="bg-cream">
    <div ref="root" class="mx-auto max-w-[1400px] px-6 py-16 sm:px-10 md:px-14 md:py-24">
      <div class="max-w-xl">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
          {{ section.subtitle }}
        </p>
        <h2 class="mt-4 font-serif text-4xl leading-[1.05] text-espresso md:text-5xl">
          {{ section.title }}
        </h2>
        <p v-if="section.description" class="mt-5 font-sans text-base leading-relaxed text-espresso/70">
          {{ section.description }}
        </p>
      </div>

      <ol class="mt-14 space-y-14 md:space-y-20">
        <li
          v-for="(step, index) in parseSteps(section.extra)"
          :key="step.key"
          data-step
          class="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t border-espresso/10 pt-8 md:grid-cols-[160px_1fr] md:gap-12"
        >
          <span class="font-serif text-5xl leading-none text-gold/60 md:text-7xl" aria-hidden="true">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <div>
            <h3 class="font-serif text-3xl text-espresso md:text-4xl">{{ step.title }}</h3>
            <p class="mt-3 max-w-xl font-sans text-base leading-relaxed text-espresso/70">
              {{ step.description }}
            </p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
