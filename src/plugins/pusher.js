import Echo from 'laravel-echo';
import apiConfig from '@/config/api';
import Pusher from 'pusher-js';

// define a plugin
const key = "__CURRENT_APP__"
export const EchoPlugin = {
  install(app, options) {
    app.provide(key, app)
    app.config.globalProperties.$pusher = Pusher;
    app.config.globalProperties.$echo = new Echo({
      authEndpoint: apiConfig.baseUrl + '/broadcasting/auth',
      auth: {
        headers: {
          'Authorization': apiConfig.authorization,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      },
      encrypted: true,
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: false
    });
  }
}



