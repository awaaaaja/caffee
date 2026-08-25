<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'outline'

withDefaults(
  defineProps<{
    variant?: Variant
    to?: string
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button' },
)

const base =
  'inline-flex items-center justify-center gap-2 px-8 py-3 font-sans text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-espresso text-cream hover:bg-terracotta',
  secondary: 'glass-panel text-espresso hover:border-gold/60',
  outline: 'border border-gold bg-transparent text-espresso hover:border-muted-gold hover:text-terracotta',
}
</script>

<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :class="[base, variants[variant]]"
  >
    <slot />
  </component>
</template>
