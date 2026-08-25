<script setup lang="ts">
import { onMounted } from 'vue'
import { useHomepageContent } from '../../composables/useHomepageContent'
import { useGsap } from '../../composables/useGsap'
import { ref } from 'vue'

const { galleryPicks, load: loadContent } = useHomepageContent()
const root = ref<HTMLElement | null>(null)
const { gsap } = useGsap()

onMounted(async () => {
  await loadContent()
  if (!root.value) return
  gsap.from(root.value.querySelectorAll('[data-pick]'), {
    autoAlpha: 0,
    y: 24,
    stagger: 0.08,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.value, start: 'top 82%', once: true },
  })
})
</script>

<template>
  <section v-if="galleryPicks.some((pick) => pick.photo)" class="bg-ivory">
    <div ref="root" class="mx-auto max-w-[1400px] px-6 py-16 sm:px-10 md:px-14 md:py-24">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-xl">
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Gallery</p>
          <h2 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">
            A glimpse of the room.
          </h2>
        </div>
        <RouterLink
          to="/gallery"
          class="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-terracotta underline-offset-4 hover:underline"
        >
          View gallery →
        </RouterLink>
      </div>

      <div class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="pick in galleryPicks"
          :key="pick.id"
          data-pick
          class="overflow-hidden rounded-2xl border border-espresso/10"
        >
          <img
            v-if="pick.photo"
            :src="pick.photo.image_url"
            :alt="pick.photo.caption ?? 'Boulalulue gallery photo'"
            loading="lazy"
            class="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
          />
        </div>
      </div>
    </div>
  </section>
</template>
