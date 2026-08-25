<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGsap } from '../../composables/useGsap'
import BaseButton from '../ui/BaseButton.vue'

type NavState = 'transparent' | 'glass' | 'compact'

const navLinks = [
  { label: 'Menu', to: '/menu' },
  { label: 'Story', to: '/story' },
  { label: 'Experience', to: '/experience' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Location', to: '/location' },
]

const navState = ref<NavState>('transparent')
const mobileOpen = ref(false)
const { ScrollTrigger } = useGsap()
let stateTrigger: ReturnType<typeof ScrollTrigger.create> | undefined
let previousOverflow = ''

const stateClasses: Record<NavState, string> = {
  transparent: 'border-transparent bg-transparent',
  glass: 'glass-nav rounded-full',
  compact: 'glass-nav rounded-full scale-[0.98]',
}

const mobileButtonLabel = computed(() => (mobileOpen.value ? 'Close navigation' : 'Open navigation'))

// State transparent hanya untuk homepage (di atas hero gelap).
// Halaman lain ber-background cream — mulai dari glass agar selalu terlihat.
const route = useRoute()
const isImmersive = computed(() => route.path === '/')

function updateState(scrollY: number) {
  if (!isImmersive.value) {
    navState.value = scrollY > 500 ? 'compact' : 'glass'
    return
  }
  navState.value = scrollY > 500 ? 'compact' : scrollY > 100 ? 'glass' : 'transparent'
}

watch(isImmersive, () => updateState(window.scrollY))

function toggleMobileMenu() {
  if (mobileOpen.value) {
    closeMobileMenu()
  } else {
    openMobileMenu()
  }
}

function openMobileMenu() {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  mobileOpen.value = true
}

function closeMobileMenu() {
  mobileOpen.value = false
  document.body.style.overflow = previousOverflow
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && mobileOpen.value) closeMobileMenu()
}

onMounted(() => {
  updateState(window.scrollY)
  stateTrigger = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 1),
    onUpdate: (self) => updateState(self.scroll()),
  })
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stateTrigger?.kill()
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <header
    data-site-navbar
    class="fixed inset-x-0 top-0 z-40 px-4 pt-4 transition-[background-color,border-color,box-shadow,transform] duration-500 md:left-[5%] md:right-[5%] md:px-0 md:pt-5"
  >
    <nav
      :class="[
        'mx-auto flex w-full items-center justify-between border px-5 text-cream transition-[background-color,border-color,box-shadow,transform] duration-500 md:px-7',
        stateClasses[navState],
        'max-md:border-gold/20 max-md:bg-espresso/90 max-md:backdrop-blur-md',
        navState === 'compact' ? 'py-2.5' : 'py-4',
      ]"
      aria-label="Main navigation"
    >
      <RouterLink
        class="relative z-10 font-serif text-2xl leading-none tracking-wide text-cream transition-transform duration-500 md:text-3xl"
        :class="navState === 'compact' ? 'md:scale-90' : ''"
        to="/"
        aria-label="Boulalulue home"
      >
        Boulalulue
      </RouterLink>

      <div class="hidden items-center gap-7 lg:flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-cream/80 transition-colors duration-300 hover:text-gold"
        >
          {{ link.label }}
        </RouterLink>
        <BaseButton
          variant="outline"
          to="/reservation"
          class="!px-5 !py-2 !text-[0.65rem] !text-cream !border-cream/60 hover:!border-gold hover:!text-gold"
        >
          Reserve
        </BaseButton>
      </div>

      <button
        class="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-1.5 text-cream lg:hidden"
        type="button"
        :aria-label="mobileButtonLabel"
        :aria-expanded="mobileOpen"
        aria-controls="mobile-navigation"
        @click="toggleMobileMenu"
      >
        <span
          class="block h-px w-6 origin-center bg-current transition-transform duration-300"
          :class="mobileOpen ? 'translate-y-2 rotate-45' : ''"
        />
        <span
          class="block h-px w-6 bg-current transition-opacity duration-300"
          :class="mobileOpen ? 'opacity-0' : ''"
        />
        <span
          class="block h-px w-6 origin-center bg-current transition-transform duration-300"
          :class="mobileOpen ? '-translate-y-2 -rotate-45' : ''"
        />
      </button>
    </nav>
  </header>

  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="mobileOpen"
      id="mobile-navigation"
      class="fixed inset-0 z-50 flex min-h-[100dvh] flex-col bg-espresso px-6 pb-8 pt-6 text-cream"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <div class="flex items-center justify-between">
        <RouterLink class="font-serif text-2xl" to="/" aria-label="Boulalulue home" @click="closeMobileMenu">
          Boulalulue
        </RouterLink>
        <button
          class="flex h-10 w-10 flex-col items-center justify-center gap-1.5 text-cream"
          type="button"
          aria-label="Close navigation"
          @click="closeMobileMenu"
        >
          <span class="block h-px w-6 rotate-45 bg-current" />
          <span class="-mt-1.5 block h-px w-6 -rotate-45 bg-current" />
        </button>
      </div>

      <nav class="mt-20 flex flex-col items-start gap-5" aria-label="Mobile links">
        <RouterLink
          v-for="(link, index) in navLinks"
          :key="link.to"
          :to="link.to"
          class="font-serif text-4xl leading-none text-cream transition-colors duration-300 hover:text-gold"
          :style="{ transitionDelay: `${index * 40}ms` }"
          @click="closeMobileMenu"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink
          class="mt-5 border-b border-gold pb-2 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold"
          to="/reservation"
          @click="closeMobileMenu"
        >
          Reserve a Table
        </RouterLink>
      </nav>

      <p class="mt-auto font-sans text-xs uppercase tracking-[0.3em] text-cream/50">
        Baked with precision
      </p>
    </div>
  </Transition>
</template>
