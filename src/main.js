import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './stores/authStore'

import './styles/tokens.css'
import './styles/type.css'
import './styles/base.css'

initAuth()

createApp(App).use(router).mount('#app')
