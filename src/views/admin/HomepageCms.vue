<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'
import { useHomepageContent, type HomepageSection } from '../../composables/useHomepageContent'
import { formatPrice } from '../../composables/useMenu'

type SectionKey = 'hero' | 'story' | 'viennoiserie' | 'experience' | 'reservation_cta' | 'photobooth' | 'photoshoot'
type GalleryRow = Database['public']['Tables']['gallery']['Row']

const SECTION_KEYS: { key: SectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'story', label: 'Brand Story' },
  { key: 'viennoiserie', label: 'Viennoiserie' },
  { key: 'experience', label: 'Experience' },
  { key: 'photobooth', label: 'Photobooth' },
  { key: 'photoshoot', label: 'Photoshoot' },
  { key: 'reservation_cta', label: 'Reservation CTA' },
]

const { signatureItems, galleryPicks, load: loadContent } = useHomepageContent()
const sections = shallowRef<HomepageSection[]>([])
const activeKey = ref<SectionKey>('hero')
const saving = ref(false)
const uploading = ref(false)
const actionError = ref('')
const savedNotice = ref('')

const draft = ref<Partial<Omit<HomepageSection, 'extra'>>>({})
const draftExtra = shallowRef<HomepageSection['extra']>({})
const imageFile = ref<File | null>(null)

const menuItems = shallowRef<Database['public']['Tables']['menu_items']['Row'][]>([])
const galleryPhotos = shallowRef<GalleryRow[]>([])
const newSignatureId = ref('')
const newPickId = ref('')


function loadDraft() {
  const section = sections.value.find((s) => s.section_key === activeKey.value)
  if (section) {
    const { extra, ...rest } = section
    draft.value = rest
    draftExtra.value = extra
  } else {
    draft.value = { section_key: activeKey.value }
    draftExtra.value = {}
  }
  imageFile.value = null
  savedNotice.value = ''
}

async function refresh() {
  const { data } = await supabase.from('homepage_sections').select('*').order('section_key')
  sections.value = data ?? []
  loadDraft()
  await loadContent()
}

onMounted(async () => {
  const [sectionsRes, itemsRes, photosRes] = await Promise.all([
    supabase.from('homepage_sections').select('*').order('section_key'),
    supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
    supabase.from('gallery').select('*').eq('is_published', true).order('sort_order'),
  ])
  sections.value = sectionsRes.data ?? []
  menuItems.value = itemsRes.data ?? []
  galleryPhotos.value = photosRes.data ?? []
  loadDraft()
  await loadContent()
})

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  imageFile.value = input.files?.[0] ?? null
}

async function saveSection() {
  actionError.value = ''
  savedNotice.value = ''
  saving.value = true
  try {
    if (imageFile.value) {
      uploading.value = true
      draft.value.image_url = await uploadImage('hero', `${activeKey.value}-${Date.now()}`, imageFile.value)
      uploading.value = false
    }
    const { error } = await supabase
      .from('homepage_sections')
      .upsert({ ...draft.value, extra: draftExtra.value, section_key: activeKey.value, updated_at: new Date().toISOString() })
    if (error) throw error
    await refresh()
    savedNotice.value = 'Saved — live on the homepage now.'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Save failed.'
  } finally {
    saving.value = false
    uploading.value = false
  }
}

async function addSignature() {
  if (!newSignatureId.value) return
  const maxOrder = Math.max(0, ...signatureItems.value.map((row) => row.sort_order ?? 0))
  const { error } = await supabase
    .from('homepage_signature_items')
    .insert({ menu_item_id: newSignatureId.value, sort_order: maxOrder + 1 })
  if (error) {
    actionError.value = error.message
    return
  }
  newSignatureId.value = ''
  await loadContent()
}

async function removeSignature(id: string) {
  const { error } = await supabase.from('homepage_signature_items').delete().eq('id', id)
  if (error) {
    actionError.value = error.message
    return
  }
  await loadContent()
}

async function moveSignature(index: number, direction: -1 | 1) {
  const target = index + direction
  const list = [...signatureItems.value]
  if (target < 0 || target >= list.length) return
  const a = list[index]
  const b = list[target]
  await Promise.all([
    supabase.from('homepage_signature_items').update({ sort_order: b.sort_order ?? target + 1 }).eq('id', a.id),
    supabase.from('homepage_signature_items').update({ sort_order: a.sort_order ?? index + 1 }).eq('id', b.id),
  ])
  await loadContent()
}

async function addPick() {
  if (!newPickId.value) return
  const maxOrder = Math.max(0, ...galleryPicks.value.map((row) => row.sort_order ?? 0))
  const { error } = await supabase
    .from('homepage_gallery_picks')
    .insert({ gallery_id: newPickId.value, sort_order: maxOrder + 1 })
  if (error) {
    actionError.value = error.message
    return
  }
  newPickId.value = ''
  await loadContent()
}

async function removePick(id: string) {
  const { error } = await supabase.from('homepage_gallery_picks').delete().eq('id', id)
  if (error) {
    actionError.value = error.message
    return
  }
  await loadContent()
}

async function movePick(index: number, direction: -1 | 1) {
  const target = index + direction
  const list = [...galleryPicks.value]
  if (target < 0 || target >= list.length) return
  const a = list[index]
  const b = list[target]
  await Promise.all([
    supabase.from('homepage_gallery_picks').update({ sort_order: b.sort_order ?? target + 1 }).eq('id', a.id),
    supabase.from('homepage_gallery_picks').update({ sort_order: a.sort_order ?? index + 1 }).eq('id', b.id),
  ])
  await loadContent()
}

const availableMenuToAdd = computed(() =>
  menuItems.value.filter((item) => !signatureItems.value.some((row) => row.menu_item_id === item.id)),
)
const availablePhotosToAdd = computed(() =>
  galleryPhotos.value.filter((photo) => !galleryPicks.value.some((row) => row.gallery_id === photo.id)),
)
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Homepage CMS</h1>
    <p class="mt-1 font-sans text-sm text-espresso/60">
      Changes go live on the public homepage immediately — no deploy needed.
    </p>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="entry in SECTION_KEYS"
        :key="entry.key"
        type="button"
        class="rounded-full border px-4 py-1.5 font-sans text-xs font-semibold transition-colors duration-200"
        :class="activeKey === entry.key ? 'border-espresso bg-espresso text-cream' : 'border-espresso/15 text-espresso/60 hover:text-espresso'"
        @click="activeKey = entry.key; loadDraft()"
      >
        {{ entry.label }}
      </button>
    </div>

    <!-- Section editor -->
    <div class="mt-5 rounded-2xl border border-espresso/10 bg-white p-6">
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="saveSection">
        <div>
          <label for="cms-subtitle" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Subtitle / eyebrow</label>
          <input id="cms-subtitle" v-model="draft.subtitle" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="cms-title" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Title</label>
          <input id="cms-title" v-model="draft.title" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div class="sm:col-span-2">
          <label for="cms-description" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Description</label>
          <textarea id="cms-description" v-model="draft.description" rows="2" class="mt-1.5 w-full resize-none rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="cms-cta-label" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">CTA label</label>
          <input id="cms-cta-label" v-model="draft.cta_label" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="cms-cta-url" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">CTA URL</label>
          <input id="cms-cta-url" v-model="draft.cta_url" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>

        <div v-if="activeKey === 'hero'" class="sm:col-span-2">
          <label for="cms-image" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">
            Background image (JPG/PNG/WebP, max 5MB) — kosongkan untuk default
          </label>
          <input id="cms-image" type="file" accept="image/jpeg,image/png,image/webp" class="mt-1.5 w-full font-sans text-sm text-espresso/70" @change="onImageChange" />
          <img v-if="draft.image_url" :src="draft.image_url" alt="Current hero background" class="mt-3 h-24 w-40 rounded-xl object-cover" />
        </div>

        <div class="sm:col-span-2 flex items-center justify-end gap-3">
          <span v-if="savedNotice" class="font-sans text-xs font-semibold text-green-700">{{ savedNotice }}</span>
          <button
            type="submit"
            :disabled="saving || uploading"
            class="rounded-xl bg-espresso px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors duration-300 hover:bg-terracotta disabled:opacity-60"
          >
            {{ uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save & publish' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Signature menu -->
    <div class="mt-10">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-espresso/70">Signature menu (homepage)</h2>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <select v-model="newSignatureId" class="rounded-xl border border-espresso/15 bg-white px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" aria-label="Add signature item">
          <option value="" disabled>Select menu item…</option>
          <option v-for="item in availableMenuToAdd" :key="item.id" :value="item.id">
            {{ item.name }} — {{ formatPrice(item.price) }}
          </option>
        </select>
        <button type="button" class="rounded-xl bg-espresso px-4 py-2.5 font-sans text-sm font-semibold text-cream hover:bg-terracotta disabled:opacity-50" :disabled="!newSignatureId" @click="addSignature">
          Add
        </button>
      </div>
      <ul class="mt-4 max-w-3xl space-y-2">
        <li
          v-for="(pick, index) in signatureItems"
          :key="pick.id"
          class="flex items-center justify-between rounded-xl border border-espresso/10 bg-white px-5 py-3"
        >
          <span class="font-sans text-sm text-espresso">{{ pick.item?.name ?? 'Missing item' }}</span>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-lg border border-espresso/15 px-2 py-1 text-xs hover:border-gold" :disabled="index === 0" aria-label="Move up" @click="moveSignature(index, -1)">↑</button>
            <button type="button" class="rounded-lg border border-espresso/15 px-2 py-1 text-xs hover:border-gold" :disabled="index === signatureItems.length - 1" aria-label="Move down" @click="moveSignature(index, 1)">↓</button>
            <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="removeSignature(pick.id)">
              Remove
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Gallery picks -->
    <div class="mt-10">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-espresso/70">Gallery picks (homepage)</h2>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <select v-model="newPickId" class="rounded-xl border border-espresso/15 bg-white px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" aria-label="Add gallery pick">
          <option value="" disabled>Select photo…</option>
          <option v-for="photo in availablePhotosToAdd" :key="photo.id" :value="photo.id">
            {{ photo.caption ?? photo.image_url.slice(-30) }} ({{ photo.category }})
          </option>
        </select>
        <button type="button" class="rounded-xl bg-espresso px-4 py-2.5 font-sans text-sm font-semibold text-cream hover:bg-terracotta disabled:opacity-50" :disabled="!newPickId" @click="addPick">
          Add
        </button>
      </div>
      <ul class="mt-4 max-w-3xl space-y-2">
        <li
          v-for="(pick, index) in galleryPicks"
          :key="pick.id"
          class="flex items-center justify-between rounded-xl border border-espresso/10 bg-white px-5 py-3"
        >
          <span class="truncate font-sans text-sm text-espresso">{{ pick.photo?.caption ?? 'Photo' }}</span>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-lg border border-espresso/15 px-2 py-1 text-xs hover:border-gold" :disabled="index === 0" aria-label="Move up" @click="movePick(index, -1)">↑</button>
            <button type="button" class="rounded-lg border border-espresso/15 px-2 py-1 text-xs hover:border-gold" :disabled="index === galleryPicks.length - 1" aria-label="Move down" @click="movePick(index, 1)">↓</button>
            <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="removePick(pick.id)">
              Remove
            </button>
          </div>
        </li>
      </ul>
    </div>
  </AdminLayout>
</template>
