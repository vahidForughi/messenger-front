<script lang="ts" setup>
import {ref, reactive, getCurrentInstance, watch} from 'vue'
import { useRoute } from 'vue-router'
import defaultUserAvatar from '@/assets/default-user-avatar.svg'
import saveMessageAvatar from '@/assets/save-messages-avatar.svg'
import fileIcon from '@/assets/file-icon.svg'
import videoIcon from '@/assets/video-icon.svg'
import sendIcon from '@/assets/send-icon.svg'
import {useMessengerStore} from "@/stores/messenger";
import {storeToRefs} from "pinia";
import {MessageStatus, UserActiveStatus, UploadStatus} from "@/enums/messengerUserEnums";
import {useGoTo} from "vuetify";

const app = getCurrentInstance()
const $auth = reactive(app?.appContext.config.globalProperties?.$auth)
const $user = reactive($auth?.user)
const $echo = reactive(app?.appContext.config.globalProperties?.$echo)

const route = useRoute()

const messengerStore = useMessengerStore()
const { messengerUser, messages, newMessage } = storeToRefs(messengerStore);
const {
  fetchMessengerUser,
  fetchMessages,
  resetMessages,
  sendNewMessage,
  addNewMessages,
  changeUserLastMessageAndSort,
  changeMessageSeen,
  deleteMessage,
  deleteMessageLoading,
  removeMessage,
  changeUserTyping,
  prepareAttachment,
  uploadAttachment,
  resetNewMessageAttachment,
} = messengerStore;

await fetchMessengerUser(route.params.user_id)

const goTo = useGoTo()
const messageScrollOptions = {
  container: '#messages-box',
  duration: 200,
  offset: -10,
}
function scrollToMessage(message) {
  setTimeout(() => {
    const last_message_id = message?.id ?? message?.uuid
    if (last_message_id) {
      console.log('goTo', last_message_id)
      goTo(`#message-${last_message_id}` , messageScrollOptions)
    }
  }, 300)
}
function scrollToLastMessage() {
  scrollToMessage(messages.value[messages.value.length - 1])
}

const messagesPage = ref(1)
watch(route, async (to, from) => {
  console.log('route', to, from)
  resetMessages();

  await fetchMessengerUser(to.params.user_id)

  resetRoomChannel(to.params.user_id, typeof from !== "undefined" ? from.params.user_id : null)

  messagesPage.value = 1
  fetchMessages(to.params.user_id, messagesPage.value).then(() => {
    console.log('fetchMessage')
    scrollToLastMessage()
  })
}, {flush: 'pre', immediate: true, deep: true})

async function loadMoreMessages({done}) {
  console.log('loadMoreMessages')
  const messagesLength = messages.value.length
  fetchMessages(route.params.user_id, messagesPage.value).then(() => {
    if (messages.value.length > messagesLength) {
      messagesPage.value += 1;
      done('ok')
    }
    else{
      done('empty')
    }
  }).catch(() => {
      done('error')
  })
}

let roomChannel;
resetRoomChannel()

function resetRoomChannel (to_user_id ,from_user_id) {
  if (from_user_id) {
    $echo.leave(`Messenger.Room.${Math.min($user.id, from_user_id)}-${Math.max($user.id, from_user_id)}`);
  }

  roomChannel = $echo.private(`Messenger.Room.${Math.min($user.id, to_user_id)}-${Math.max($user.id, to_user_id)}`);

  console.log('roomChannel', roomChannel)

  let userTypingTimeout = {};
  roomChannel.listenForWhisper('typing', (e) => {
    changeUserTyping(e.user.id, e.typing);
    clearTimeout(userTypingTimeout)
    userTypingTimeout = setTimeout(function() {
      changeUserTyping(e.user.id, false);
    }, 1000)
  });

  roomChannel.listenForWhisper('message-seen', (e) => {
    console.log('listen message-seen', e)
    changeMessageSeen(e.message_id, e.seen);
  });
}

const isTypingTimeout = ref([])
function isTyping() {
  isTypingTimeout.value.push(
    setTimeout(function() {
      roomChannel.whisper('typing', {
        user: $user,
        typing: true
      });
      isTypingTimeout.value.forEach((t, i) => clearTimeout(isTypingTimeout.value[i]))
    }, 400));
}

$echo.private(`Messenger.User.${$user.id}`)
  .listen('.Modules\\messenger\\app\\Events\\MessageSentEvent', (e) => {
    console.log('MessageSentEvent ', e)
    if (e.message.from_id != $user.id) {
      if (e.message.from_id == messengerUser.value.id) {
        addNewMessages([e.message])
        scrollToMessage(e.message)
      }
      else{
        changeUserLastMessageAndSort(e.message.from_user, e.message)
      }
    }
    console.log('send message-seen', e)
    roomChannel.whisper('message-seen', {
      message_id: e.message.id,
      seen: true
    });


  })
  .listen('.Modules\\messenger\\app\\Events\\MessageDeletedEvent', (e) => {
    console.log('MessageSentEvent ', e)
      removeMessage(e.messageID)

      //TODO: changeUserLastMessage and resort
  });

function sendMessage() {
  sendNewMessage(messengerUser.value.id).then(() => {
    scrollToLastMessage()
  })
}

const deleteMessageDialog = ref(false)
const messageToDelete = ref({})

function openDeleteMessageDialog(message) {
  Object.assign(messageToDelete, message)
  deleteMessageDialog.value = true
}

function deleteMessageAgree() {
  deleteMessage(messageToDelete)
  Object.assign(messageToDelete, {})
  deleteMessageDialog.value = false
}

function attachmentChanged(event) {
  console.log('event',event)
  prepareAttachment(event.target.files.item(0))
  uploadAttachment()
}

function amISent(message) {
  return message.from_id === $user.id
}

function humanizeFileSize(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

onUnmounted(() => {

})


</script>

<template>

  <v-card
    flat
    color="#232A37"
    rounded-lg
  >
    <v-card-text class="pa-0">
      <v-card
        color="transparent"
        flat
      >

        <template v-slot:title>
          <v-card-title class="position-absolute top-0 text-body-1 py-3">{{ messengerUser.id != $user.id ? messengerUser.name :  'Save Messages' }}</v-card-title>
        </template>

        <v-card-subtitle>{{ messengerUser.id != $user.id ? messengerUser.subtitle :  'Save messages secretly' }}</v-card-subtitle>

        <template v-slot:prepend>
          <v-badge
            :color="messengerUser.active_status == UserActiveStatus.Active ? 'success' : '#232A37'"
            size="16"
            location="bottom end"
            offset-x="5"
            offset-y="5"
            class="border-md border-secondary rounded-circle text-white"
          >
            <v-avatar
              color="surface-variant"
              size="48"
              :src="(messengerUser.id != $user.id
                  ? messengerUser.avatar
                  : saveMessageAvatar)
                  ?? defaultUserAvatar"
            >
            </v-avatar>
          </v-badge>
        </template>


      </v-card>
    </v-card-text>

    <v-divider></v-divider>

    <template v-if="messages.length > 0">
      <v-infinite-scroll
        side="start"
        @load="loadMoreMessages"
        class="h-screen"
      >
        <template v-slot:empty>

        </template>
        <v-list
          lines="two"
          class="bg-transparent pb-16"
          id="messages-box"
        >
          <v-list-item
            v-for="(message, index) in messages"
            :key="index"
            :id="`message-${message?.id ?? message?.uuid}`"
            flat
            color="transparent"
            :class="`${amISent(message) ? 'dir-rtl text-left' : ''} px-0 py-3 align-start`"
          >
            <template v-slot:prepend>
              <v-avatar
                color="surface-variant"
                size="32"
                :src="(amISent(message)
                    ? $user.avatar
                    : (message.from_id == messengerUser.id ? messengerUser.avatar : null))
                    ?? defaultUserAvatar"
              >
              </v-avatar>
            </template>

            <v-card
              :color="amISent(message) ? '#C52121' : '#161C27'"
              :class="`message-card ${amISent(message) ? 'rounded-te-0' : 'rounded-ts-0'} d-flex position-relative overflow-visible`"
              max-width="50%"
            >
              <v-card-text v-if="message.attachment?.new_name" class="w-100 pa-0 text-body-1 align-center float-right">
                <div
                  v-if="message.attachment?.mimetype?.substring(0,5) == 'image'"
                  class="cursor-pointer"
                >
                  <v-img
                    :src="message.attachment.preview_url ? `${message.attachment.preview_url}?auth_token=${$auth.token}`: ''"
                    width="100%"
                    min-height="200"
                    height="auto"
                    cover
                    :class="`message-card ${amISent(message) ? 'rounded-te-0' : 'rounded-ts-0'}`"
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular
                          color="grey-lighten-4"
                          indeterminate
                        ></v-progress-circular>
                      </div>
                    </template>
                  </v-img>
                  <v-overlay
                    activator="parent"
                    scroll-strategy="block"
                    class="align-center justify-center pa-20"
                  >
                    <v-img
                      :aspect-ratio="1"
                      :src="message.attachment.preview_url ? `${message.attachment.preview_url}?auth_token=${$auth.token}`: ''"
                      width="auto"
                      height="100dvh"
                    >
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular
                            color="grey-lighten-4"
                            indeterminate
                          ></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                  </v-overlay>
                </div>
                <v-list
                  v-else
                  lines="two"
                  class="bg-transparent rounded-lg pa-0"
                >
                  <a
                    target="_blank"
                    :href="message.attachment.preview_url ? `${message.attachment.preview_url}?auth_token=${$auth.token}` : ''"
                    class="text-decoration-none"
                  >
                    <v-list-item
                      class="py-4 px-6 text-white"
                    >
                      <template v-slot:prepend>
                        <v-img
                          :src="message.attachment?.mimetype?.substring(0,5) == 'video' ? videoIcon : fileIcon"
                          width="75"
                        ></v-img>
                      </template>
                      <v-list-item-title class="px-3 pt-2 pb-1">{{ message.attachment.old_name }}</v-list-item-title>
                      <v-list-item-subtitle class="px-3 pt-1 pb-2">{{ humanizeFileSize(message.attachment.size) }}</v-list-item-subtitle>
                    </v-list-item>
                  </a>
                </v-list>
              </v-card-text>
              <v-card-text v-else class="text-body-1">{{ message.body }}</v-card-text>

              <v-btn
                v-if="amISent(message)"
                @click="openDeleteMessageDialog(message)"
                :loading="deleteMessageLoading[`message-${message?.id}`]"
                color="transparent"
                size="small"
                icon="mdi-trash-can-outline"
                flat
                class="text-red position-absolute trash-btn"
              ></v-btn>
            </v-card>

            <span class="d-flex pa-1">
              {{ message.created_at }}
              <div v-if="amISent(message)" class="px-2">
                <v-icon v-if="message.status == MessageStatus.Sending" color="default">mdi-clock-time-three-outline</v-icon>
                <v-icon v-if="message.status == MessageStatus.UnSeened" color="success">mdi-check</v-icon>
                <v-icon v-if="message.status == MessageStatus.Seened" color="success">mdi-check-all</v-icon>
                <v-icon v-if="message.status == MessageStatus.Failed" color="red">mdi-message-alert-outline</v-icon>
              </div>
            </span>

          </v-list-item>

          <v-list-item
            v-if="messengerUser.typing"
            flat
            color="transparent"
            class="px-0 py-3 align-start"
            id="is-typing"
          >
            <template v-slot:prepend>
              <v-avatar
                color="surface-variant"
                size="32"
                :src="messengerUser.avatar ?? defaultUserAvatar"
              >
              </v-avatar>
            </template>

            <v-card
              :color="'#161C27'"
              class="message-card rounded-ts-0"
              max-width="70%"
            >
              <v-card-text class="text-body-1">Typing ...</v-card-text>
            </v-card>

          </v-list-item>
        </v-list>

        <v-dialog
          v-model="deleteMessageDialog"
          max-width="400"
        >
          <v-card
            prepend-icon="mdi-alert-decagram-outline"
            text="Delete message"
            title="Are you sure?"
          >
            <template v-slot:actions>
              <v-spacer></v-spacer>
              <v-btn @click="deleteMessageDialog = false">
                Disagree
              </v-btn>

              <v-btn @click="deleteMessageAgree()">
                Agree
              </v-btn>
            </template>
          </v-card>
        </v-dialog>
      </v-infinite-scroll>
    </template>


    <v-card-text>
      <v-sheet
        color="#2A303D"
        class="mx-auto rounded-lg"
      >
        <v-form fast-fail @submit.prevent="sendMessage()" class="message-form">
          <v-text-field
            v-model="newMessage.body"
            placeholder="Type your message here..."
            @keydown="isTyping"
            color="#2A303D"
            class="bg-transparent pa-3"
            variant="outlined"
            hide-details
          >
            <template v-slot:append-inner>
              <v-file-input
                @input="attachmentChanged"
                color="#C52121"
                class="attachment-input px-3"
                hide-details
                hide-input
              >
              </v-file-input>
            </template>
            <template v-slot:append>
              <v-btn
                color="#C52121"
                class="py-3 px-8 absolute top-0 send-btn"
                type="submit"
                size=""
              >
                <v-img
                  :src="sendIcon"
                  width="20"
                  class="mx-2"
                ></v-img>
                <span class="text-none">Send</span>
              </v-btn>
            </template>
          </v-text-field>
          <div class="bg-transparent">
            <v-chip
              v-if="newMessage.attachment.chunk_uploaded_percent > 0"
              class="px-1 rounded-pill"
              label
            >
              <v-progress-circular
                v-if="[UploadStatus.Preparing, UploadStatus.Uploading].includes(newMessage?.attachment?.upload_status)"
                size="small"
                color="#2A303D"
                :indeterminate="newMessage?.attachment?.upload_status == UploadStatus.Preparing"
                :model-value="newMessage?.attachment?.chunk_uploaded_percent"
              ></v-progress-circular>
              <v-btn
                v-else-if="newMessage?.attachment?.upload_status == UploadStatus.Failed"
                color="transparent"
                size="small"
                flat
                icon="mdi-refresh"
                @click="uploadAttachment"
              ></v-btn>
              <v-icon
                v-else-if="newMessage?.attachment?.upload_status == UploadStatus.Uploaded"
                color="success"
                size="large"
              >mdi-check-circle-outline</v-icon>
              <span class="px-2">{{ newMessage.attachment?.file.name }}</span>
              <v-btn
                @click="resetNewMessageAttachment"
                color="#2A303D"
                icon="mdi-close"
                variant="text"
                size="x-small"
              ></v-btn>
            </v-chip>
          </div>
        </v-form>
      </v-sheet>
    </v-card-text>
  </v-card>

</template>

<style scoped>

.dir-rtl {
  direction: rtl;
}

.message-card {
  border-radius: 6px;
  box-shadow: 0px 2px 4px 0px rgba(15, 20, 34, 0.4);
}

.message-form .v-field__outline {
  border: none !important;
}

.attachment-input {
  color: #C52121;
}

.trash-btn {
  top: -5px;
  left: -35px;
}

.send-btn {
  border-radius: 14px;
  box-shadow: 0px 4px 4px 0px #0000000A;
}

</style>
