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
        component: () => import('@/pages/home/index.vue')
      },
      {
        path: '/dictionary',
        name: 'Dictionary',
        component: () => import('@/pages/dictionary/index.vue')
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('@/pages/about/index.vue')
      }
    ]
  },
  {
    path: '/detail/:id?',
    name: 'Detail',
    component: () => import('@/pages/home/DetailPage.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
