<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import MenuItemForm from '../../components/admin/MenuItemForm.vue'
import { supabase } from '../../lib/supabase'
import { clearMenuCache, formatPrice, useMenu, type MenuCategory, type MenuItem } from '../../composables/useMenu'
import { useAuth } from '../../composables/useAuth'
import type { Database } from '../../types/database'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type AddonRow = Database['public']['Tables']['menu_addons']['Row']

const { isAdmin } = useAuth()
const { categories, items, load: loadMenu } = useMenu()

const activeTab = ref<'items' | 'categories' | 'addons'>('items')
const categoryFilter = ref<string>('all')
const formOpen = ref(false)
const editingItem = ref<MenuItem | null>(null)
const busyId = ref<string | null>(null)
const actionError = ref('')

const newCategory = ref<CategoryInsert>({ name: '', slug: '', group_type: 'food', sort_order: 0 })
const newAddon = ref({ name: '', price: 0 })
const addonList = shallowRef<AddonRow[]>([])

// staff hanya boleh melihat & mengubah availability (UI-level; RLS backstop)
const staffItems = shallowRef<MenuItem[]>([])
const staffLoading = ref(true)

const filteredItems = computed(() => {
  if (categoryFilter.value === 'all') return items.value
  const category = categories.value.find((c) => c.slug === categoryFilter.value)
  return category ? items.value.filter((item) => item.category_id === category.id) : []
})

async function refresh() {
  clearMenuCache()
  await loadMenu()
  const { data: addons } = await supabase.from('menu_addons').select('*').order('name')
  addonList.value = addons ?? []
  if (!isAdmin.value) {
    const { data } = await supabase.from('menu_items').select('*').order('name')
    staffItems.value = data ?? []
  }
}

onMounted(async () => {
  await loadMenu()
  const { data: addons } = await supabase.from('menu_addons').select('*').order('name')
  addonList.value = addons ?? []
  if (!isAdmin.value) {
    const { data } = await supabase.from('menu_items').select('*').order('name')
    staffItems.value = data ?? []
    staffLoading.value = false
  }
})

async function toggleAvailability(item: MenuItem, available: boolean) {
  busyId.value = item.id
  actionError.value = ''
  const { error } = await supabase.rpc('toggle_menu_availability', { item_id: item.id, available })
  busyId.value = null
  if (error) {
    actionError.value = error.message
    return
  }
  item.is_available = available
  clearMenuCache()
}

function openCreate() {
  editingItem.value = null
  formOpen.value = true
}

function openEdit(item: MenuItem) {
  editingItem.value = item
  formOpen.value = true
}

function onSaved() {
  formOpen.value = false
  editingItem.value = null
  void refresh()
}

async function deleteItem(item: MenuItem) {
  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
  busyId.value = item.id
  const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
  busyId.value = null
  if (error) {
    actionError.value = error.message
    return
  }
  clearMenuCache()
  await refresh()
}

async function toggleFlag(item: MenuItem, flag: 'is_featured' | 'is_signature' | 'show_on_homepage') {
  busyId.value = item.id
  const update: Database['public']['Tables']['menu_items']['Update'] = { [flag]: !item[flag] }
  const { error } = await supabase.from('menu_items').update(update).eq('id', item.id)
  busyId.value = null
  if (error) {
    actionError.value = error.message
    return
  }
  item[flag] = !item[flag]
  clearMenuCache()
}

async function addCategory() {
  actionError.value = ''
  const payload = { ...newCategory.value, slug: newCategory.value.slug || newCategory.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
  if (!payload.name.trim()) return
  const { error } = await supabase.from('categories').insert(payload)
  if (error) {
    actionError.value = error.message
    return
  }
  newCategory.value = { name: '', slug: '', group_type: 'food', sort_order: 0 }
  clearMenuCache()
  await refresh()
}

async function deleteCategory(category: MenuCategory) {
  if (!confirm(`Delete category "${category.name}"? Items inside will be removed too.`)) return
  const { error } = await supabase.from('categories').delete().eq('id', category.id)
  if (error) {
    actionError.value = error.message
    return
  }
  clearMenuCache()
  await refresh()
}

async function addAddon() {
  actionError.value = ''
  if (!newAddon.value.name.trim()) return
  const { error } = await supabase.from('menu_addons').insert(newAddon.value)
  if (error) {
    actionError.value = error.message
    return
  }
  newAddon.value = { name: '', price: 0 }
  await refresh()
}

async function deleteAddon(addon: AddonRow) {
  if (!confirm(`Delete add-on "${addon.name}"?`)) return
  const { error } = await supabase.from('menu_addons').delete().eq('id', addon.id)
  if (error) {
    actionError.value = error.message
    return
  }
  const { data } = await supabase.from('menu_addons').select('*').order('name')
  addonList.value = data ?? []
}

</script>

<template>
  <AdminLayout>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="font-serif text-3xl text-espresso">Menu management</h1>
      <div v-if="isAdmin" class="flex gap-1 rounded-xl border border-espresso/10 bg-white p-1">
        <button
          v-for="tab in ['items', 'categories', 'addons'] as const"
          :key="tab"
          type="button"
          class="rounded-lg px-4 py-2 font-sans text-sm font-medium capitalize text-espresso/60 transition-colors duration-200 hover:text-espresso"
          :class="activeTab === tab ? 'bg-espresso/10 text-espresso' : ''"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <!-- ── STAFF MODE: hanya availability ── -->
    <template v-if="!isAdmin">
      <p class="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 font-sans text-xs text-espresso/70">
        Staff access — you can only toggle item availability. Price and name changes require an admin.
      </p>
      <div v-if="staffLoading" class="mt-6 space-y-3" aria-label="Loading">
        <div v-for="index in 5" :key="index" class="h-16 animate-pulse rounded-xl bg-espresso/10" />
      </div>
      <div v-else class="mt-6 space-y-3">
        <div
          v-for="item in staffItems"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-espresso/10 bg-white px-5 py-4"
        >
          <div>
            <p class="font-serif text-lg text-espresso">{{ item.name }}</p>
            <p class="font-sans text-xs text-espresso/50">{{ formatPrice(item.price) }}</p>
          </div>
          <label class="flex items-center gap-3 font-sans text-sm font-medium text-espresso/80">
            <input
              type="checkbox"
              class="h-5 w-5 accent-[#963D20]"
              :checked="item.is_available ?? false"
              :disabled="busyId === item.id"
              @change="toggleAvailability(item, !item.is_available)"
            />
            Available
          </label>
        </div>
      </div>
    </template>

    <!-- ── ADMIN MODE ── -->
    <template v-else>
      <!-- ITEMS TAB -->
      <div v-show="activeTab === 'items'" class="mt-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <select
            v-model="categoryFilter"
            class="rounded-xl border border-espresso/15 bg-white px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
          </select>
          <button
            type="button"
            class="rounded-xl bg-espresso px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors duration-300 hover:bg-terracotta"
            @click="openCreate"
          >
            + New item
          </button>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-espresso/10 bg-white px-5 py-4"
          >
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.name"
              class="h-12 w-16 rounded-lg object-cover"
            />
            <div v-else class="flex h-12 w-16 items-center justify-center rounded-lg bg-espresso/5 font-serif text-lg text-espresso/30">
              {{ item.name.charAt(0) }}
            </div>
            <div class="min-w-40 flex-1">
              <p class="font-serif text-lg leading-tight text-espresso">{{ item.name }}</p>
              <p class="font-sans text-xs text-espresso/50">
                {{ categories.find((c) => c.id === item.category_id)?.name ?? '—' }} · {{ formatPrice(item.price) }}
              </p>
            </div>

            <label class="flex items-center gap-2 font-sans text-xs font-medium text-espresso/70">
              <input
                type="checkbox"
                class="h-4 w-4 accent-[#963D20]"
                :checked="item.is_available ?? false"
                :disabled="busyId === item.id"
                @change="toggleAvailability(item, !item.is_available)"
              />
              Available
            </label>
            <label class="flex items-center gap-2 font-sans text-xs font-medium text-espresso/70">
              <input
                type="checkbox"
                class="h-4 w-4 accent-[#963D20]"
                :checked="item.is_featured ?? false"
                :disabled="busyId === item.id"
                @change="toggleFlag(item, 'is_featured')"
              />
              Featured
            </label>
            <label class="flex items-center gap-2 font-sans text-xs font-medium text-espresso/70">
              <input
                type="checkbox"
                class="h-4 w-4 accent-[#963D20]"
                :checked="item.is_signature ?? false"
                :disabled="busyId === item.id"
                @change="toggleFlag(item, 'is_signature')"
              />
              Signature
            </label>
            <label class="flex items-center gap-2 font-sans text-xs font-medium text-espresso/70">
              <input
                type="checkbox"
                class="h-4 w-4 accent-[#963D20]"
                :checked="item.show_on_homepage ?? false"
                :disabled="busyId === item.id"
                @change="toggleFlag(item, 'show_on_homepage')"
              />
              Homepage
            </label>

            <div class="ml-auto flex gap-2">
              <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/70 hover:border-gold hover:text-espresso" @click="openEdit(item)">
                Edit
              </button>
              <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="deleteItem(item)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CATEGORIES TAB -->
      <div v-show="activeTab === 'categories'" class="mt-6 max-w-2xl">
        <div class="rounded-2xl border border-espresso/10 bg-white p-5">
          <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-espresso/60">Add category</h2>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_0.8fr_auto]">
            <input v-model="newCategory.name" type="text" placeholder="Name" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <select v-model="newCategory.group_type" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50">
              <option value="food">food</option>
              <option value="beverage">beverage</option>
              <option value="pastry">pastry</option>
            </select>
            <input v-model.number="newCategory.sort_order" type="number" min="0" placeholder="Sort" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <button type="button" class="rounded-xl bg-espresso px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream hover:bg-terracotta" @click="addCategory">
              Add
            </button>
          </div>
        </div>

        <div class="mt-4 space-y-2">
          <div
            v-for="category in categories"
            :key="category.id"
            class="flex items-center justify-between rounded-xl border border-espresso/10 bg-white px-5 py-3.5"
          >
            <div>
              <p class="font-sans text-sm font-semibold text-espresso">{{ category.name }}</p>
              <p class="font-sans text-xs text-espresso/50">{{ category.slug }} · {{ category.group_type }} · sort {{ category.sort_order }}</p>
            </div>
            <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="deleteCategory(category)">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- ADDONS TAB -->
      <div v-show="activeTab === 'addons'" class="mt-6 max-w-2xl">
        <div class="rounded-2xl border border-espresso/10 bg-white p-5">
          <h2 class="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-espresso/60">Add add-on</h2>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_0.8fr_auto]">
            <input v-model="newAddon.name" type="text" placeholder="Name (e.g. Oatmilk)" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <input v-model.number="newAddon.price" type="number" min="0" step="1000" placeholder="Price (IDR)" class="rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <button type="button" class="rounded-xl bg-espresso px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream hover:bg-terracotta" @click="addAddon">
              Add
            </button>
          </div>
        </div>

        <div class="mt-4 space-y-2">
          <div
            v-for="addon in addonList"
            :key="addon.id"
            class="flex items-center justify-between rounded-xl border border-espresso/10 bg-white px-5 py-3.5"
          >
            <p class="font-sans text-sm font-semibold text-espresso">{{ addon.name }} — {{ formatPrice(addon.price) }}</p>
            <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="deleteAddon(addon)">
              Delete
            </button>
          </div>
        </div>
        <p class="mt-3 font-sans text-xs text-espresso/40">
          Assign add-ons to an item via the item edit form. Existing add-ons: Oatmilk, Extra Shot, Mineral Water, Cheese Foam.
        </p>
      </div>
    </template>

    <MenuItemForm
      v-if="formOpen"
      :item="editingItem"
      :categories="categories"
      @close="formOpen = false"
      @saved="onSaved"
    />
  </AdminLayout>
</template>
