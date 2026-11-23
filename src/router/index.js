import { createRouter, createWebHistory } from 'vue-router'
import { isSignedIn } from '@/stores/authStore'

const routes = [
  {
    path: '/masuk',
    name: 'login',
    component: () => import('@/views/AuthView.vue'),
    props: { mode: 'login' },
    meta: { guestOnly: true },
  },
  {
    path: '/daftar',
    name: 'register',
    component: () => import('@/views/AuthView.vue'),
    props: { mode: 'register' },
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/room/:id',
    name: 'lobby',
    component: () => import('@/views/LobbyView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/room/:id/arena',
    name: 'arena',
    component: () => import('@/views/ArenaView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/room/:id/hasil',
    name: 'result',
    component: () => import('@/views/ResultView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
]

// Halaman pajangan token, hanya ada saat `npm run dev`
if (import.meta.env.DEV) {
  routes.push({
    path: '/dev/gaya',
    name: 'dev-style',
    component: () => import('@/views/dev/StyleGuideView.vue'),
  })
}

routes.push({ path: '/:pathMatch(.*)*', redirect: '/' })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Hanya terima tujuan internal supaya ?redirect tidak bisa dipakai ke situs lain
export function safeRedirect(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }
  return '/'
}

router.beforeEach((to) => {
  const signedIn = isSignedIn()

  if (to.meta.requiresAuth && !signedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && signedIn) {
    return safeRedirect(to.query.redirect)
  }

  return true
})

export default router
