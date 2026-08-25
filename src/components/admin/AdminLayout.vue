<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { profile, role, signOut } = useAuth()

const navLinks = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Menu', to: '/admin/menu' },
  { label: 'Gallery', to: '/admin/gallery', adminOnly: true },
  { label: 'Reservations', to: '/admin/reservations', adminOnly: true },
  { label: 'Homepage', to: '/admin/homepage', adminOnly: true },
  { label: 'Location', to: '/admin/location', adminOnly: true },
  { label: 'Reviews', to: '/admin/reviews', adminOnly: true },
  { label: 'Users', to: '/admin/users', superAdminOnly: true },
  { label: 'Settings', to: '/admin/settings', superAdminOnly: true },
]

const visibleLinks = computed(() =>
  navLinks.filter((link) => {
    if (link.superAdminOnly && role.value !== 'super_admin') return false
    if (link.adminOnly && role.value === 'staff') return false
    return true
  }),
)

async function handleLogout() {
  await signOut()
  void router.replace('/admin/login')
}
</script>

<template>
  <div class="min-h-[100dvh] bg-cream">
    <header class="border-b border-espresso/10 bg-white">
      <div class="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
        <RouterLink to="/admin" class="font-serif text-xl text-espresso">
          Boulalulue <span class="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">Admin</span>
        </RouterLink>

        <nav class="flex flex-1 gap-1 overflow-x-auto" aria-label="Admin navigation">
          <RouterLink
            v-for="link in visibleLinks"
            :key="link.to"
            :to="link.to"
            class="shrink-0 rounded-lg px-3.5 py-2 font-sans text-sm font-medium text-espresso/70 transition-colors duration-200 hover:bg-espresso/5 hover:text-espresso"
            :class="route.path === link.to ? 'bg-espresso/10 text-espresso' : ''"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="flex items-center gap-3">
          <span
            class="rounded-full px-2.5 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
            :class="role === 'staff' ? 'bg-espresso/10 text-espresso/70' : 'bg-gold/20 text-terracotta'"
          >
            {{ role }}
          </span>
          <span class="hidden font-sans text-xs text-espresso/50 sm:inline">{{ profile?.full_name }}</span>
          <button
            type="button"
            class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/70 transition-colors duration-200 hover:border-terracotta hover:text-terracotta"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
      <slot />
    </main>
  </div>
</template>
