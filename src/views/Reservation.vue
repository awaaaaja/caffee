<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import ReservationForm from '../components/reservation/ReservationForm.vue'
import ReservationConfirmation from '../components/reservation/ReservationConfirmation.vue'
import type { ConfirmedReservation } from '../components/reservation/ReservationForm.vue'

const confirmedReservation = ref<ConfirmedReservation | null>(null)
</script>

<template>
  <main class="min-h-[100dvh] bg-cream px-6 pb-24 pt-28 sm:px-10 md:px-14 md:pt-36">
    <Navbar />
    <div class="mx-auto max-w-2xl">
      <header v-if="!confirmedReservation" class="mb-10 text-center">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">Reservation</p>
        <h1 class="mt-3 font-serif text-4xl leading-tight text-espresso md:text-5xl">Reserve a table.</h1>
        <p class="mt-4 font-sans text-base leading-relaxed text-espresso/70">
          Tell us when, and we will keep a warm table ready.
        </p>
      </header>

      <ReservationForm v-if="!confirmedReservation" @confirmed="confirmedReservation = $event" />
      <ReservationConfirmation
        v-else
        :reservation="confirmedReservation"
        @reset="confirmedReservation = null"
      />
    </div>
  </main>
</template>
