import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { isSupabaseConfigured } from '../services/supabase/client';
import { useAuthStore } from '../stores/auth';
import { resolveNavigation } from './guard';

declare module 'vue-router' {
  interface RouteMeta {
    /** Which shell wraps the page: 'app' (tracker header), 'catalog', or 'blank'. */
    layout?: 'app' | 'catalog' | 'blank';
    requiresAuth?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'catalog',
    component: () => import('../pages/CatalogPage.vue'),
    meta: { layout: 'catalog' },
  },
  {
    path: '/tracker',
    name: 'tracker',
    component: () => import('../pages/DashboardPage.vue'),
    meta: { layout: 'app', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { layout: 'blank' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!isSupabaseConfigured) {
    if (auth.status !== 'authed') auth.setLocalMode();
    return true;
  }

  // Resolve the session once before the first auth-gated navigation.
  if (auth.status === 'loading') {
    await auth.init();
  }

  return resolveNavigation(to, {
    supabaseConfigured: isSupabaseConfigured,
    authStatus: auth.status,
  });
});
