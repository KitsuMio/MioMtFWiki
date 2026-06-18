import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MioMtFWiki",
  description: "来自社区、服务社区的现代跨性别知识库",
  base: '/MioMtFWiki/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
    ],

    sidebar: [
      {
        text: '目录',
        items: [
          { text: '首页', link: '/' },
          { text: '我怀疑自己是MtF，该做什么？', link: '/first-step' },
          { text: '概念与术语', link: '/concepts' },
          { text: 'HRT入门', link: '/hrt-start' },
          { text: '常见刻板印象与误解', link: '/stereotypes' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/KitsuMio/MioMtFWiki' }
    ]
  }
})
