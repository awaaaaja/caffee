<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import type { Database } from '../../types/database'
import { supabase } from '../../lib/supabase'

type Review = Database['public']['Tables']['reviews']['Row']

const reviews = shallowRef<Review[]>([])
const loading = ref(true)
const actionError = ref('')
const editing = shallowRef<Review | null>(null)
const creating = ref(false)

const draft = ref({ customer_name: '', rating: 5, review_text: '', is_published: false, sort_order: 0 })

async function refresh() {
  const { data, error } = await supabase.from('reviews').select('*').order('sort_order')
  if (error) {
    actionError.value = error.message
    return
  }
  reviews.value = data ?? []
}

onMounted(async () => {
  await refresh()
  loading.value = false
})

function openCreate() {
  creating.value = true
  editing.value = null
  draft.value = { customer_name: '', rating: 5, review_text: '', is_published: false, sort_order: (reviews.value.at(-1)?.sort_order ?? 0) + 1 }
}

function openEdit(review: Review) {
  editing.value = review
  creating.value = false
  draft.value = {
    customer_name: review.customer_name,
    rating: review.rating,
    review_text: review.review_text ?? '',
    is_published: review.is_published ?? false,
    sort_order: review.sort_order ?? 0,
  }
}

async function save() {
  actionError.value = ''
  if (!draft.value.customer_name.trim()) {
    actionError.value = 'Name is required.'
    return
  }
  const payload = {
    customer_name: draft.value.customer_name.trim(),
    rating: draft.value.rating,
    review_text: draft.value.review_text.trim() || null,
    is_published: draft.value.is_published,
    sort_order: draft.value.sort_order,
  }
  const { error } = editing.value
    ? await supabase.from('reviews').update(payload).eq('id', editing.value.id)
    : await supabase.from('reviews').insert(payload)
  if (error) {
    actionError.value = error.message
    return
  }
  creating.value = false
  editing.value = null
  await refresh()
}

async function togglePublished(review: Review) {
  const { error } = await supabase.from('reviews').update({ is_published: !review.is_published }).eq('id', review.id)
  if (error) {
    actionError.value = error.message
    return
  }
  await refresh()
}

async function remove(review: Review) {
  if (!confirm(`Delete review from "${review.customer_name}"?`)) return
  const { error } = await supabase.from('reviews').delete().eq('id', review.id)
  if (error) {
    actionError.value = error.message
    return
  }
  await refresh()
}

const formOpen = computed(() => creating.value || editing.value !== null)
</script>

<template>
  <AdminLayout>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="font-serif text-3xl text-espresso">Reviews</h1>
      <button type="button" class="rounded-xl bg-espresso px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream hover:bg-terracotta" @click="openCreate">
        + New review
      </button>
    </div>

    <p v-if="actionError" class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 font-sans text-sm text-terracotta" role="alert">
      {{ actionError }}
    </p>

    <form v-if="formOpen" class="mt-6 rounded-2xl border border-espresso/10 bg-white p-6" @submit.prevent="save">
      <h2 class="font-serif text-xl text-espresso">{{ editing ? 'Edit review' : 'New review' }}</h2>
      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label for="rev-name" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Customer name</label>
          <input id="rev-name" v-model="draft.customer_name" type="text" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="rev-rating" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Rating (1–5)</label>
          <input id="rev-rating" v-model.number="draft.rating" type="number" min="1" max="5" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div>
          <label for="rev-sort" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Sort order</label>
          <input id="rev-sort" v-model.number="draft.sort_order" type="number" min="0" class="mt-1.5 w-full rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <div class="sm:col-span-3">
          <label for="rev-text" class="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-espresso/60">Review text</label>
          <textarea id="rev-text" v-model="draft.review_text" rows="2" class="mt-1.5 w-full resize-none rounded-xl border border-espresso/15 bg-cream/40 px-4 py-2.5 font-sans text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-gold/50" />
        </div>
        <label class="flex items-center gap-2 font-sans text-sm text-espresso/80">
          <input v-model="draft.is_published" type="checkbox" class="h-4 w-4 accent-[#963D20]" />
          Published
        </label>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="rounded-xl border border-espresso/15 px-4 py-2 font-sans text-sm font-semibold text-espresso/70" @click="creating = false; editing = null">
          Cancel
        </button>
        <button type="submit" class="rounded-xl bg-espresso px-5 py-2 font-sans text-sm font-semibold text-cream hover:bg-terracotta">
          Save
        </button>
      </div>
    </form>

    <div v-if="loading" class="mt-6 space-y-3" aria-label="Loading reviews">
      <div v-for="index in 3" :key="index" class="h-16 animate-pulse rounded-xl bg-espresso/10" />
    </div>

    <div v-else class="mt-6 space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-espresso/10 bg-white px-5 py-4"
      >
        <div class="min-w-40 flex-1">
          <p class="font-sans text-sm font-semibold text-espresso">
            {{ review.customer_name }}
            <span class="ml-2 text-gold">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
          </p>
          <p class="mt-0.5 font-sans text-xs text-espresso/60">{{ review.review_text }}</p>
        </div>
        <span
          class="rounded-full px-2.5 py-1 font-sans text-xs font-semibold"
          :class="review.is_published ? 'bg-green-100 text-green-800' : 'bg-espresso/10 text-espresso/60'"
        >
          {{ review.is_published ? 'Published' : 'Draft' }}
        </span>
        <div class="ml-auto flex gap-2">
          <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/70 hover:border-gold" @click="togglePublished(review)">
            {{ review.is_published ? 'Unpublish' : 'Publish' }}
          </button>
          <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-espresso/70 hover:border-gold" @click="openEdit(review)">
            Edit
          </button>
          <button type="button" class="rounded-lg border border-espresso/15 px-3 py-1.5 font-sans text-xs font-semibold text-terracotta hover:border-terracotta" @click="remove(review)">
            Delete
          </button>
        </div>
      </div>
      <p v-if="!reviews.length" class="rounded-xl border border-espresso/10 bg-white px-5 py-8 text-center font-sans text-sm text-espresso/50">
        No reviews yet.
      </p>
    </div>
  </AdminLayout>
</template>
