<template>
  <div class="chat-container">
    <div class="messages" ref="msgBox">
      <div
        v-for="(msg, i) in messages.reverse()"
        :key="i"
        :class="['msg', { mine: msg.user === username }]"
      >
        <strong>{{ msg.user }}:</strong> <small>{{msg.timestamp }}</small> {{ msg.text }}
      </div>
    </div>

    <div class="input-area">
      <input v-model="username" placeholder="Nickname" class="name-input" />
      <input v-model="currentMsg" @keyup.enter="send" class="msg-input" placeholder="Type a message..." />
      <button @click="send" :disabled="username == ''" class="btn">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";

const messages = ref([]);
const currentMsg = ref("");
const username = ref("");
const msgBox = ref(null);

let queuedMsgs = [];

const socketStatus = ref("disconnected"); // 'connected', 'disconnected', 'reconnecting'
let socket = null;
let reconnectDelay = 1000;

const connect = async () => {
  socket = new WebSocket("ws://localhost:3000");
  socketStatus.value = "reconnecting";

  socket.onopen = () => {
    console.log("Connected to Chat Server");
    socketStatus.value = "connected";
    sendQueued();
    reconnectDelay = 1000; // Reset delay on successful connection
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "messages") {
      messages.value = msg.data;

      scrollToBottom();
    }
  };

  socket.onclose = (e) => {
    console.log(`Socket closed. Reconnecting in ${reconnectDelay / 1000}s...`, e.reason);
    socketStatus.value = "disconnected";

    setTimeout(() => {
      reconnectDelay *= 2;
      if (reconnectDelay <= 30000) connect();
    }, reconnectDelay);
  };

  socket.onerror = (err) => {
    console.error("Socket encountered error: ", err);
    socket.close();
  };
};

const scrollToBottom = async () => {
  await nextTick();
  if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight;
};

const buildMsg = () =>
  JSON.stringify({
    type: "message",
    data: {
      user: username.value,
      text: currentMsg.value
    }
  });

onMounted(() => connect());

const send = () => {
  if (!currentMsg.value.trim() || !username.value.trim()) return;

  if (socket.readyState !== socket.OPEN) {
    connect();
    queuedMsgs.push(buildMsg());
  } else socket.send(buildMsg());

  currentMsg.value = "";
};

const sendQueued = () => {
  for (let msg in queuedMsgs) socket.send(msg);
  queuedMsgs = [];
};
</script>

<style scoped>
@import "@/assets/site.css";

.chat-container {
  max-width: 600px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  height: 80vh;
  border: 1px solid #ddd;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f9f9f9;
}
.msg {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: white;
}
.mine {
  background: #e3f2fd;
}
.input-area {
  display: flex;
  gap: 0px;
  padding: 1rem;
}
.input-area>*:first-child{
  border-radius: 4px 0px 0px 4px;
}
.input-area>*:last-child{
  border-radius: 0px 4px 4px 0px;
  border-right: 1px solid #666;
}
.btn, input {
  background: #e3f2fd;
  padding: 8px;
  outline: none;
  border: #666 1px solid;
  border-right: none;
}
.name-input {
  width: 25%;
}
.msg-input {
  flex-grow: 1;
}
</style>
