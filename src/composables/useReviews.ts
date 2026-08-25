import { ref, shallowRef } from 'vue'
import type { Database } from '../types/database'
import { supabase } from '../lib/supabase'

export type Review = Database['public']['Tables']['reviews']['Row']

// ponytail: cache per SPA session di level modul, pola sama dengan useGallery
const sessionCache: { data: Review[] | null } = { data: null }
const reviews = shallowRef<Review[]>([])
const loading = ref(sessionCache.data === null)
const error = ref(false)

export function useReviews() {
  async function load(): Promise<void> {
    if (sessionCache.data) {
      reviews.value = sessionCache.data
      return
    }

    loading.value = true
    error.value = false

    const { data, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (fetchError) {
      error.value = true
      loading.value = false
      return
    }

    sessionCache.data = data ?? []
    reviews.value = sessionCache.data
    loading.value = false
  }

  return { reviews, loading, error, load }
}
