<script setup lang="ts">
import { onMounted } from 'vue'
import { useHomepageContent } from '../../composables/useHomepageContent'
import { useMenu } from '../../composables/useMenu'
import { useGsap } from '../../composables/useGsap'
import MenuCard from '../menu/MenuCard.vue'
import { ref } from 'vue'

const { signatureItems, load: loadContent } = useHomepageContent()
const { load: loadMenu } = useMenu()
const root = ref<HTMLElement | null>(null)
const { gsap } = useGsap()

onMounted(async () => {
  await Promise.all([loadContent(), loadMenu()])
  if (!root.value) return
  gsap.from(root.value.querySelectorAll('[data-signature-card]'), {
    autoAlpha: 0,
    y: 24,
    stagger: 0.08,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.value, start: 'top 80%', once: true },
  })
})
</script>

<template>
  <section ref="root" class="bg-cream">
    <div class="mx-auto max-w-[1400px] px-6 py-16 sm:px-10 md:px-14 md:py-24">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-xl">
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Signature</p>
          <h2 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">
            Crafted to be remembered.
          </h2>
        </div>
        <RouterLink
          to="/menu"
          class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-terracotta underline-offset-4 hover:underline"
        >
          View full menu →
        </RouterLink>
      </div>

      <div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="pick in signatureItems" :key="pick.id" data-signature-card>
          <MenuCard v-if="pick.item" :item="pick.item" />
        </div>
      </div>

      <p v-if="!signatureItems.length" class="mt-8 font-sans text-sm text-espresso/50">
        Signature selection is being curated — check the full menu.
      </p>
    </div>
  </section>
</template>
