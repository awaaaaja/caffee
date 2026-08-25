<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type Reservation = Database['public']['Tables']['reservations']['Row']
type StatusLog = Database['public']['Tables']['reservation_status_logs']['Row']
type Status = 'pending' | 'confirmed' | 'rejected' | 'rescheduled' | 'cancelled'

const reservations = shallowRef<Reservation[]>([])
const logs = shallowRef<StatusLog[]>([])
const loading = ref(true)
const actionError = ref('')
const statusFilter = ref<'all' | Status>('all')
const rescheduling = ref<Reservation | null>(null)
const rescheduleDate = ref('')
const rescheduleTime = ref('')

const filtered = computed(() =>
  statusFilter.value === 'all'
    ? reservations.value
    : reservations.value.filter((r) => r.status === statusFilter.value),
)

async function refresh() {
  loading.value = true
  const [resRes, logRes] = await Promise.all([
    supabase.from('reservations').select('*').order('reservation_date', { ascending: false }).order('reservation_time'),
    supabase.from('reservation_status_logs').select('*').order('changed_at', { ascending: false }).limit(50),
  ])
  if (resRes.error || logRes.error) {
    actionError.value = (resRes.error ?? logRes.error)?.message ?? 'Failed to load.'
    loading.value = false
    return
  }
  reservations.value = resRes.data ?? []
  logs.value = logRes.data ?? []
  loading.value = false
}

onMounted(refresh)

async function changeStatus(reservation: Reservation, newStatus: Status) {
  actionError.value = ''
  const { error } = await supabase.rpc('change_reservation_status', {
    p_reservation_id: reservation.id,
    p_new_status: newStatus,
  })
  if (error) {
    actionError.value = error.message
    return
  }
  await refresh()
}

function openReschedule(reservation: Reservation) {
  rescheduling.value = reservation
  rescheduleDate.value = reservation.reservation_date
  rescheduleTime.value = reservation.reservation_time
}

async function confirmReschedule() {
  const reservation = rescheduling.value
  if (!reservation || !rescheduleDate.value || !rescheduleTime.value) return
  actionError.value = ''
  const { error } = await supabase.rpc('change_reservation_status', {
    p_reservation_id: reservation.id,
    p_new_status: 'rescheduled',
    p_new_date: rescheduleDate.value,
    p_new_time: rescheduleTime.value,
  })
  if (error) {
    actionError.value = error.message
    return
  }
  rescheduling.value = null
  await refresh()
}

const statusStyles: Record<Status, string> = {
  pending: 'bg-gold/20 text-terracotta',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-espresso/10 text-espresso/60',
}
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Reservations</h1>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="filter in ['all', 'pending', 'confirmed', 'rescheduled', 'rejected', 'cancelled'] as const"
        :key="filter"
        type="button"
        class="rounded-full border px-4 py-1.5 font-sans text-xs font-semibold capitalize transition-colors duration-200"
        :class="statusFilter === filter ? 'border-espresso bg-espresso text-cream' : 'border-espresso/15 text-espresso/60 hover:text-espresso'"
        @click="statusFilter = filter"
      >
        {{ filter }}
      </button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3" aria-label="Loading reservations">
      <div v-for="index in 4" :key="index" class="h-16 animate-pulse rounded-xl bg-espresso/10" />
    </div>

    <div v-else class="mt-6 space-y-3">
      <div
        v-for="reservation in filtered"
        :key="reservation.id"
        class="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-espresso/10 bg-white px-5 py-4"
      >
        <div class="min-w-44">
          <p class="font-sans text-sm font-semibold text-espresso">{{ reservation.customer_name }}</p>
          <p class="font-sans text-xs text-espresso/50">{{ reservation.phone }}</p>
        </div>
        <div class="font-sans text-sm text-espresso/80">
          {{ reservation.reservation_date }} · {{ reservation.reservation_time.slice(0, 5) }} · {{ reservation.guests }} guests
        </div>
        <p v-if="reservation.notes" class="max-w-56 truncate font-sans text-xs italic text-espresso/50">
          “{{ reservation.notes }}”
        </p>
        <span class="rounded-full px-2.5 py-1 font-sans text-xs font-semibold" :class="statusStyles[reservation.status as Status] ?? 'bg-espresso/10'">
          {{ reservation.status }}
        </span>

        <div class="ml-auto flex flex-wrap gap-2">
          <button
            v-if="reservation.status === 'pending'"
            type="button"
            class="rounded-lg bg-espresso px-3 py-1.5 font-sans text-xs font-semibold text-cream hover:bg-terracotta"
            @click="changeStatus(reservation, 'confirmed')"
          >
            Confirm
          </button>
          <button
            v-if="reservation.status === 'pending' || reservation.status === 'confirmed'"
            type="button"
            class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/70 hover:border-terracotta hover:text-terracotta"
            @click="openReschedule(reservation)"
          >
            Reschedule
          </button>
          <button
            v-if="reservation.status === 'pending'"
            type="button"
            class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta"
            @click="changeStatus(reservation, 'rejected')"
          >
            Reject
          </button>
          <button
            v-if="reservation.status === 'pending' || reservation.status === 'confirmed' || reservation.status === 'rescheduled'"
            type="button"
            class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta"
            @click="changeStatus(reservation, 'cancelled')"
          >
            Cancel
          </button>
        </div>
      </div>

      <p v-if="!filtered.length" class="rounded-xl border border-espresso/10 bg-white px-5 py-8 text-center font-sans text-sm text-espresso/50">
        No reservations in this filter.
      </p>
    </div>

    <!-- Reschedule dialog -->
    <Teleport to="body">
      <div v-if="rescheduling" class="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Reschedule reservation">
        <div class="absolute inset-0 bg-espresso/70 backdrop-blur-sm" @click="rescheduling = null" />
        <div class="relative w-full max-w-sm rounded-3xl bg-white p-7">
          <h2 class="font-serif text-xl text-espresso">Reschedule — {{ rescheduling.customer_name }}</h2>
          <div class="mt-4 space-y-3">
            <div>
              <label for="rs-date" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">New date</label>
              <input id="rs-date" v-model="rescheduleDate" type="date" class="mt-1 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
            <div>
              <label for="rs-time" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">New time</label>
              <input id="rs-time" v-model="rescheduleTime" type="time" class="mt-1 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="rounded-xl border border-espresso/15 px-4 py-2 font-sans text-sm font-semibold text-espresso/70" @click="rescheduling = null">
              Cancel
            </button>
            <button type="button" class="rounded-xl bg-espresso px-5 py-2 font-sans text-sm font-semibold text-cream hover:bg-terracotta" @click="confirmReschedule">
              Save
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Status log -->
    <div class="mt-10">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-espresso/70">Recent status changes</h2>
      <ul v-if="logs.length" class="mt-3 space-y-2">
        <li
          v-for="log in logs.slice(0, 10)"
          :key="log.id"
          class="rounded-xl border border-espresso/10 bg-white px-5 py-3 font-sans text-xs text-espresso/70"
        >
          {{ log.changed_at ? new Date(log.changed_at).toLocaleString('en-ID') : '' }} —
          <span class="font-semibold">{{ log.old_status ?? '—' }}</span> →
          <span class="font-semibold text-terracotta">{{ log.new_status }}</span>
          <span class="text-espresso/40"> ({{ log.reservation_id?.slice(0, 8) }}…)</span>
        </li>
      </ul>
      <p v-else class="mt-3 font-sans text-sm text-espresso/50">No status changes yet.</p>
    </div>
  </AdminLayout>
</template>
