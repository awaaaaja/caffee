<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useHomepageContent } from '../../composables/useHomepageContent'
import { useMenu } from '../../composables/useMenu'
import BaseButton from '../ui/BaseButton.vue'
import MenuCard from '../menu/MenuCard.vue'
import MenuItemModal from '../menu/MenuItemModal.vue'
import type { MenuItem } from '../../composables/useMenu'
import { ref } from 'vue'

const { section, load: loadContent } = useHomepageContent()
const { categories, items, load } = useMenu()
const activeItem = ref<MenuItem | null>(null)

const viennoiserie = computed(() => section('viennoiserie'))

// Kategori pastry (group_type 'pastry') + croissant-savoury sebagai identitas brand (PRD.md §5.5)
const pastryItems = computed(() => {
  const pastryIds = new Set(
    categories.value
      .filter((category) => category.group_type === 'pastry' || category.slug === 'croissant-savoury')
      .map((category) => category.id),
  )
  return items.value.filter((item) => item.category_id && pastryIds.has(item.category_id))
})

onMounted(() => {
  void load()
  void loadContent()
})
</script>

<template>
  <section class="bg-espresso text-cream">
    <div class="mx-auto max-w-[1400px] px-6 py-16 sm:px-10 md:px-14 md:py-24">
      <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div class="max-w-xl">
          <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
            {{ viennoiserie?.subtitle ?? 'Viennoiserie' }}
          </p>
          <h2 class="mt-4 font-serif text-4xl leading-[1.05] md:text-5xl">
            {{ viennoiserie?.title ?? 'Viennoiserie at its finest.' }}
          </h2>
        </div>
        <p class="max-w-md font-sans text-sm leading-relaxed text-cream/70">
          {{ viennoiserie?.description }}
        </p>
      </div>

      <div
        v-if="pastryItems.length"
        class="-mx-6 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0"
      >
        <div
          v-for="item in pastryItems.slice(0, 3)"
          :key="item.id"
          class="w-[270px] shrink-0 snap-start md:w-auto"
        >
          <MenuCard :item="item" @open="activeItem = $event" />
        </div>
      </div>
      <p v-else class="mt-12 font-sans text-sm text-cream/50">
        Pastry selection is being updated — check the menu for the latest bake.
      </p>

      <div v-if="viennoiserie?.cta_label && viennoiserie?.cta_url" class="mt-10">
        <BaseButton variant="outline" :to="viennoiserie.cta_url" class="!border-cream/60 !text-cream hover:!border-gold hover:!text-gold">
          {{ viennoiserie.cta_label }}
        </BaseButton>
      </div>
    </div>

    <MenuItemModal v-if="activeItem" :item="activeItem" @close="activeItem = null" />
  </section>
</template>
