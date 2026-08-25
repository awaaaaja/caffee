import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: 'Digital Café Experience',
      description: 'Boulalulue Padang — viennoiserie, coffee, and dining. Baked with precision, served with grace. Explore the menu and reserve your table.',
    },
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('../views/Menu.vue'),
    meta: {
      title: 'Menu',
      description: 'Nusantara warmth beside familiar classics — main courses, pasta, croissant savoury, sourdough, pizza, coffee, milk-based, tea, and frappe.',
    },
  },
  { path: '/menu/:categorySlug', name: 'menu-category', component: () => import('../views/Menu.vue'), meta: { title: 'Menu', description: 'Explore Boulalulue menu by category.' } },
  {
    path: '/story',
    name: 'story',
    component: () => import('../views/Story.vue'),
    meta: {
      title: 'Our Story',
      description: 'Every dish carries a touch of comfort — the story behind Boulalulue, a digital café experience in Padang.',
    },
  },
  {
    path: '/experience',
    name: 'experience',
    component: () => import('../views/Experience.vue'),
    meta: {
      title: 'Experience',
      description: 'From our kitchen, with patience — the four quiet rituals behind every plate and cup at Boulalulue.',
    },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('../views/Gallery.vue'),
    meta: {
      title: 'Gallery',
      description: 'Moments worth lingering over — coffee flights, fresh bakes, and corners of Boulalulue.',
    },
  },
  {
    path: '/location',
    name: 'location',
    component: () => import('../views/Location.vue'),
    meta: {
      title: 'Location',
      description: 'Find Boulalulue in Padang — address, opening hours, map, and directions.',
    },
  },
  {
    path: '/reservation',
    name: 'reservation',
    component: () => import('../views/Reservation.vue'),
    meta: {
      title: 'Reserve a Table',
      description: 'Reserve your table at Boulalulue — tell us when, and we will keep a warm table ready.',
    },
  },
  { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/Login.vue'), meta: { title: 'Admin Login', description: 'Boulalulue admin access.' } },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { title: 'Admin Dashboard', requiresAuth: true, adminLayout: true },
  },
  {
    path: '/admin/menu',
    name: 'admin-menu',
    component: () => import('../views/admin/MenuManagement.vue'),
    meta: { title: 'Menu Management', requiresAuth: true, adminLayout: true },
  },
  {
    path: '/admin/gallery',
    name: 'admin-gallery',
    component: () => import('../views/admin/GalleryCms.vue'),
    meta: { title: 'Gallery CMS', requiresAuth: true, adminLayout: true, adminOnly: true },
  },
  {
    path: '/admin/reservations',
    name: 'admin-reservations',
    component: () => import('../views/admin/ReservationManagement.vue'),
    meta: { title: 'Reservations', requiresAuth: true, adminLayout: true, adminOnly: true },
  },
  {
    path: '/admin/homepage',
    name: 'admin-homepage',
    component: () => import('../views/admin/HomepageCms.vue'),
    meta: { title: 'Homepage CMS', requiresAuth: true, adminLayout: true, adminOnly: true },
  },
  {
    path: '/admin/location',
    name: 'admin-location',
    component: () => import('../views/admin/LocationSettings.vue'),
    meta: { title: 'Location Settings', requiresAuth: true, adminLayout: true, adminOnly: true },
  },
  {
    path: '/admin/reviews',
    name: 'admin-reviews',
    component: () => import('../views/admin/Reviews.vue'),
    meta: { title: 'Reviews CMS', requiresAuth: true, adminLayout: true, adminOnly: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin/Users.vue'),
    meta: { title: 'Users & Roles', requiresAuth: true, adminLayout: true, adminOnly: true, superAdminOnly: true },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('../views/admin/Settings.vue'),
    meta: { title: 'Site Settings', requiresAuth: true, adminLayout: true, adminOnly: true, superAdminOnly: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})

// PLAN.md §6: /admin/* cek sesi Supabase Auth + role di profiles
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const { init, session, profile } = useAuth()
  await init()

  if (!session.value || !userHasAdminRole(profile.value)) {
    return { path: '/admin/login', query: to.fullPath !== '/admin' ? { redirect: to.fullPath } : {} }
  }
  // halaman admin-only (mis. Gallery CMS): staff tidak diizinkan
  if (to.meta.adminOnly && profile.value?.role === 'staff') {
    return { path: '/admin' }
  }
  // PLAN.md §6: Users & Settings hanya super_admin
  if (to.meta.superAdminOnly && profile.value?.role !== 'super_admin') {
    return { path: '/admin' }
  }
  return true
})

function userHasAdminRole(profile: { role: string } | null): boolean {
  return !!profile && ['staff', 'admin', 'super_admin'].includes(profile.role)
}

const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

router.afterEach((to) => {
  const title = `${(to.meta.title as string | undefined) ?? 'Boulalulue'} — Boulalulue`
  const description = (to.meta.description as string | undefined) ?? 'Boulalulue — Digital Café Experience.'

  document.title = title
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
})

export default router
