import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { initializeStores } from './stores'
import { initializeServices, checkServicesHealth } from './services'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 初始化Store
initializeStores()

// 初始化API服务
initializeServices()

// 检查服务健康状态
checkServicesHealth().then(isHealthy => {
  if (isHealthy) {
    console.log('✅ API服务连接正常')
  } else {
    console.warn('⚠️ API服务连接异常，将使用模拟数据')
  }
})

app.mount('#app')
