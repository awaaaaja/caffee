<script setup lang="ts">
import type { MenuCategory } from '../../composables/useMenu'

defineProps<{
  categories: MenuCategory[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div
    class="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    role="tablist"
    aria-label="Menu category filter"
  >
    <button
      type="button"
      role="tab"
      :aria-selected="modelValue === 'all'"
      class="shrink-0 rounded-full border px-4 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-300"
      :class="
        modelValue === 'all'
          ? 'border-espresso bg-espresso text-cream'
          : 'border-espresso/15 bg-transparent text-espresso/60 hover:border-espresso/40 hover:text-espresso'
      "
      @click="$emit('update:modelValue', 'all')"
    >
      All
    </button>
    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === category.slug"
      class="shrink-0 rounded-full border px-4 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-300"
      :class="
        modelValue === category.slug
          ? 'border-espresso bg-espresso text-cream'
          : 'border-espresso/15 bg-transparent text-espresso/60 hover:border-espresso/40 hover:text-espresso'
      "
      @click="$emit('update:modelValue', category.slug)"
    >
      {{ category.name }}
    </button>
  </div>
</template>
