import { shallowRef, ref } from 'vue'
import type { Database } from '../types/database'
import { supabase } from '../lib/supabase'
import type { MenuItem } from './useMenu'

export type HomepageSection = Database['public']['Tables']['homepage_sections']['Row']
export type SignatureItemRow = Database['public']['Tables']['homepage_signature_items']['Row']
export type GalleryPickRow = Database['public']['Tables']['homepage_gallery_picks']['Row']

export type SectionStat = { label: string; value: string }
export type SectionStep = { key: string; title: string; description: string }

export function parseStats(extra: HomepageSection['extra']): SectionStat[] {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return []
  const stats = (extra as { stats?: unknown }).stats
  return Array.isArray(stats) ? (stats as SectionStat[]) : []
}

export function parseSteps(extra: HomepageSection['extra']): SectionStep[] {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return []
  const steps = (extra as { steps?: unknown }).steps
  return Array.isArray(steps) ? (steps as SectionStep[]) : []
}

export function parseBullets(extra: HomepageSection['extra']): string[] {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return []
  const bullets = (extra as { bullets?: unknown }).bullets
  return Array.isArray(bullets) ? (bullets as string[]) : []
}

export function parseExtraString(extra: HomepageSection['extra'], key: string): string | undefined {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return undefined
  const value = (extra as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

// ponytail: cache per SPA session di level modul, pola sama dengan useMenu.
// shallowRef: Row mengandung Json rekursif — deep unwrap Ref membuat TS2589.
const sessionCache: { data: HomepageSection[] | null } = { data: null }
const sections = shallowRef<HomepageSection[]>([])
const loading = ref(sessionCache.data === null)
const error = ref(false)

const signatureItems = shallowRef<(SignatureItemRow & { item: MenuItem | null })[]>([])
const galleryPicks = shallowRef<(GalleryPickRow & { photo: Database['public']['Tables']['gallery']['Row'] | null })[]>([])

export function useHomepageContent() {
  async function load(): Promise<void> {
    if (sessionCache.data) {
      sections.value = sessionCache.data
      return
    }

    loading.value = true
    error.value = false

    const [sectionsRes, signatureRes, picksRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('section_key'),
      supabase.from('homepage_signature_items').select('*').order('sort_order'),
      supabase.from('homepage_gallery_picks').select('*').order('sort_order'),
    ])

    if (sectionsRes.error) {
      error.value = true
      loading.value = false
      return
    }

    sessionCache.data = sectionsRes.data ?? []
    sections.value = sessionCache.data

    // join signature items dengan menu_items
    const sigRows = signatureRes.data ?? []
    const itemIds = sigRows.map((row) => row.menu_item_id).filter((id): id is string => !!id)
    if (itemIds.length) {
      const { data: items } = await supabase.from('menu_items').select('*').in('id', itemIds)
      const byId = new Map((items ?? []).map((item) => [item.id, item]))
      signatureItems.value = sigRows.map((row) => ({
        ...row,
        item: row.menu_item_id ? byId.get(row.menu_item_id) ?? null : null,
      }))
    }

    // join gallery picks dengan gallery
    const pickRows = picksRes.data ?? []
    const galleryIds = pickRows.map((row) => row.gallery_id).filter((id): id is string => !!id)
    if (galleryIds.length) {
      const { data: photos } = await supabase.from('gallery').select('*').in('id', galleryIds)
      const byId = new Map((photos ?? []).map((photo) => [photo.id, photo]))
      galleryPicks.value = pickRows.map((row) => ({
        ...row,
        photo: row.gallery_id ? byId.get(row.gallery_id) ?? null : null,
      }))
    }

    loading.value = false
  }

  const section = (key: string): HomepageSection | undefined =>
    sections.value.find((entry) => entry.section_key === key)

  return { sections, loading, error, load, section, signatureItems, galleryPicks }
}
