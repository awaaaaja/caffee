<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import KitchenExperience from '../components/home/KitchenExperience.vue'
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
      <div class="mx-auto max-w-[1400px] space-y-4" aria-label="Loading experience">
        <div class="h-4 w-28 animate-pulse rounded bg-espresso/10" />
        <div class="h-12 w-1/2 animate-pulse rounded bg-espresso/10" />
        <div class="h-40 w-full animate-pulse rounded bg-espresso/10" />
      </div>
    </div>
    <div v-else-if="error" class="px-6 pb-24 pt-40 text-center">
      <p class="font-serif text-2xl text-espresso">Experience is unavailable right now.</p>
    </div>
    <KitchenExperience v-else-if="section('experience')" :section="section('experience')" />
    <div v-else class="px-6 pb-24 pt-40 text-center">
      <p class="font-serif text-2xl text-espresso">Experience coming soon.</p>
    </div>
  </main>
</template>
