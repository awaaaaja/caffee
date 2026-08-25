import { ref } from 'vue'
import type { Database } from '../types/database'
import { supabase } from '../lib/supabase'

export type MenuCategory = Database['public']['Tables']['categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuVariant = Database['public']['Tables']['menu_variants']['Row']
export type MenuAddon = Database['public']['Tables']['menu_addons']['Row']

export type MenuItemDetails = {
  variants: MenuVariant[]
  addons: MenuAddon[]
}

export function formatPrice(price: number): string {
  return `${price / 1000}K`
}

// ponytail: cache per SPA session di level modul — cukup untuk menu yang jarang berubah
const sessionCache: { data: { categories: MenuCategory[]; items: MenuItem[] } | null } = { data: null }
const detailsCache = new Map<string, MenuItemDetails>()
const categories = ref<MenuCategory[]>([])
const items = ref<MenuItem[]>([])
const loading = ref(sessionCache.data === null)
const error = ref(false)

// dipanggil admin CMS setelah mutasi agar sesi browser yang sama melihat data baru
export function clearMenuCache(): void {
  sessionCache.data = null
  detailsCache.clear()
  categories.value = []
  items.value = []
  loading.value = true
}

export function useMenu() {
  async function load(): Promise<void> {
    if (sessionCache.data) {
      categories.value = sessionCache.data.categories
      items.value = sessionCache.data.items
      return
    }

    loading.value = true
    error.value = false

    const [categoriesResult, itemsResult] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
    ])

    if (categoriesResult.error || itemsResult.error) {
      error.value = true
      loading.value = false
      return
    }

    sessionCache.data = {
      categories: categoriesResult.data ?? [],
      items: itemsResult.data ?? [],
    }
    categories.value = sessionCache.data.categories
    items.value = sessionCache.data.items
    loading.value = false
  }

  async function loadItemDetails(itemId: string): Promise<MenuItemDetails> {
    const cached = detailsCache.get(itemId)
    if (cached) return cached

    const [variantsResult, linksResult] = await Promise.all([
      supabase.from('menu_variants').select('*').eq('menu_item_id', itemId),
      supabase.from('menu_item_addons').select('addon_id').eq('menu_item_id', itemId),
    ])

    const addonIds = (linksResult.data ?? []).map((link) => link.addon_id)
    const addons = addonIds.length
      ? await supabase.from('menu_addons').select('*').in('id', addonIds)
      : null

    const details: MenuItemDetails = {
      variants: variantsResult.data ?? [],
      addons: addons?.data ?? [],
    }
    detailsCache.set(itemId, details)
    return details
  }

  return { categories, items, loading, error, load, loadItemDetails }
}
