<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './composables/useReducedMotion'
import Footer from './components/layout/Footer.vue'

gsap.registerPlugin(ScrollTrigger)

const route = useRoute()
const { isReducedMotion } = useReducedMotion()
let lenis: Lenis | undefined
let animationFrame = 0

// Admin panel punya shell-nya sendiri (Sprint 09) — tanpa footer publik
const showFooter = computed(() => !route.path.startsWith('/admin'))

onMounted(() => {
  lenis = new Lenis({
    autoRaf: false,
    lerp: isReducedMotion.value ? 1 : 0.1,
    respectReducedMotion: true,
    smoothWheel: !isReducedMotion.value,
  })

  const frame = (time: number) => {
    lenis?.raf(time)
    ScrollTrigger.update()
    animationFrame = requestAnimationFrame(frame)
  }

  animationFrame = requestAnimationFrame(frame)
  requestAnimationFrame(() => ScrollTrigger.refresh())
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
  lenis?.destroy()
  lenis = undefined
})
</script>

<template>
  <RouterView />
  <Footer v-if="showFooter" />
</template>
