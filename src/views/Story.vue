<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import BrandIntro from '../components/home/BrandIntro.vue'
import { useHomepageContent } from '../composables/useHomepageContent'

const { section, load, loading, error } = useHomepageContent()

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="min-h-[100dvh] bg-cream">
    <Navbar />
    <div v-if="loading" class="px-6 pb-24 pt-40 sm:px-10 md:px-14">
      <div class="mx-auto max-w-[1400px] space-y-4" aria-label="Loading story">
        <div class="h-4 w-24 animate-pulse rounded bg-espresso/10" />
        <div class="h-12 w-2/3 animate-pulse rounded bg-espresso/10" />
        <div class="h-24 w-full animate-pulse rounded bg-espresso/10" />
      </div>
    </div>
    <div v-else-if="error" class="px-6 pb-24 pt-40 text-center">
      <p class="font-serif text-2xl text-espresso">Story is unavailable right now.</p>
    </div>
    <BrandIntro v-else-if="section('story')" :section="section('story')" />
    <div v-else class="px-6 pb-24 pt-40 text-center">
      <p class="font-serif text-2xl text-espresso">Story coming soon.</p>
    </div>
  </main>
</template>
