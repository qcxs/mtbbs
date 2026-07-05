import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/mtbbs/',
  lang: 'zh-CN',
  title: 'mtbbs',
  description: 'MT论坛 移动端适配脚本与工具集合',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: false,

    nav: [
      { text: '首页', link: '/' },
      { text: 'github', link: 'https://github.com/qcxs/mtbbs' },
      { text: 'MT Convert', link: '/mt-convert/' },
    ],

    sidebar: [
      {
        text: '首页',
        items: [
          { text: '项目介绍', link: '/' },
        ],
      },
      {
        text: '油猴脚本',
        items: [
          { text: '"借鉴一下"', link: '/scripts/copy' },
          { text: '自动下一页', link: '/scripts/autoNextPage' },
          { text: '消息提醒预览', link: '/scripts/messagePreview' },
          { text: '移动端图片恢复', link: '/scripts/restoreImages' },
          { text: '发帖辅助工具', link: '/scripts/InsertLabel' },
          { text: '标题增强', link: '/scripts/titileTools' },
          { text: '手机版小黑屋', link: '/scripts/xhw' },
        ],
      },
      {
        text: '工具',
        items: [
          { text: 'MT Convert', link: '/tools/mt-convert' },
        ],
      },
      {
        text: '青龙面板',
        items: [
          { text: '青龙面板脚本', link: '/qinglong/' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/qcxs/mtbbs' },
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © qcxs',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '本页目录',
      level: 'deep',
    },

    lastUpdated: {
      text: '最后更新',
    },
  },
})
