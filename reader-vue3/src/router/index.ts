import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import StoreTestView from '@/views/StoreTestView.vue'
import ReaderApp from '@/views/ReaderApp.vue'
import ApiTestView from '@/views/ApiTestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/store-test',
      name: 'store-test',
      component: StoreTestView
    },
    {
      path: '/reader',
      name: 'reader',
      component: ReaderApp
    },
    {
      path: '/api-test',
      name: 'api-test',
      component: ApiTestView
    }
  ],
})

export default router
