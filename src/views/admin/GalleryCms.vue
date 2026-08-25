<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'

type GalleryRow = Database['public']['Tables']['gallery']['Row']

const CATEGORIES = ['interior', 'food', 'coffee', 'pastry', 'people', 'exterior'] as const

const photos = shallowRef<GalleryRow[]>([])
const loading = ref(true)
const actionError = ref('')

const uploadCategory = ref<(typeof CATEGORIES)[number]>('food')
const uploadCaption = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadProgress = ref('')

const activeFilter = ref('all')
const filteredPhotos = computed(() =>
  activeFilter.value === 'all' ? photos.value : photos.value.filter((p) => p.category === activeFilter.value),
)

const dragIndex = ref<number | null>(null)

async function refresh() {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order')
  if (error) {
    actionError.value = error.message
    return
  }
  photos.value = data ?? []
}

onMounted(async () => {
  await refresh()
  loading.value = false
})

async function handleUpload() {
  const files = fileInput.value?.files
  if (!files?.length) {
    actionError.value = 'Choose at least one image.'
    return
  }
  uploading.value = true
  actionError.value = ''
  uploadProgress.value = ''

  try {
    let index = 0
    for (const file of Array.from(files)) {
      index += 1
      uploadProgress.value = `Uploading ${index}/${files.length}…`
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${uploadCategory.value}/${Date.now()}-${index}.${ext}`
      const publicUrl = await uploadImage('gallery', path, file)
      const { error: insertError } = await supabase.from('gallery').insert({
        image_url: publicUrl,
        category: uploadCategory.value,
        caption: uploadCaption.value.trim() || null,
        is_published: false,
        sort_order: (photos.value.at(-1)?.sort_order ?? 0) + index,
      })
      if (insertError) throw insertError
    }
    if (fileInput.value) fileInput.value.value = ''
    uploadCaption.value = ''
    await refresh()
    uploadProgress.value = ''
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Upload failed.'
    uploadProgress.value = ''
  } finally {
    uploading.value = false
  }
}

async function toggleFlag(photo: GalleryRow, flag: 'is_featured' | 'is_published') {
  const update: Database['public']['Tables']['gallery']['Update'] = { [flag]: !photo[flag] }
  const { error } = await supabase.from('gallery').update(update).eq('id', photo.id)
  if (error) {
    actionError.value = error.message
    return
  }
  photo[flag] = !photo[flag]
}

async function deletePhoto(photo: GalleryRow) {
  if (!confirm('Delete this photo?')) return
  const { error } = await supabase.from('gallery').delete().eq('id', photo.id)
  if (error) {
    actionError.value = error.message
    return
  }
  await refresh()
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDrop(targetIndex: number) {
  const from = dragIndex.value
  dragIndex.value = null
  if (from === null || from === targetIndex) return

  const next = [...filteredPhotos.value]
  const [moved] = next.splice(from, 1)
  next.splice(targetIndex, 0, moved)

  // urutkan ulang lokal, lalu persist sort_order ke database
  photos.value = next
  void Promise.all(
    next.map((photo, index) => {
      if (photo.sort_order === index + 1) return Promise.resolve(null)
      photo.sort_order = index + 1
      return supabase
        .from('gallery')
        .update({ sort_order: index + 1 })
        .eq('id', photo.id)
        .then((result) => result.error)
    }),
  ).then((errors) => {
    const failed = errors.find(Boolean)
    if (failed) actionError.value = failed.message
  })
}
</script>

<template>
  <AdminLayout>
    <h1 class="font-serif text-3xl text-espresso">Gallery CMS</h1>
    <p class="mt-1 font-sans text-sm text-espresso/60">
      Upload, reorder, and publish photos. Published photos appear on the public gallery instantly.
    </p>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <div class="mt-6 rounded-2xl border border-espresso/10 bg-white p-5">
      <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-espresso/60">Upload photos</h2>
      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[0.7fr_1.2fr_1.4fr_auto]">
        <select v-model="uploadCategory" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" aria-label="Upload category">
          <option v-for="category in CATEGORIES" :key="category" :value="category">{{ category }}</option>
        </select>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          class="w-full font-sans text-sm text-espresso/70"
          aria-label="Choose images"
        />
        <input v-model="uploadCaption" type="text" placeholder="Caption (optional)" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        <button
          type="button"
          :disabled="uploading"
          class="rounded-xl bg-espresso px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors duration-300 hover:bg-terracotta disabled:opacity-60"
          @click="handleUpload"
        >
          {{ uploading ? 'Uploading…' : 'Upload' }}
        </button>
      </div>
      <p v-if="uploadProgress" class="mt-2 font-sans text-xs text-espresso/60">{{ uploadProgress }}</p>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading gallery">
      <div v-for="index in 6" :key="index" class="h-48 animate-pulse rounded-2xl bg-espresso/10" />
    </div>

    <template v-else>
      <div class="mt-8 flex flex-wrap gap-2">
        <button
          v-for="filter in ['all', ...CATEGORIES]"
          :key="filter"
          type="button"
          class="rounded-full border px-4 py-1.5 font-sans text-xs font-semibold capitalize transition-colors duration-200"
          :class="activeFilter === filter ? 'border-espresso bg-espresso text-cream' : 'border-espresso/15 text-espresso/60 hover:text-espresso'"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <p class="mt-4 font-sans text-xs text-espresso/40">Drag cards to reorder — order is saved automatically.</p>

      <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(photo, index) in filteredPhotos"
          :key="photo.id"
          draggable="true"
          class="cursor-grab overflow-hidden rounded-2xl border border-espresso/10 bg-white transition-shadow duration-200 hover:shadow-md active:cursor-grabbing"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop.prevent="onDrop(index)"
        >
          <div class="relative">
            <img :src="photo.image_url" :alt="photo.caption ?? 'Gallery photo'" class="h-44 w-full object-cover" />
            <span
              v-if="photo.is_featured"
              class="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-espresso"
            >
              Featured
            </span>
          </div>
          <div class="p-4">
            <p class="truncate font-sans text-xs text-espresso/50">{{ photo.caption ?? 'No caption' }} · {{ photo.category }}</p>
            <div class="mt-3 flex flex-wrap items-center gap-4">
              <label class="flex items-center gap-2 font-sans text-xs font-medium text-espresso/70">
                <input type="checkbox" class="h-4 w-4 accent-[#963D20]" :checked="photo.is_published ?? false" @change="toggleFlag(photo, 'is_published')" />
                Published
              </label>
              <label class="flex items-center gap-2 font-sans text-xs font-medium text-espresso/70">
                <input type="checkbox" class="h-4 w-4 accent-[#963D20]" :checked="photo.is_featured ?? false" @change="toggleFlag(photo, 'is_featured')" />
                Featured
              </label>
              <button type="button" class="ml-auto font-sans text-xs font-semibold text-terracotta hover:underline" @click="deletePhoto(photo)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!loading && filteredPhotos.length === 0" class="mt-10 text-center font-sans text-sm text-espresso/50">
        No photos yet — upload the first one above.
      </p>
    </template>
  </AdminLayout>
</template>
