/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import {EchoPlugin} from "@/plugins/pusher";

const app = createApp(App).use(EchoPlugin)

registerPlugins(app)

app.mount('#app')
