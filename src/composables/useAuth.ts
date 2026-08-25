import { computed, ref, shallowRef } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { supabase } from '../lib/supabase'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type AdminRole = 'staff' | 'admin' | 'super_admin'

// state module-level — di-share antar guard, layout, dan views
const session = shallowRef<Session | null>(null)
const user = shallowRef<User | null>(null)
const profile = shallowRef<Profile | null>(null)
const ready = ref(false)
let initPromise: Promise<void> | null = null

async function loadProfile(): Promise<void> {
  if (!user.value) return
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()
  profile.value = data ?? null
}

export function useAuth() {
  // restore sesi + pasang listener — aman dipanggil berulang
  function init(): Promise<void> {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
      if (user.value) await loadProfile()
      ready.value = true

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        if (user.value) await loadProfile()
        else profile.value = null
      })
    })()
    return initPromise
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  const role = computed<AdminRole | null>(() => (profile.value?.role as AdminRole) ?? null)
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'super_admin')
  const isSuperAdmin = computed(() => role.value === 'super_admin')

  return { session, user, profile, role, isAdmin, isSuperAdmin, ready, init, signIn, signOut }
}
