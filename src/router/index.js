import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '../lib/supabase';

import Login from '../views/Login.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import Landing from '../views/Landing.vue';

const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
    beforeEnter: async (to, from, next) => {
      const { data } = await supabase.auth.getSession();
      const isAuthenticated = !!data.session;
      if (isAuthenticated) return next('/dashboard'); // ya logueado, va al dashboard
      next(); // no logueado, muestra landing
    },
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/Cart.vue'),
  }, 
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'sales',
        name: 'sales',
        component: () => import('../views/Sales.vue'),
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('../views/Products.vue'),
      },
      {
        path: 'pos',
        name: 'pos',
        component: () => import('../views/Salepos.vue'),
      },
      {
        path: 'egresos',
        name: 'egresos',
        component: () => import('../views/Egresos.vue'),
        meta: { admin: true },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('../views/Orders.vue'),
        meta: { admin: true },
      },
      {
        path: 'supplies',
        name: 'supplies',
        component: () => import('../views/SuppliesAdmin.vue'),
        meta: { admin: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession();
  const isAuthenticated = !!data.session;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  if (to.path === '/login' && isAuthenticated) {
    return next('/');
  }

  next();
});

export default router;
