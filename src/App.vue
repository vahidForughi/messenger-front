<script lang="ts" setup>
import {getCurrentInstance} from "vue";
import { useAuthStore } from "@/stores/auth";


const app = getCurrentInstance()
const $user = reactive({})
const authStore = useAuthStore()
const { fetchProfile, login } = authStore

const authLoading = ref(true)
if (localStorage.auth_token) {
  authLoading.value = true
  fetchProfile()
    .catch(() => authLoading.value = false)
    .finally(() => {
      authLoading.value = false
      Object.assign($user, app?.appContext.config.globalProperties?.$auth?.user)
    })
}else{
  authLoading.value = false
}


</script>

<template>
  <v-app>
    <v-main>
      <v-container v-if="!authLoading">
        <div v-if="Object.keys($user).length === 0">
          <v-btn @click="login('support@prodmee.com', '123456')">user-1</v-btn>
          <v-btn @click="login('test@test.com', '123456')">user-2</v-btn>
        </div>
        <div v-else>
          <router-view />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

