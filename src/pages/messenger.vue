<script lang="ts" setup>
import {getCurrentInstance, reactive, ref} from 'vue'
import defaultUserAvatar from '@/assets/default-user-avatar.svg'
import saveMessageAvatar from '@/assets/save-messages-avatar.svg'
import {useMessengerStore} from "@/stores/messenger";
import {UserActiveStatus} from "@/enums/messengerUserEnums";
import {storeToRefs} from "pinia";
import {useAuthStore} from "@/stores/auth";

const app = getCurrentInstance()
const $user = reactive(app?.appContext.config.globalProperties?.$auth?.user)
const $echo = reactive(app?.appContext.config.globalProperties?.$echo)

const authStore = useAuthStore()
const { updateMyActiveStatus } = authStore;

const messengerStore = useMessengerStore()
const { favorites, users } = storeToRefs(messengerStore)
const { fetchFavorites, fetchUsers, addNewMessages, changeUserLastMessage, changeUserActiveStatus } = messengerStore

const favoritesPage = ref(1)
fetchFavorites(favoritesPage.value)


const usersPage = ref(1)
async function loadMoreUsers({done}) {
  const usersLength = users.value.length
  fetchUsers(usersPage.value).then(() => {
    if (users.value.length > usersLength) {
      console.log('done-ok')
      usersPage.value += 1;
      done('ok')
    }
    else{
      console.log('done-empty')
      done('empty')
    }
  })
}

$echo.join('Messenger')
  .here( users => {
    console.log('here', users)
    if ($user.active_status != UserActiveStatus.Active) {
      updateMyActiveStatus(UserActiveStatus.Active)
      changeUserActiveStatus($user.id, UserActiveStatus.Active)
    }
  })
  .joining((user) => {
    console.log('joining', user)
    changeUserActiveStatus(user.id, UserActiveStatus.Active)
  })
  .leaving((user) => {
    console.log('leaving', user)
    changeUserActiveStatus(user.id, UserActiveStatus.InActive)
  })
  .listen('.Modules\\messenger\\app\\Events\\UserActiveStatusUpdated', (e) => {
    console.log('UserActiveStatusUpdated', e)
    changeUserActiveStatus(e.user.id, e.user.active_status)
  });

</script>

<template>

  <v-row class="justify-space-between h-100">
    <v-col cols="4">
      <v-card
        flat
        color="#232A37"
        class="rounded-lg"
      >
        <v-card-title>
          <v-icon>envelope</v-icon>
          Messages
        </v-card-title>

        <v-card-text>
          <v-list
            v-if="favorites.length > 0"
            lines="two"
            class="bg-transparent"
          >
            <v-list-item
              v-for="favorite in favorites"
              :key="favorite.id"
              :title="favorite.id != $user.id ? favorite.name : 'Save Messages'"
              :subtitle="favorite.id != $user.id ? favorite.subtitle : 'Save messages secretly'"
              flat
              color="rgba(255, 255, 255, 0.03)"
              class="rounded"
              :to="{
                name: '/messenger/users/[user_id]',
                params: {
                  user_id: favorite.id,
                  // messenger_user: user,
                }
              }"
            >
              <template v-slot:prepend>
                <v-avatar
                  color="surface-variant"
                  size="48"
                  :src="(favorite.id != $user.id ? favorite.avatar : saveMessageAvatar) ?? defaultUserAvatar"
                >
                </v-avatar>
              </template>

              <template v-slot:append>
                <span>{{ favorite.created_at }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-subtitle>All Messages</v-card-subtitle>

        <v-card-text>
          <v-infinite-scroll
            side="start"
            @load="loadMoreUsers"
            class="h-screen"
          >
            <template v-slot:empty>

            </template>
            <v-list
              v-if="users.length > 0"
              lines="two"
              class="bg-transparent"
            >
              <v-list-item
                v-for="user in users"
                :key="user.id"
                flat
                color="white"
                class="border-b-sm"
                :to="{
                  name: '/messenger/users/[user_id]',
                  params: {
                    user_id: user.id,
                    // messenger_user: user,
                  }
                }"
              >
                <v-list-item-title class="text-body-2">
                  {{ user.id != $user.id ? user.name : 'Save Messages' }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-caption d-block text-truncate">
                  {{ user.last_message.body }}
                </v-list-item-subtitle>

                <template v-slot:prepend>
                  <v-badge
                    :color="user.active_status == UserActiveStatus.Active ? 'success' : '#232A37'"
                    size="16"
                    location="bottom end"
                    offset-x="5"
                    offset-y="5"
                    class="border-md border-secondary rounded-circle text-white"
                  >
                    <v-avatar
                      color="surface-variant"
                      size="48"
                      :src="(user.id != $user.id
                          ? user.avatar
                          : saveMessageAvatar)
                          ?? defaultUserAvatar"
                    >
                    </v-avatar>
                  </v-badge>
                </template>

                <template v-slot:append>
                  <span class="text-caption position-absolute top-0 right-0 pa-3">{{ user.last_message.humanized_created_at }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-infinite-scroll>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="8">
      <v-card
        flat
        color="#232A37"
        class="rounded-lg"
      >
        <v-card-text>
          <router-view />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>


</template>
