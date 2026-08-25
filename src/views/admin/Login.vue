<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { init, session, profile, signIn } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const submitting = ref(false)

onMounted(async () => {
  await init()
  if (session.value && userHasRole(profile.value)) {
    void router.replace(redirectTarget())
  }
})

function userHasRole(profile: { role: string } | null): boolean {
  return !!profile && ['staff', 'admin', 'super_admin'].includes(profile.role)
}

function redirectTarget(): string {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/admin') ? target : '/admin'
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Email and password are required.'
    return
  }
  submitting.value = true
  const { error } = await signIn(email.value.trim(), password.value)
  submitting.value = false

  if (error) {
    errorMessage.value = error === 'Invalid login credentials' ? 'Wrong email or password.' : error
    return
  }
  void router.replace(redirectTarget())
}
</script>

<template>
  <main class="flex min-h-[100dvh] items-center justify-center bg-cream px-6">
    <div class="w-full max-w-sm">
      <div class="text-center">
        <p class="font-serif text-3xl text-espresso">Boulalulue</p>
        <p class="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">
          Admin
        </p>
      </div>

      <form
        class="mt-8 rounded-2xl border border-espresso/10 bg-white p-7"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div>
          <label for="admin-email" class="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-espresso/70">
            Email
          </label>
          <input
            id="admin-email"
            v-model="email"
            type="email"
            autocomplete="username"
            class="mt-2 w-full rounded-xl border border-espresso/15 bg-cream/50 px-4 py-3 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        </div>
        <div class="mt-4">
          <label for="admin-password" class="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-espresso/70">
            Password
          </label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="mt-2 w-full rounded-xl border border-espresso/15 bg-cream/50 px-4 py-3 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        </div>

        <p v-if="errorMessage" class="mt-4 font-sans text-sm text-terracotta" role="alert">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="submitting"
          class="mt-6 w-full rounded-xl bg-espresso px-6 py-3 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-cream transition-colors duration-300 hover:bg-terracotta active:scale-[0.99] disabled:opacity-60"
        >
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-center font-sans text-xs text-espresso/40">
        <RouterLink to="/" class="underline-offset-2 hover:underline">← Back to site</RouterLink>
      </p>
    </div>
  </main>
</template>
