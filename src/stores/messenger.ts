// Utilities
import {defineStore} from 'pinia'
import request from "@/plugins/api";
import {getCurrentInstance, reactive, ref} from "vue";
import {MessageStatus, UploadStatus, UserActiveStatus} from "@/enums/messengerUserEnums";

export const useMessengerStore = defineStore('messenger', () => {
  const favorites = ref([])
  const users = ref([])
  const messages = ref([])
  const messengerUser = reactive({})
  const newMessage = reactive({
    body: '',
    attachment: {
      token: '',
      new_name: '',
      file: {},
      is_last_chunk: false,
      chunks: [],
      chunk_uploaded_count: 0,
      chunk_uploaded_percent: 0,
      upload_status: UploadStatus.Empty,
    },
  })

  const app = getCurrentInstance()
  const $user = reactive(app?.appContext.config.globalProperties?.$auth?.user)

  function fetchFavorites(page: number = 1) {
    request.get(`/messenger-favorites?page=${page}`).then((res) => {
      console.log('favrites',res)
      favorites.value.push(...res.filter(r => !favorites.value.map(favorite => favorite.id).includes(r.id) ))
    });
  }

  function fetchUsers(page: number = 1) {
    return request.get(`/messenger-users?page=${page}`).then((res) => {
      console.log('users',res)
      users.value.push(...res.filter(r => !users.value.map(user => user.id).includes(r.id) ))
    });
  }

  function changeUserLastMessageAndSort(user: object, message: object) {
    const userIndex = users.value.findLastIndex(u => u.id === user.id)
    if (userIndex != -1) {
      users.value.splice(userIndex, 1)
    }
    users.value.unshift({
      ...user,
      last_message: message
    })

  }

  function changeUserActiveStatus(userID: int, activeStatus: UserActiveStatus) {
    const userIndex = users.value.findLastIndex(u => u.id === userID)
    if (userIndex != -1) {
      users.value[userIndex].active_status = activeStatus
    }
    if (messengerUser.id === userID) {
      messengerUser.active_status = activeStatus
    }
  }

  function changeUserTyping(userID: int, typing: boolean) {
    const userIndex = users.value.findLastIndex(u => u.id === userID)
    if (userIndex != -1) {
      users.value[userIndex].typing = typing
    }
    if (messengerUser.id === userID) {
      messengerUser.typing = typing
    }
  }

  function fetchMessengerUser(userID) {
    Object.assign(messengerUser, {})
    resetMessages()
    request.get(`/messenger-users/${userID}`).then((res) => {
      Object.assign(messengerUser, res)
    });
  }

  function resetMessages() {
    messages.value = [];
  }

  function addNewMessages(newMessages, toStart: boolean = false) {
    console.log('addNewMessages', newMessages)
    const addType = toStart ? 'unshift' : 'push'

    newMessages.forEach(msg => {
      let date = new Date(msg.created_at)
      const message = {
        uuid: msg?.uuid,
        id: msg.id,
        from_id: msg.from_id,
        to_id: msg.to_id,
        body: msg.body,
        attachment: msg.attachment,
        seen: msg.seen,
        status: msg?.status ?? (msg.seen ? MessageStatus.Seened : MessageStatus.UnSeened),
        created_at: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`,
      }
      // console.log(messages.value)
      // console.log('check',msg, msg?.uuid, msg?.id)
      let index = msg?.uuid ? messages.value.map(m => m.uuid).indexOf(msg.uuid) : -1
      index = (index < 0 && msg?.id) ? messages.value.map(m => m.id).indexOf(msg.id) : index
      // console.log('index',index)
      if( index >= 0 ) {
        // console.log('1111')
        messages.value[index] = message
      }else{
        // console.log('2222')
        messages.value[addType](message)
      }
    })
    // console.log('messages', messages)
  }

  function changeMessageStatus(messageID: int, status: MessageStatus) {
    let index = messages.value.findLastIndex(m => m.uuid === messageID)
    index = index < 0 ? messages.value.findLastIndex(m => m.id === messageID) : index;
    if (index != -1) {
      messages.value[index].status = status
    }
  }

  function changeMessageSeen(messageID: int, seen: boolean) {
    const index = messages.value.findLastIndex(m => m.id === messageID)
    if (index != -1) {
      messages.value[index].seen = seen
      if (messages.value[index].status == MessageStatus.UnSeened && seen) {
        messages.value[index].status = MessageStatus.Seened
      }
    }
  }

  function fetchMessages(userID, page: number = 1) {
    console.log(userID, page)
    return request.get(`/messenger-users/${userID}/messages?page=${page}`).then((res) => {
      addNewMessages(res, true)
    });
  }

  function sendNewMessage(toUserID) {
    console.log('newMessage', newMessage)
    const uuid = crypto.randomUUID()
    const message = {
      uuid: uuid,
      from_id: $user.id,
      to_id: messengerUser.id,
      body: newMessage.body,
      seen: false,
      created_at: Date(),
      status: MessageStatus.Sending,
    }
    addNewMessages([message])
    const params = {}
    if (newMessage.body.length > 0) {
      params.body = newMessage?.body
    }
    if (newMessage.attachment?.upload_status == UploadStatus.Uploaded) {
      params.attachment = {
        'old_name': newMessage?.attachment?.file.name,
        'new_name': newMessage?.attachment?.new_name,
        'token': newMessage?.attachment?.token,
      }
    }
    return request.post(`/messenger-users/${toUserID}/messages`, params)
      .then((res) => {
        console.log(res)
        addNewMessages([{
          ...res,
          uuid: uuid
        }])
        resetNewMessage()
        changeUserLastMessageAndSort(res.to_user, res)
      })
      .catch(() => {
        changeMessageStatus(message.uuid, MessageStatus.Failed)
      });
  }

  function removeMessage(messageID) {
    const index = messages.value.map((m) => m.id).indexOf(messageID)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  const deleteMessageLoading = ref([])
  function deleteMessage(message) {
    deleteMessageLoading.value[`message-${message.id}`] = true
    console.log('deleteMessageLoading', deleteMessageLoading.value)
    request.delete(`/messenger-users/${message.to_id}/messages/${message.id}`)
      .then((res) => {
        removeMessage(message.id)
        console.log('removed', deleteMessageLoading.value)
      })
      .catch(() => {
        deleteMessageLoading.value.slice(`message-${message.id}`, 1)
      })
  }

  function resetNewMessage() {
    Object.assign(newMessage,{
      body: '',
      attachment: {
        token: '',
        new_name: '',
        file: {},
        is_last_chunk: false,
        chunks: [],
        chunk_uploaded_count: 0,
        chunk_uploaded_percent: 0,
        upload_status: UploadStatus.Empty,
      }
    })
  }

  function resetNewMessageAttachment() {
    newMessage.attachment = {
      token: '',
      new_name: '',
      file: {},
      is_last_chunk: false,
      chunks: [],
      chunk_uploaded_count: 0,
      chunk_uploaded_percent: 0,
      upload_status: UploadStatus.Empty,
    }
  }

  function prepareAttachment(file) {
    console.log('file', file)
    resetNewMessageAttachment()
    newMessage.attachment.upload_status = UploadStatus.Preparing
    newMessage.attachment.file = file
    // Object.assign(newMessage.attachment.file, file)
    let size = 2048 * 5000
    let chunks = Math.ceil(newMessage.attachment.file.size / size);

    console.log('newMessage', newMessage)
    console.log('chunks', chunks)

    for (let i = 0; i < chunks; i++) {
      newMessage.attachment.chunks.push(
        newMessage.attachment.file.slice(
          i * size, Math.min(i * size + size, newMessage.attachment.file.size), newMessage.attachment.file.type
        )
      );
    }
    console.log()
  }

  function uploadAttachment() {
    console.log('uploadAttachment')
    console.log('newMessage', newMessage)
    let formData = new FormData;
    formData.set('token', newMessage.attachment?.token);
    formData.set('name', newMessage.attachment?.new_name);
    formData.set('file_chunk', newMessage.attachment.chunks[0], `${newMessage.attachment.file.name}.part`);
    formData.set('is_last_chunk', newMessage.attachment.chunks.length === 1 ? 1 : 0);

    console.log('formData', formData.values())

    let reqService = {}
    Object.assign(reqService, request.service)
    console.log('req', reqService)

    reqService.interceptors.request.use((req) => {
      req.headers['Content-Type'] = 'application/octet-stream'
      req.onUploadProgress = event => {
        newMessage.attachment.upload_status = UploadStatus.Uploading
        console.log('onUploadProgress',event.loaded, event)
        newMessage.attachment.chunk_uploaded_count += event.loaded;
        newMessage.attachment.chunk_uploaded_percent = newMessage.attachment.chunk_uploaded_count / newMessage.attachment.file.size * 100
      }
      return req;
    });

    const __randNum = Math.random();
    reqService.post('/messenger-files/upload-chunk', formData, { params: { __randNum } })
    .then(({data}) => {
      console.log(data.data)
      newMessage.attachment.new_name = data.data.new_name;
      newMessage.attachment.token = data.data.token;
      newMessage.attachment.chunks.shift();
      console.log('then upload', newMessage)
      if (newMessage.attachment.chunks.length > 0) {
        uploadAttachment()
      }else {
        newMessage.attachment.upload_status = UploadStatus.Uploaded
      }
    })
      .catch(() => {
        newMessage.attachment.upload_status = UploadStatus.Failed
      })
  }

  return {
    favorites,
    users,
    messages,
    messengerUser,
    newMessage,
    fetchFavorites,
    fetchUsers,
    fetchMessages,
    fetchMessengerUser,
    resetMessages,
    addNewMessages,
    sendNewMessage,
    changeUserLastMessageAndSort,
    changeUserActiveStatus,
    changeUserTyping,
    changeMessageSeen,
    changeMessageStatus,
    removeMessage,
    deleteMessage,
    deleteMessageLoading,
    prepareAttachment,
    uploadAttachment,
    resetNewMessageAttachment,
  }
})
