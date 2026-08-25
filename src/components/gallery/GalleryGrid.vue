<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GalleryPhoto } from '../../composables/useGallery'
import Lightbox from './Lightbox.vue'

const props = defineProps<{
  photos: GalleryPhoto[]
}>()

const activeCategory = ref('all')
const lightboxIndex = ref<number | null>(null)

// Kategori diambil dinamis dari data, bukan hardcode
const categories = computed(() => {
  const unique = new Set(props.photos.map((photo) => photo.category))
  return ['all', ...unique]
})

const filteredPhotos = computed(() =>
  activeCategory.value === 'all'
    ? props.photos
    : props.photos.filter((photo) => photo.category === activeCategory.value),
)

function setFilter(category: string) {
  activeCategory.value = category
}

function openLightbox(index: number) {
  lightboxIndex.value = index
}

const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i
function isVideo(url: string): boolean {
  return VIDEO_EXT.test(url)
}
</script>

<template>
  <div>
    <div
      class="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      role="tablist"
      aria-label="Gallery category filter"
    >
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        role="tab"
        :aria-selected="activeCategory === category"
        class="shrink-0 rounded-full border px-4 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.16em] capitalize transition-colors duration-300"
        :class="
          activeCategory === category
            ? 'border-espresso bg-espresso text-cream'
            : 'border-espresso/15 bg-transparent text-espresso/60 hover:border-espresso/40 hover:text-espresso'
        "
        @click="setFilter(category)"
      >
        {{ category }}
      </button>
    </div>

    <Transition name="gallery-fade" mode="out-in">
      <div
        :key="activeCategory"
        class="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3"
      >
        <button
          v-for="(photo, index) in filteredPhotos"
          :key="photo.id"
          type="button"
          class="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-gold/10 text-left transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          :aria-label="`Open photo: ${photo.caption ?? 'gallery'}`"
          @click="openLightbox(index)"
        >
          <div class="relative overflow-hidden">
            <video
              v-if="isVideo(photo.image_url)"
              :src="photo.image_url"
              :aria-label="photo.caption ?? 'Gallery video'"
              muted
              loop
              autoplay
              playsinline
              preload="metadata"
              class="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <img
              v-else
              :src="photo.image_url"
              :alt="photo.caption ?? 'Gallery photo'"
              loading="lazy"
              class="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <span
              v-if="isVideo(photo.image_url)"
              class="absolute right-3 top-3 rounded-full bg-espresso/70 px-2 py-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-cream"
            >
              Video
            </span>
            <div
              class="glass-panel absolute inset-x-3 bottom-3 translate-y-2 rounded-xl px-4 py-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <p class="truncate font-sans text-xs font-semibold uppercase tracking-[0.18em] text-cream">
                {{ photo.caption }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </Transition>

    <p
      v-if="filteredPhotos.length === 0"
      class="mt-16 text-center font-serif text-2xl text-espresso"
    >
      No photos in this category yet.
    </p>

    <Lightbox
      v-if="lightboxIndex !== null"
      :photos="filteredPhotos"
      :index="lightboxIndex"
      @close="lightboxIndex = null"
      @navigate="lightboxIndex = $event"
    />
  </div>
</template>

<style scoped>
.gallery-fade-enter-active {
  animation: gallery-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-fade-leave-active {
  transition: opacity 0.15s ease;
}

.gallery-fade-leave-to {
  opacity: 0;
}

@keyframes gallery-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gallery-fade-enter-active {
    animation: none;
  }

  .gallery-fade-leave-active {
    transition: none;
  }
}
</style>
