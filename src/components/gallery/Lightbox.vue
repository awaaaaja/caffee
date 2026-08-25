<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { GalleryPhoto } from '../../composables/useGallery'

const props = defineProps<{
  photos: GalleryPhoto[]
  index: number
}>()

const emit = defineEmits<{
  close: []
  navigate: [index: number]
}>()

const current = computed(() => props.photos[props.index])

function previous() {
  emit('navigate', (props.index - 1 + props.photos.length) % props.photos.length)
}

function next() {
  emit('navigate', (props.index + 1) % props.photos.length)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  if (event.key === 'ArrowLeft') previous()
  if (event.key === 'ArrowRight') next()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex flex-col bg-espresso/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="`Photo: ${current?.caption ?? ''}`"
    >
      <div class="flex items-center justify-between px-5 py-4">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-cream/60">
          {{ index + 1 }} / {{ photos.length }}
        </p>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors duration-300 hover:border-gold hover:text-gold"
          aria-label="Close lightbox"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
            <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="relative flex min-h-0 flex-1 items-center justify-center px-4" @click="emit('close')">
        <video
          v-if="current && /\.(mp4|webm|mov)(\?|$)/i.test(current.image_url)"
          :src="current.image_url"
          :aria-label="current.caption ?? 'Gallery video'"
          controls
          autoplay
          muted
          loop
          playsinline
          class="max-h-full max-w-full rounded-xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        />
        <img
          v-else-if="current"
          :src="current.image_url"
          :alt="current.caption ?? 'Gallery photo'"
          class="max-h-full max-w-full rounded-xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        />
      </div>

      <div class="flex items-center justify-between gap-4 px-5 py-5">
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors duration-300 hover:border-gold hover:text-gold"
          aria-label="Previous photo"
          @click.stop="previous"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
            <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <p class="mx-4 flex-1 text-center font-sans text-sm text-cream/80">
          {{ current?.caption }}
        </p>
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors duration-300 hover:border-gold hover:text-gold"
          aria-label="Next photo"
          @click.stop="next"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
            <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>
