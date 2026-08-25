import { onUnmounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGsap() {
  let context: gsap.Context | undefined

  const createContext = (scope: Element | string, setup: () => void) => {
    context?.revert()
    context = gsap.context(setup, scope)
    return context
  }

  onUnmounted(() => {
    context?.revert()
    context = undefined
  })

  return { gsap, ScrollTrigger, createContext }
}
