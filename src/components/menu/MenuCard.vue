<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice, type MenuItem } from '../../composables/useMenu'

const props = defineProps<{
  item: MenuItem
}>()

defineEmits<{
  open: [item: MenuItem]
}>()

const initial = computed(() => props.item.name.charAt(0).toUpperCase())
</script>

<template>
  <button
    type="button"
    class="menu-card group relative block w-full overflow-hidden rounded-2xl border border-gold/15 bg-deep-brown text-left transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    :aria-label="`View details for ${item.name}`"
    @click="$emit('open', item)"
  >
    <div class="relative aspect-[4/3] w-full overflow-hidden">
      <img
        v-if="item.image_url"
        :src="item.image_url"
        :alt="item.name"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <!-- TODO_VERIFY: foto menu belum ada aset resminya (PRD.md §8.4) — fallback inisial, bukan stok foto -->
      <div
        v-else
        role="img"
        :aria-label="item.name"
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-deep-brown to-espresso"
      >
        <span class="font-serif text-6xl text-gold/30">{{ initial }}</span>
      </div>
    </div>

    <div
      class="glass-panel absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-xl px-4 py-3"
    >
      <div class="min-w-0">
        <h3 class="truncate font-serif text-xl leading-tight text-cream">{{ item.name }}</h3>
        <p v-if="item.description" class="mt-0.5 truncate font-sans text-xs text-cream/60">
          {{ item.description }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span
          class="font-sans text-sm font-semibold tracking-wide text-gold transition-all duration-300 ease-out md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {{ formatPrice(item.price) }}
        </span>
        <span
          class="text-cream/80 transition-all duration-300 ease-out md:-translate-x-1 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
            <path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  </button>
</template>
