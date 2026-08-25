<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import GalleryGrid from '../components/gallery/GalleryGrid.vue'
import { useGallery } from '../composables/useGallery'

const { photos, loading, error, load } = useGallery()

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="min-h-[100dvh] bg-cream px-6 pb-24 pt-28 sm:px-10 md:px-14 md:pt-36">
    <Navbar />
    <div class="mx-auto max-w-[1400px]">
      <header class="max-w-2xl">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Gallery</p>
        <h1 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">
          Moments worth lingering over.
        </h1>
      </header>

      <div v-if="loading" class="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3" aria-label="Loading gallery">
        <div v-for="index in 6" :key="index" class="mb-5 break-inside-avoid">
          <div class="w-full animate-pulse rounded-2xl bg-espresso/10" :class="index % 2 ? 'aspect-[4/5]' : 'aspect-square'" />
        </div>
      </div>

      <div v-else-if="error" class="mt-16 flex flex-col items-center gap-4 text-center">
        <p class="font-serif text-2xl text-espresso">Gallery is unavailable right now.</p>
        <button
          type="button"
          class="rounded-full border border-gold px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso transition-colors duration-300 hover:bg-gold/10"
          @click="load()"
        >
          Retry
        </button>
      </div>

      <GalleryGrid v-else :photos="photos" />
    </div>
  </main>
</template>
