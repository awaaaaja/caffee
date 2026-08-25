<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../composables/useAuth'
import type { Database } from '../../types/database'

type Reservation = Database['public']['Tables']['reservations']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row']

const { isAdmin } = useAuth()

const today = new Date()
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const reservationsToday = shallowRef<Reservation[]>([])
const reservationsLoading = ref(true)
const activeMenuCount = ref<number | null>(null)
const categoryCount = ref<number | null>(null)
const featuredItems = shallowRef<MenuItem[]>([])
const menuLoading = ref(true)

const pendingToday = computed(() => reservationsToday.value.filter((r) => r.status === 'pending').length)

onMounted(async () => {
  // Menu aktif + kategori: publik read, semua role bisa melihat
  const [activeRes, catRes, featuredRes] = await Promise.all([
    supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('is_available', true),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('menu_items').select('*').or('is_featured.eq.true,is_signature.eq.true').order('name').limit(6),
  ])
  activeMenuCount.value = activeRes.count ?? 0
  categoryCount.value = catRes.count ?? 0
  featuredItems.value = featuredRes.data ?? []
  menuLoading.value = false

  // Reservasi: hanya admin+ (RLS menolak staff — tampilkan pesan sesuai)
  if (isAdmin.value) {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_date', todayString)
      .order('reservation_time')
    reservationsToday.value = data ?? []
  }
  reservationsLoading.value = false
})
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Dashboard</h1>
    <p class="mt-1 font-sans text-sm text-espresso/60">{{ todayString }}</p>

    <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-2xl border border-espresso/10 bg-white p-6">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-espresso/50">
          Reservations today
        </p>
        <p v-if="isAdmin" class="mt-2 font-serif text-4xl text-espresso">{{ reservationsToday.length }}</p>
        <p v-else class="mt-2 font-sans text-sm text-espresso/40">Admin access required</p>
        <p v-if="isAdmin && !reservationsLoading" class="mt-1 font-sans text-xs text-terracotta">
          {{ pendingToday }} pending confirmation
        </p>
      </div>

      <div class="rounded-2xl border border-espresso/10 bg-white p-6">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-espresso/50">
          Active menu items
        </p>
        <p class="mt-2 font-serif text-4xl text-espresso">{{ activeMenuCount ?? '…' }}</p>
      </div>

      <div class="rounded-2xl border border-espresso/10 bg-white p-6">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-espresso/50">
          Categories
        </p>
        <p class="mt-2 font-serif text-4xl text-espresso">{{ categoryCount ?? '…' }}</p>
      </div>
    </div>

    <div v-if="isAdmin" class="mt-8">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-espresso/70">
        Reservations today
      </h2>
      <div class="mt-3 overflow-hidden rounded-2xl border border-espresso/10 bg-white">
        <table v-if="reservationsToday.length" class="w-full text-left">
          <thead>
            <tr class="border-b border-espresso/10 font-sans text-xs uppercase tracking-[0.12em] text-espresso/50">
              <th class="px-5 py-3">Time</th>
              <th class="px-5 py-3">Guest</th>
              <th class="px-5 py-3">Guests</th>
              <th class="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-espresso/5 font-sans text-sm">
            <tr v-for="reservation in reservationsToday" :key="reservation.id">
              <td class="px-5 py-3 font-semibold text-espresso">{{ reservation.reservation_time.slice(0, 5) }}</td>
              <td class="px-5 py-3 text-espresso/80">{{ reservation.customer_name }}</td>
              <td class="px-5 py-3 text-espresso/80">{{ reservation.guests }}</td>
              <td class="px-5 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="reservation.status === 'pending' ? 'bg-gold/20 text-terracotta' : 'bg-espresso/10 text-espresso/70'"
                >
                  {{ reservation.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="px-5 py-6 font-sans text-sm text-espresso/50">
          No reservations for today.
        </p>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-espresso/70">
        Featured & signature menu
        <span class="ml-1 font-normal normal-case text-espresso/40">(stand-in for popular items until order data exists)</span>
      </h2>
      <div v-if="menuLoading" class="mt-3 flex gap-4 overflow-hidden" aria-label="Loading">
        <div v-for="index in 3" :key="index" class="h-20 w-64 animate-pulse rounded-xl bg-espresso/10" />
      </div>
      <div v-else-if="featuredItems.length" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in featuredItems"
          :key="item.id"
          class="flex items-center gap-3 rounded-xl border border-espresso/10 bg-white px-4 py-3"
        >
          <span class="font-serif text-lg text-espresso">{{ item.name }}</span>
          <span
            v-if="item.is_signature"
            class="ml-auto rounded-full bg-gold/20 px-2 py-0.5 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-terracotta"
          >
            Signature
          </span>
        </div>
      </div>
      <p v-else class="mt-3 font-sans text-sm text-espresso/50">
        No featured items — set featured/signature flags in Menu management.
      </p>
    </div>
  </AdminLayout>
</template>
