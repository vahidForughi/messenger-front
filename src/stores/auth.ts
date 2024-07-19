// Utilities
import { defineStore } from 'pinia'
import request from "@/plugins/api";
import {UserActiveStatus} from "@/enums/messengerUserEnums";
import {getCurrentInstance, reactive} from "vue";

export const useAuthStore = defineStore('auth', () => {
  const app = getCurrentInstance()
  const $user = reactive(app?.appContext.config.globalProperties?.$auth?.user)

  function login(email, password) {
    request.post("/login", {
      email: email,
      password: password,
    })
      .then(res => {
        localStorage.setItem('auth_token', res.token);
        window.location.reload(true);
      })
  }

  function fetchProfile() {
    return request.get('/profile').then(res => {
      app.appContext.config.globalProperties.$auth = {
        token: localStorage.getItem('auth_token'),
        user: res,
      }
    })
  }

  function updateMyActiveStatus(status: UserActiveStatus) {
    request.put('/messenger-profile/active-status', {
      active_status: status
    })
      .then((res) => {
        $user.active_status = UserActiveStatus.Active
      })
  }

  return {
    login,
    fetchProfile,
    updateMyActiveStatus,
  }
})
