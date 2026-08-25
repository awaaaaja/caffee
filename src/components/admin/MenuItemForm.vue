<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'
import type { MenuAddon, MenuCategory, MenuItem, MenuVariant } from '../../composables/useMenu'
import { clearMenuCache } from '../../composables/useMenu'

type ItemInsert = Database['public']['Tables']['menu_items']['Insert']

const props = defineProps<{
  item: MenuItem | null // null = create mode
  categories: MenuCategory[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const form = ref<ItemInsert>({
  name: props.item?.name ?? '',
  slug: props.item?.slug ?? '',
  category_id: props.item?.category_id ?? props.categories[0]?.id ?? null,
  description: props.item?.description ?? '',
  price: props.item?.price ?? 0,
  image_url: props.item?.image_url ?? null,
  is_available: props.item?.is_available ?? true,
  is_featured: props.item?.is_featured ?? false,
  is_signature: props.item?.is_signature ?? false,
  show_on_homepage: props.item?.show_on_homepage ?? false,
  sort_order: props.item?.sort_order ?? 0,
})

const variants = ref<MenuVariant[]>([])
const removedVariantIds = ref<string[]>([])
const allAddons = ref<MenuAddon[]>([])
const linkedAddonIds = ref<Set<string>>(new Set())
const originalAddonIds = ref<Set<string>>(new Set())

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(props.item?.image_url ?? null)
const uploading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formErrors = ref<{ name?: string; price?: string }>({})

const isEdit = computed(() => props.item !== null)

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function onNameInput() {
  if (!isEdit.value) form.value.slug = slugify(form.value.name ?? '')
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const valid = ['image/jpeg', 'image/png', 'image/webp']
  if (!valid.includes(file.type)) {
    errorMessage.value = 'Image must be JPG, PNG, or WebP.'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Image must be under 5MB.'
    input.value = ''
    return
  }
  errorMessage.value = ''
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function addVariantRow() {
  variants.value.push({ id: `new-${Date.now()}-${Math.random()}`, menu_item_id: props.item?.id ?? null, name: '', price: null, created_at: null })
}

function removeVariantRow(index: number) {
  const variant = variants.value[index]
  if (variant && !String(variant.id).startsWith('new-')) removedVariantIds.value.push(variant.id)
  variants.value.splice(index, 1)
}

function toggleAddon(addonId: string) {
  const next = new Set(linkedAddonIds.value)
  if (next.has(addonId)) {
    next.delete(addonId)
  } else {
    next.add(addonId)
  }
  linkedAddonIds.value = next
}

onMounted(async () => {
  const [{ data: addons }, { data: links }] = await Promise.all([
    supabase.from('menu_addons').select('*').order('name'),
    props.item
      ? supabase.from('menu_item_addons').select('addon_id').eq('menu_item_id', props.item.id)
      : Promise.resolve({ data: [] as { addon_id: string }[] | null }),
  ])
  allAddons.value = addons ?? []
  const ids = new Set((links as { addon_id: string }[] | null)?.map((l) => l.addon_id) ?? [])
  linkedAddonIds.value = new Set(ids)
  originalAddonIds.value = new Set(ids)

  if (props.item) {
    const { data: existingVariants } = await supabase
      .from('menu_variants')
      .select('*')
      .eq('menu_item_id', props.item.id)
      .order('name')
    variants.value = existingVariants ?? []
  }
})

function validate(): boolean {
  const next: typeof formErrors.value = {}
  if (!form.value.name?.trim()) next.name = 'Name is required.'
  if (!Number.isInteger(form.value.price) || (form.value.price ?? 0) < 0) next.price = 'Price must be a non-negative integer.'
  formErrors.value = next
  return Object.keys(next).length === 0
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validate()) return
  saving.value = true

  try {
    // upload gambar jika ada file baru
    if (imageFile.value) {
      uploading.value = true
      const publicUrl = await uploadImage('menu', `items/${form.value.slug}-${Date.now()}`, imageFile.value)
      form.value.image_url = publicUrl
      uploading.value = false
    }

    let itemId: string
    if (isEdit.value && props.item) {
      const { data, error } = await supabase
        .from('menu_items')
        .update(form.value)
        .eq('id', props.item.id)
        .select()
        .single()
      if (error) throw error
      itemId = data.id
    } else {
      const { data, error } = await supabase.from('menu_items').insert(form.value).select().single()
      if (error) throw error
      itemId = data.id
    }

    // sync variants: hapus yang dihapus, upsert sisanya
    for (const variantId of removedVariantIds.value) {
      await supabase.from('menu_variants').delete().eq('id', variantId)
    }
    for (const variant of variants.value) {
      const payload = { menu_item_id: itemId, name: variant.name.trim(), price: variant.price }
      if (!payload.name) continue
      if (String(variant.id).startsWith('new-')) {
        await supabase.from('menu_variants').insert(payload)
      } else {
        await supabase.from('menu_variants').update(payload).eq('id', variant.id)
      }
    }

    // sync addon links (replace-all)
    const toAdd = [...linkedAddonIds.value].filter((id) => !originalAddonIds.value.has(id))
    const toRemove = [...originalAddonIds.value].filter((id) => !linkedAddonIds.value.has(id))
    if (toAdd.length) {
      await supabase.from('menu_item_addons').insert(toAdd.map((addonId) => ({ menu_item_id: itemId, addon_id: addonId })))
    }
    if (toRemove.length) {
      await supabase.from('menu_item_addons').delete().eq('menu_item_id', itemId).in('addon_id', toRemove)
    }

    clearMenuCache()
    emit('saved')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save item.'
  } finally {
    saving.value = false
    uploading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Menu item form">
      <div class="absolute inset-0 bg-espresso/70 backdrop-blur-sm" @click="emit('close')" />
      <div class="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-7 sm:rounded-3xl">
        <div class="flex items-start justify-between">
          <h2 class="font-serif text-2xl text-espresso">{{ isEdit ? 'Edit item' : 'New item' }}</h2>
          <button
            type="button"
            class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/60 hover:border-terracotta hover:text-terracotta"
            @click="emit('close')"
          >
            Close
          </button>
        </div>

        <form class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="handleSubmit">
          <div class="sm:col-span-2">
            <label for="item-name" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Name</label>
            <input id="item-name" v-model="form.name" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" @input="onNameInput" />
            <p v-if="formErrors.name" class="mt-1 font-sans text-xs text-terracotta">{{ formErrors.name }}</p>
          </div>

          <div>
            <label for="item-category" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Category</label>
            <select id="item-category" v-model="form.category_id" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50">
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </div>

          <div>
            <label for="item-price" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Price (IDR)</label>
            <input id="item-price" v-model.number="form.price" type="number" min="0" step="1000" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <p v-if="formErrors.price" class="mt-1 font-sans text-xs text-terracotta">{{ formErrors.price }}</p>
          </div>

          <div class="sm:col-span-2">
            <label for="item-description" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Description</label>
            <textarea id="item-description" v-model="form.description" rows="2" class="mt-1.5 w-full resize-none rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
          </div>

          <div class="sm:col-span-2">
            <label for="item-image" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Image (JPG/PNG/WebP, max 5MB)</label>
            <input id="item-image" type="file" accept="image/jpeg,image/png,image/webp" class="mt-1.5 w-full font-sans text-sm text-espresso/70" @change="onFileChange" />
            <img v-if="imagePreview" :src="imagePreview" alt="Item image preview" class="mt-3 h-28 w-44 rounded-xl object-cover" />
          </div>

          <fieldset class="sm:col-span-2">
            <legend class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Visibility flags</legend>
            <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              <label
v-for="flag in [
                { key: 'is_available', label: 'Available' },
                { key: 'is_featured', label: 'Featured' },
                { key: 'is_signature', label: 'Signature' },
                { key: 'show_on_homepage', label: 'Homepage' },
              ]" :key="flag.key" class="flex items-center gap-2 font-sans text-sm text-espresso/80">
                <input v-model="form[flag.key]" type="checkbox" class="h-4 w-4 accent-[#963D20]" />
                {{ flag.label }}
              </label>
            </div>
          </fieldset>

          <fieldset v-if="isEdit" class="sm:col-span-2">
            <legend class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Variants</legend>
            <div v-for="(variant, index) in variants" :key="variant.id" class="mt-2 flex items-center gap-2">
              <input v-model="variant.name" type="text" placeholder="Variant name" class="w-full rounded-xl border border-espresso/15 bg-cream/40 px-3 py-2 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
              <input v-model.number="variant.price" type="number" min="0" step="1000" placeholder="Price" class="w-32 rounded-xl border border-espresso/15 bg-cream/40 px-3 py-2 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
              <button type="button" class="shrink-0 rounded-lg px-2 py-2 font-sans text-xs font-semibold text-terracotta hover:bg-terracotta/10" @click="removeVariantRow(index)">
                Remove
              </button>
            </div>
            <button type="button" class="mt-2 rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/70 hover:border-gold" @click="addVariantRow">
              + Add variant
            </button>
          </fieldset>

          <fieldset v-if="isEdit && allAddons.length" class="sm:col-span-2">
            <legend class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Add-ons</legend>
            <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              <label v-for="addon in allAddons" :key="addon.id" class="flex items-center gap-2 font-sans text-sm text-espresso/80">
                <input type="checkbox" class="h-4 w-4 accent-[#963D20]" :checked="linkedAddonIds.has(addon.id)" @change="toggleAddon(addon.id)" />
                {{ addon.name }} ({{ addon.price / 1000 }}K)
              </label>
            </div>
          </fieldset>

          <p v-if="errorMessage" class="sm:col-span-2 font-sans text-sm text-terracotta" role="alert">{{ errorMessage }}</p>

          <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" class="rounded-xl border border-espresso/15 px-5 py-2.5 font-sans text-sm font-semibold text-espresso/70 hover:border-espresso/40" @click="emit('close')">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving || uploading"
              class="rounded-xl bg-espresso px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors duration-300 hover:bg-terracotta disabled:opacity-60"
            >
              {{ uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save item' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
