import { ref } from 'vue'
import type { Database } from '../types/database'
import { supabase } from '../lib/supabase'

export type GalleryPhoto = Database['public']['Tables']['gallery']['Row']

// ponytail: cache per SPA session di level modul, pola sama dengan useMenu
const sessionCache: { data: GalleryPhoto[] | null } = { data: null }
const photos = ref<GalleryPhoto[]>([])
const loading = ref(sessionCache.data === null)
const error = ref(false)

export function useGallery() {
  async function load(): Promise<void> {
    if (sessionCache.data) {
      photos.value = sessionCache.data
      return
    }

    loading.value = true
    error.value = false

    const { data, error: fetchError } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (fetchError) {
      error.value = true
      loading.value = false
      return
    }

    sessionCache.data = data ?? []
    photos.value = sessionCache.data
    loading.value = false
  }

  return { photos, loading, error, load }
}
