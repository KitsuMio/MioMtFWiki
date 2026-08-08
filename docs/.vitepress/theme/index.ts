import DefaultTheme from 'vitepress/theme'
import { nextTick } from 'vue'

import './fonts.css'
import './colors.css'
import './layout.css'
import './components.css'
import './animation.css'
import './dark.css'

export default {
  ...DefaultTheme,
  async enhanceApp(ctx) {
    await DefaultTheme.enhanceApp?.(ctx)

    const previousAfterRouteChanged = ctx.router.onAfterRouteChanged

    ctx.router.onAfterRouteChanged = async (to) => {
      await previousAfterRouteChanged?.(to)
      await nextTick()

      if (typeof document === 'undefined') return

      // Home owns a longer, staggered opening sequence. Applying the generic
      // route animation here would override its delayed content entrance.
      if (document.querySelector('.VPHome')) {
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
