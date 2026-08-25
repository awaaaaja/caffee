<script setup lang="ts">
defineProps<{
  title: string
  note: string
}>()
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-24 text-center">
    <span class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
      Boulalulue
    </span>
    <h1 class="font-serif text-4xl text-espresso md:text-5xl">{{ title }}</h1>
    <p class="max-w-md font-sans text-sm text-espresso/60">{{ note }}</p>
    <router-link
      class="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-terracotta underline-offset-4 hover:underline"
      to="/"
    >
      Back to Home
    </router-link>
  </main>
</template>
