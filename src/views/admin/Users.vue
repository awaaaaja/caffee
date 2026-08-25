<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

const profiles = shallowRef<Profile[]>([])
const loading = ref(true)
const actionError = ref('')
const savedId = ref<string | null>(null)

async function refresh() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) {
    actionError.value = error.message
    return
  }
  profiles.value = data ?? []
}

onMounted(async () => {
  await refresh()
  loading.value = false
})

async function changeRole(profile: Profile, role: string) {
  actionError.value = ''
  const { error } = await supabase.from('profiles').update({ role }).eq('id', profile.id)
  if (error) {
    actionError.value = error.message
    return
  }
  profile.role = role as Profile['role']
  savedId.value = profile.id
  setTimeout(() => { savedId.value = null }, 2000)
}

async function renameProfile(profile: Profile, fullName: string) {
  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id)
  if (error) {
    actionError.value = error.message
    return
  }
  profile.full_name = fullName
}
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Users & roles</h1>
    <p class="mt-1 font-sans text-sm text-espresso/60">
      Kelola role akun yang sudah ada. Undang user baru dilakukan via Supabase Dashboard → Authentication
      (butuh service role, tidak diekspos ke client demi keamanan).
    </p>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <div v-if="loading" class="mt-6 space-y-3" aria-label="Loading users">
      <div v-for="index in 3" :key="index" class="h-16 animate-pulse rounded-xl bg-espresso/10" />
    </div>

    <div v-else class="mt-6 max-w-3xl space-y-3">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-espresso/10 bg-white px-5 py-4"
      >
        <div class="min-w-44 flex-1">
          <input
            :value="profile.full_name"
            type="text"
            class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-sans text-sm font-semibold text-espresso hover:border-espresso/15 focus:border-espresso/30 focus:outline-none"
            :aria-label="`Full name of ${profile.full_name ?? 'user'}`"
            @change="renameProfile(profile, ($event.target as HTMLInputElement).value)"
          />
          <p class="px-2 font-sans text-xs text-espresso/40">{{ profile.id.slice(0, 8) }}…</p>
        </div>
        <select
          :value="profile.role"
          class="rounded-xl border border-espresso/15 bg-cream/40 px-3 py-2 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50"
          :aria-label="`Role of ${profile.full_name ?? 'user'}`"
          @change="changeRole(profile, ($event.target as HTMLSelectElement).value)"
        >
          <option value="staff">staff</option>
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
        <span v-if="savedId === profile.id" class="font-sans text-xs font-semibold text-green-700">Saved</span>
      </div>
    </div>
  </AdminLayout>
</template>
