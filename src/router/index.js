import { createRouter, createWebHistory } from 'vue-router'
import { isSignedIn, waitForAuth } from '@/stores/authStore'

const routes = [
  {
    // Halaman pertama untuk tamu (Figma: Landing page v2, L01/L02). Pemain yang sudah masuk diarahkan ke Dasbor.
    path: '/',
    name: 'landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { guestOnly: true },
  },
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
    path: '/dasbor',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mandiri',
    name: 'solo',
    component: () => import('@/views/SoloView.vue'),
    props: { step: 'overview' },
    meta: { requiresAuth: true },
  },
  {
    // Ponsel: M11 terpisah dari M10. Desktop: keduanya satu layar (D07).
    path: '/mandiri/teknik',
    name: 'solo-technique',
    component: () => import('@/views/SoloView.vue'),
    props: { step: 'technique' },
    meta: { requiresAuth: true },
  },
  {
    path: '/mandiri/sesi',
    name: 'solo-session',
    component: () => import('@/views/SoloSessionView.vue'),
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

// Halaman pajangan token dan komponen, hanya ada saat `npm run dev`
if (import.meta.env.DEV) {
  routes.push({
    path: '/dev/gaya',
    name: 'dev-style',
    component: () => import('@/views/dev/StyleGuideView.vue'),
  })
  routes.push({
    path: '/dev/komponen',
    name: 'dev-components',
    component: () => import('@/views/dev/ComponentsView.vue'),
  })
}

routes.push({ path: '/:pathMatch(.*)*', redirect: '/' })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Tautan #cara-main dan sejenisnya di landing. Pindah halaman mulai dari atas, Back kembali ke posisi lama.
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (savedPosition) return savedPosition
    if (to.path !== from.path) return { top: 0 }
    return undefined
  },
})

// Hanya terima tujuan internal supaya ?redirect tidak bisa dipakai ke situs lain
export function safeRedirect(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }
  return '/dasbor'
}

router.beforeEach(async (to) => {
  await waitForAuth()
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
