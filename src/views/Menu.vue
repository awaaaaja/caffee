<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenu, type MenuItem } from '../composables/useMenu'
import MenuFilter from '../components/menu/MenuFilter.vue'
import MenuCard from '../components/menu/MenuCard.vue'
import MenuItemModal from '../components/menu/MenuItemModal.vue'
import Navbar from '../components/layout/Navbar.vue'

const route = useRoute()
const router = useRouter()
const { categories, items, loading, error, load } = useMenu()

const activeSlug = ref(typeof route.params.categorySlug === 'string' ? route.params.categorySlug : 'all')
const activeItem = ref<MenuItem | null>(null)

watch(
  () => route.params.categorySlug,
  (slug) => {
    activeSlug.value = typeof slug === 'string' ? slug : 'all'
  },
)

function setFilter(slug: string) {
  if (slug === activeSlug.value) return
  activeSlug.value = slug
  void router.replace(slug === 'all' ? '/menu' : `/menu/${slug}`)
}

const filteredItems = computed(() => {
  if (activeSlug.value === 'all') return items.value
  const category = categories.value.find((entry) => entry.slug === activeSlug.value)
  return category ? items.value.filter((item) => item.category_id === category.id) : []
})

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="min-h-[100dvh] bg-cream px-6 pb-24 pt-28 sm:px-10 md:px-14 md:pt-36">
    <Navbar />
    <div class="mx-auto max-w-[1400px]">
      <header class="max-w-2xl">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Menu</p>
        <h1 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">
          Every dish carries a touch of comfort.
        </h1>
        <p class="mt-4 font-sans text-base leading-relaxed text-espresso/70">
          Nusantara warmth beside familiar classics, pastas to linger over, and drinks that speak softly.
        </p>
      </header>

      <div v-if="!loading && !error" class="mt-10">
        <MenuFilter :categories="categories" :model-value="activeSlug" @update:model-value="setFilter" />
      </div>

      <div v-if="loading" class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading menu">
        <div v-for="index in 6" :key="index" class="animate-pulse">
          <div class="aspect-[4/3] w-full rounded-2xl bg-espresso/10" />
        </div>
      </div>

      <div v-else-if="error" class="mt-16 flex flex-col items-center gap-4 text-center">
        <p class="font-serif text-2xl text-espresso">Menu is unavailable right now.</p>
        <p class="font-sans text-sm text-espresso/60">Please try again in a moment.</p>
        <button
          type="button"
          class="rounded-full border border-gold px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso transition-colors duration-300 hover:bg-gold/10"
          @click="load()"
        >
          Retry
        </button>
      </div>

      <template v-else>
        <Transition name="menu-fade" mode="out-in">
          <div
            :key="activeSlug"
            class="menu-grid -mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3"
          >
            <div
              v-for="(item, index) in filteredItems"
              :key="item.id"
              class="menu-item w-[270px] shrink-0 snap-start md:w-auto"
              :style="{ '--i': index }"
            >
              <MenuCard :item="item" @open="activeItem = $event" />
            </div>
          </div>
        </Transition>

        <div
          v-if="filteredItems.length === 0"
          class="mt-16 flex flex-col items-center gap-4 text-center"
        >
          <p class="font-serif text-2xl text-espresso">No items in this category yet.</p>
          <button
            type="button"
            class="rounded-full border border-gold px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-espresso transition-colors duration-300 hover:bg-gold/10"
            @click="setFilter('all')"
          >
            View all menu
          </button>
        </div>
      </template>
    </div>

    <MenuItemModal v-if="activeItem" :item="activeItem" @close="activeItem = null" />
  </main>
</template>

<style scoped>
.menu-fade-enter-active .menu-item {
  animation: menu-card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 45ms);
}

.menu-fade-leave-active {
  transition: opacity 0.15s ease;
}

.menu-fade-leave-to {
  opacity: 0;
}

@keyframes menu-card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-fade-enter-active .menu-item {
    animation: none;
  }

  .menu-fade-leave-active {
    transition: none;
  }
}
</style>
