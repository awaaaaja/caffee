<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type Setting = Database['public']['Tables']['site_settings']['Row']

const settings = shallowRef<Setting[]>([])
const loading = ref(true)
const actionError = ref('')
const savedKey = ref<string | null>(null)

const newSetting = ref({ key: '', value: '{}' })

async function refresh() {
  const { data, error } = await supabase.from('site_settings').select('*').order('key')
  if (error) {
    actionError.value = error.message
    return
  }
  settings.value = data ?? []
}

onMounted(async () => {
  await refresh()
  loading.value = false
})

async function saveValue(setting: Setting, rawValue: string) {
  actionError.value = ''
  let parsed: Database['public']['Tables']['site_settings']['Insert']['value']
  try {
    parsed = JSON.parse(rawValue) as Database['public']['Tables']['site_settings']['Insert']['value']
  } catch {
    actionError.value = `Value for "${setting.key}" must be valid JSON.`
    return
  }
  const { error } = await supabase.from('site_settings').update({ value: parsed }).eq('key', setting.key)
  if (error) {
    actionError.value = error.message
    return
  }
  savedKey.value = setting.key
  setTimeout(() => { savedKey.value = null }, 2000)
}

async function addSetting() {
  actionError.value = ''
  let parsed: Database['public']['Tables']['site_settings']['Insert']['value']
  try {
    parsed = JSON.parse(newSetting.value.value) as Database['public']['Tables']['site_settings']['Insert']['value']
  } catch {
    actionError.value = 'Value must be valid JSON (e.g. {"instagram": "..."})'
    return
  }
  if (!newSetting.value.key.trim()) return
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: newSetting.value.key.trim(), value: parsed })
  if (error) {
    actionError.value = error.message
    return
  }
  newSetting.value = { key: '', value: '{}' }
  await refresh()
}

async function deleteSetting(setting: Setting) {
  if (!confirm(`Delete setting "${setting.key}"?`)) return
  const { error } = await supabase.from('site_settings').delete().eq('key', setting.key)
  if (error) {
    actionError.value = error.message
    return
  }
  await refresh()
}
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Site settings</h1>
    <p class="mt-1 font-sans text-sm text-espresso/60">
      Key-value store untuk pengaturan situs (social links, SEO default, dsb). Value harus JSON.
    </p>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <div class="mt-6 max-w-3xl rounded-2xl border border-espresso/10 bg-white p-5">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-espresso/60">Add / update setting</h2>
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1.4fr_auto]">
        <input v-model="newSetting.key" type="text" placeholder="key (e.g. social.instagram)" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        <input v-model="newSetting.value" type="text" placeholder='{"handle": "boulalulue"}' class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        <button type="button" class="rounded-xl bg-espresso px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream hover:bg-terracotta" @click="addSetting">
          Save
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 max-w-3xl space-y-3" aria-label="Loading settings">
      <div v-for="index in 2" :key="index" class="h-16 animate-pulse rounded-xl bg-espresso/10" />
    </div>

    <div v-else class="mt-6 max-w-3xl space-y-3">
      <div
        v-for="setting in settings"
        :key="setting.key"
        class="rounded-xl border border-espresso/10 bg-white px-5 py-4"
      >
        <div class="flex items-center justify-between gap-4">
          <p class="font-sans text-sm font-semibold text-espresso">{{ setting.key }}</p>
          <div class="flex items-center gap-2">
            <span v-if="savedKey === setting.key" class="font-sans text-xs font-semibold text-green-700">Saved</span>
            <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="deleteSetting(setting)">
              Delete
            </button>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <input
            :value="JSON.stringify(setting.value)"
            type="text"
            class="w-full rounded-lg border border-espresso/15 bg-cream/40 px-3 py-2 font-mono text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50"
            :aria-label="`Value of ${setting.key}`"
            @change="saveValue(setting, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <p class="mt-1 font-sans text-[0.65rem] text-espresso/40">Updated {{ setting.updated_at ? new Date(setting.updated_at).toLocaleString('en-ID') : '—' }}</p>
      </div>
      <p v-if="!settings.length" class="rounded-xl border border-espresso/10 bg-white px-5 py-8 text-center font-sans text-sm text-espresso/50">
        No settings yet — add the first key above.
      </p>
    </div>
  </AdminLayout>
</template>
