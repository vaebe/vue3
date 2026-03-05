import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Mini Vue3',
  description: 'Vue 3 响应式系统核心原理实现',
  lang: 'zh-CN',
  lastUpdated: true,

  // GitHub Pages 部署配置
  base: '/vue3/',

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Mini Vue3',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '响应式', link: '/reactivity/reactive' },
      { text: 'GitHub', link: 'https://github.com/vaebe/vue3' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '简介', link: '/guide/' },
            { text: '项目工程搭建', link: '/guide/project-setup' },
            { text: '配置 esbuild 打包', link: '/guide/esbuild' },
          ],
        },
      ],
      '/reactivity/': [
        {
          text: '响应式系统',
          items: [
            { text: 'Ref 实现', link: '/reactivity/ref' },
            { text: 'Effect 实现', link: '/reactivity/effect' },
            { text: '链表应用', link: '/reactivity/link-list' },
            { text: 'Reactive 实现', link: '/reactivity/reactive' },
            { text: 'Computed 计算', link: '/reactivity/computed' },
            { text: 'Watch 侦听', link: '/reactivity/watch' },
            { text: '数组响应式', link: '/reactivity/array' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/vaebe/vue3' }],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present vaebe',
    },
  },
})
