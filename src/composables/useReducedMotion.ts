import { onMounted, onUnmounted, ref } from 'vue'

export function useReducedMotion() {
  let mediaQuery =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
  const isReducedMotion = ref(mediaQuery?.matches ?? false)

  const update = (event?: MediaQueryListEvent) => {
    isReducedMotion.value = event?.matches ?? mediaQuery?.matches ?? false
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mediaQuery.addEventListener('change', update)
  })

  onUnmounted(() => mediaQuery?.removeEventListener('change', update))

  return { isReducedMotion }
}
