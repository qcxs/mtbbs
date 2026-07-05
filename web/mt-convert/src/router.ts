import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'md-to-bbcode',
      meta: { showSettings: true },
      component: () => import('./views/MdToBbcode.vue')
    },
    {
      path: '/bbcode-to-html',
      name: 'bbcode-to-html',
      component: () => import('./views/BbcodeToHtml.vue')
    }
  ]
})

export default router
