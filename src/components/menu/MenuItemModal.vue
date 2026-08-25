<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { formatPrice, useMenu, type MenuItem, type MenuItemDetails } from '../../composables/useMenu'

const props = defineProps<{
  item: MenuItem
}>()

const emit = defineEmits<{
  close: []
}>()

const { loadItemDetails } = useMenu()
const details = ref<MenuItemDetails | null>(null)
const detailsLoading = ref(true)
const closeButton = ref<HTMLButtonElement | null>(null)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
  closeButton.value?.focus()

  details.value = await loadItemDetails(props.item.id)
  detailsLoading.value = false
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-label="`${item.name} details`"
    >
      <div class="absolute inset-0 bg-espresso/75 backdrop-blur-sm" aria-hidden="true" @click="emit('close')" />

      <div
        class="glass-nav relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl"
      >
        <button
          ref="closeButton"
          type="button"
          class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 bg-espresso/70 text-cream transition-colors duration-300 hover:border-gold hover:text-gold"
          aria-label="Close details"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
            <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
          </svg>
        </button>

        <div class="relative aspect-[16/10] w-full overflow-hidden">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="h-full w-full object-cover"
          />
          <!-- TODO_VERIFY: foto menu belum ada aset resminya (PRD.md §8.4) — fallback inisial -->
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-gradient-to-br from-deep-brown to-espresso"
          >
            <span class="font-serif text-7xl text-gold/30">{{ item.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>

        <div class="px-6 pb-8 pt-5">
          <p class="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold">
            {{ item.is_signature ? 'Signature' : 'Menu' }}
          </p>
          <div class="mt-2 flex items-baseline justify-between gap-4">
            <h2 class="font-serif text-3xl leading-tight text-cream">{{ item.name }}</h2>
            <span class="shrink-0 font-sans text-lg font-semibold text-gold">
              {{ formatPrice(item.price) }}
            </span>
          </div>
          <p v-if="item.description" class="mt-4 font-sans text-sm leading-relaxed text-cream/70">
            {{ item.description }}
          </p>

          <div v-if="detailsLoading" class="mt-6 space-y-2" aria-label="Loading details">
            <div class="h-4 w-2/3 animate-pulse rounded bg-cream/10" />
            <div class="h-4 w-1/2 animate-pulse rounded bg-cream/10" />
          </div>

          <template v-else>
            <div v-if="details?.variants.length" class="mt-6">
              <h3 class="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-cream/50">
                Variants
              </h3>
              <ul class="mt-3 divide-y divide-cream/10">
                <li
                  v-for="variant in details.variants"
                  :key="variant.id"
                  class="flex items-center justify-between py-2.5 font-sans text-sm text-cream/85"
                >
                  <span>{{ variant.name }}</span>
                  <span v-if="variant.price !== null" class="text-gold">{{ formatPrice(variant.price) }}</span>
                </li>
              </ul>
            </div>

            <div v-if="details?.addons.length" class="mt-6">
              <h3 class="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-cream/50">
                Add-ons
              </h3>
              <ul class="mt-3 divide-y divide-cream/10">
                <li
                  v-for="addon in details.addons"
                  :key="addon.id"
                  class="flex items-center justify-between py-2.5 font-sans text-sm text-cream/85"
                >
                  <span>{{ addon.name }}</span>
                  <span class="text-gold">{{ formatPrice(addon.price) }}</span>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
