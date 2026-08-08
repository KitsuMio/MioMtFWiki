import DefaultTheme from 'vitepress/theme'
import { nextTick } from 'vue'

import './fonts.css'
import './colors.css'
import './layout.css'
import './components.css'
import './animation.css'
import './dark.css'

const heroActionsSelector = '.VPHero .actions'

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
