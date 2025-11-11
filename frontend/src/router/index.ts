import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/pages/home/index.vue'),
        meta: { keepAlive: true }
      },
      {
        path: '/dictionary',
        name: 'Dictionary',
        component: () => import('@/pages/dictionary/index.vue'),
        meta: { keepAlive: true }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/pages/settings/index.vue'),
        meta: { keepAlive: true }
      }
    ]
  },
  {
    path: '/detail/:id?',
    name: 'Detail',
    component: () => import('@/pages/home/DetailPage.vue'),
    props: true,
    meta: { keepAlive: false }
  },
  // 系统设置页面
  // {
  //   path: '/settings',
  //   name: 'Settings',
  //   component: () => import('@/pages/settings/index.vue')
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
