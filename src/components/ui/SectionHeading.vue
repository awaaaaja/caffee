<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    align?: 'left' | 'center'
  }>(),
  { align: 'left' },
)

const aligns = {
  left: 'text-left items-start',
  center: 'text-center items-center',
}
</script>

<template>
  <div :class="['flex flex-col gap-3', aligns[align]]">
    <span
      v-if="eyebrow"
      class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold"
    >
      {{ eyebrow }}
    </span>
    <h2 class="font-serif text-4xl leading-tight text-espresso md:text-5xl">
      {{ title }}
    </h2>
    <p v-if="description" class="max-w-xl font-sans text-base leading-relaxed text-espresso/70">
      {{ description }}
    </p>
  </div>
</template>
