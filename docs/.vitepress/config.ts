import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MioMtFWiki",
  description: "来自社区、服务社区的现代跨性别知识库",
  base: '/MioMtFWiki/',
  head: [
    [
      'script',
      {
        defer: '',
        src: 'https://cloud.umami.is/script.js',
        'data-website-id': 'e9c4e9f5-3b93-42fc-97e4-52f0ebb4884b'
      }
    ]
  ],
  markdown: {
    breaks: true,
    math: true
  },
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
          { text: 'HRT入门', link: '/hrt-start' },
          { text: '我怀疑自己是MtF，该做什么？', link: '/first-step' },
          { text: '概念与术语', link: '/concepts' },
          { text: '常见刻板印象与误解', link: '/stereotypes' },
          { text: '激素抽血化验指南', link: '/hormone-testing-guide' },
          { text: '高频问题', link: '/faq' },
          { text: '关于 AI 与本站内容', link: '/ai-assistance' },
          { text: '我们与 mtf.wiki 的关系', link: '/mio-and-mtfwiki' },
          { text: '社群争议', link: '/controversies' },
          { text: '雌二醇凝胶自制指南', link: '/diy-estradiol-gel' },
          {
            text: '未经验证的方法',
            link: '/unverified',
            items: [
              {
                text: '雌二醇贴片自制指南',
                link: '/unverified/diy-estradiol-stickies'
              }
            ]
          }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/KitsuMio/MioMtFWiki' }
    ]
  }
})
