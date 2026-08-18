import DefaultTheme from 'vitepress/theme'
import { nextTick } from 'vue'

import './fonts.css'
import './colors.css'
import './layout.css'
import './components.css'
import './animation.css'
import './dark.css'

const heroActionsSelector = '.VPHero .actions'
let cancelOutlineNavigation: (() => void) | undefined

function updateHeroActionsOverflow(element: Element) {
  if (!(element instanceof HTMLElement)) return

  const maxScroll = element.scrollHeight - element.clientHeight
  const hasOverflow = maxScroll > 2

  element.classList.toggle('has-scroll-overflow', hasOverflow)
  element.classList.toggle('is-scroll-top', !hasOverflow || element.scrollTop <= 2)
  element.classList.toggle(
    'is-scroll-bottom',
    !hasOverflow || element.scrollTop >= maxScroll - 2
  )
  element.classList.toggle('can-scroll-up', hasOverflow && element.scrollTop > 2)
  element.classList.toggle(
    'can-scroll-down',
    hasOverflow && element.scrollTop < maxScroll - 2
  )
}

function refreshHeroActionsOverflow() {
  if (typeof document === 'undefined') return
  document.querySelectorAll(heroActionsSelector).forEach(updateHeroActionsOverflow)
}

function resetHeroActionsScroll() {
  if (typeof document === 'undefined') return

  document.querySelectorAll<HTMLElement>(heroActionsSelector).forEach((element) => {
    element.scrollTop = 0
    updateHeroActionsOverflow(element)
  })
}

export default {
  ...DefaultTheme,
  async enhanceApp(ctx) {
    await DefaultTheme.enhanceApp?.(ctx)

    if (typeof window !== 'undefined') {
      document.addEventListener('scroll', (event) => {
        const target = event.target
        if (target instanceof Element && target.matches(heroActionsSelector)) {
          updateHeroActionsOverflow(target)
        }
      }, true)

      window.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return

        const link = event.target.closest<HTMLAnchorElement>(
          '.VPDocAsideOutline .outline-link'
        )
        if (!link || event.button !== 0) return
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

        const outline = link.closest<HTMLElement>('.VPDocAsideOutline')
        const targetUrl = new URL(link.href, window.location.href)
        const heading = targetUrl.hash
          ? document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)))
          : null
        if (!outline || !heading) return

        event.preventDefault()
        event.stopImmediatePropagation()
        cancelOutlineNavigation?.()

        outline.classList.add('is-navigating')
        link.classList.add('mio-outline-target')

        const startY = window.scrollY
        const navBottom = Math.max(
          0,
          document.querySelector<HTMLElement>('.VPNav')
            ?.getBoundingClientRect().bottom ?? 0
        )
        const targetOffset = navBottom + 24
        const maxY = document.documentElement.scrollHeight - window.innerHeight
        const targetY = Math.max(
          0,
          Math.min(
            startY + heading.getBoundingClientRect().top - targetOffset,
            maxY
          )
        )
        const distance = targetY - startY
        const reduceMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
        const duration = reduceMotion
          ? 0
          : Math.min(720, Math.max(380, Math.abs(distance) * .28))
        const startedAt = performance.now()
        let frame = 0

        const cleanup = () => {
          window.cancelAnimationFrame(frame)
          window.removeEventListener('wheel', cancel)
          window.removeEventListener('touchstart', cancel)
          outline.classList.remove('is-navigating')
          link.classList.remove('mio-outline-target')
          cancelOutlineNavigation = undefined
          window.dispatchEvent(new Event('scroll'))
        }

        const cancel = () => cleanup()
        cancelOutlineNavigation = cancel
        window.addEventListener('wheel', cancel, { once: true, passive: true })
        window.addEventListener('touchstart', cancel, { once: true, passive: true })

        window.history.pushState(null, '', targetUrl.hash)
        heading.focus({ preventScroll: true })

        if (duration === 0 || Math.abs(distance) < 2) {
          window.scrollTo(0, targetY)
          cleanup()
          return
        }

        const animate = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / duration)
          const eased = 1 - Math.pow(1 - progress, 4)
          window.scrollTo(0, startY + distance * eased)

          if (progress < 1) {
            frame = window.requestAnimationFrame(animate)
          } else {
            window.scrollTo(0, targetY)
            cleanup()
          }
        }

        frame = window.requestAnimationFrame(animate)
      }, true)

      window.addEventListener('load', () => {
        // Run after the browser's native scroll restoration step.
        requestAnimationFrame(resetHeroActionsScroll)
      }, { once: true })
      window.addEventListener('resize', refreshHeroActionsOverflow)

      // enhanceApp runs immediately before the Vue tree mounts. Two frames
      // ensure the home actions exist and have measurable scroll dimensions.
      requestAnimationFrame(() => {
        requestAnimationFrame(refreshHeroActionsOverflow)
      })
    }

    const previousAfterRouteChanged = ctx.router.onAfterRouteChanged

    ctx.router.onAfterRouteChanged = async (to) => {
      await previousAfterRouteChanged?.(to)
      await nextTick()

      if (typeof document === 'undefined') return

      // Home owns a longer, staggered opening sequence. Applying the generic
      // route animation here would override its delayed content entrance.
      if (document.querySelector('.VPHome')) {
        refreshHeroActionsOverflow()
        return
      }

      const doc = document.querySelector<HTMLElement>('.vp-doc')
      if (!doc) return

      // VitePress reuses the content node between routes, so a plain CSS
      // animation does not remount. Toggle a dedicated class to replay it.
      doc.classList.remove('mio-route-enter')
      void doc.offsetWidth
      doc.classList.add('mio-route-enter')
    }
  }
}
