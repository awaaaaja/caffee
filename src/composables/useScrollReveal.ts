import { onUnmounted } from 'vue'
import { useGsap } from './useGsap'
import { useReducedMotion } from './useReducedMotion'

export type ScrollRevealOptions = {
  y?: number
  duration?: number
  delay?: number
  start?: string
}

export function useScrollReveal() {
  const { gsap } = useGsap()
  const { isReducedMotion } = useReducedMotion()
  const animations: gsap.core.Animation[] = []

  const reveal = (
    target: gsap.DOMTarget,
    options: ScrollRevealOptions = {},
  ): gsap.core.Animation | undefined => {
    if (isReducedMotion.value) {
      gsap.set(target, { autoAlpha: 1, clearProps: 'transform' })
      return undefined
    }

    const animation = gsap.fromTo(
      target,
      { autoAlpha: 0, y: options.y ?? 28 },
      {
        autoAlpha: 1,
        y: 0,
        delay: options.delay ?? 0,
        duration: options.duration ?? 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: target,
          start: options.start ?? 'top 85%',
          once: true,
        },
      },
    )

    animations.push(animation)
    return animation
  }

  onUnmounted(() => {
    animations.forEach((animation) => {
      animation.scrollTrigger?.kill()
      animation.kill()
    })
  })

  return { reveal, isReducedMotion }
}
