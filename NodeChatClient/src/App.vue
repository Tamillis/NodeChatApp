<template>
  <div class="monitor-frame">
    <div class="chat-container">
      <div v-if="crtEnabled" class="crt-overlay"></div>

      <div class="flex flex-col h100">
        <header>
          <span>CHAT_LOG v0.0.2 - ONLINE*</span>
          <span>{{ termDate(new Date()) }}</span>
          <span>
            <button @click="crtEnabled = !crtEnabled" class="btn" :title="crtEnabled ? 'Disable CRT' : 'Enable CRT'">
              [CRT: {{ crtEnabled ? 'ON' : 'OFF' }}]
            </button>
          </span>
        </header>

        <main class="message-feed" ref="feed">
          <div v-for="(msg, i) in messages.toReversed()" :key="i">
            <Message :msg="msg" />
          </div>
        </main>

        <footer>
          <div v-if="view === 'chat'" class="wrapper">
            <ChatForm @send-message="sendMessage" :username="user.username" />

            <button @click="view = 'auth'" class="btn" title="Switch User">
              [AUTH]
            </button>
          </div>
          <div v-else class="wrapper">
            <AuthForm v-model="user" />
            <button @click="view = 'chat'" class="btn">[INPUT]</button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import Message from "./components/Message.vue";
import ChatForm from "./components/ChatForm.vue";
import AuthForm from "./components/AuthForm.vue";

const termDate = date => date.toLocaleString("sv-SE", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
}).replace(" ", "_");

const messages = ref([]);
const user = ref({
  username: "tester",
  passwordHash: "password"
});
const feed = ref(null);
const view = ref("chat");  // should be just "chat" or "auth"
const crtEnabled = ref(true);

const socketStatus = ref("disconnected"); // 'connected', 'disconnected', 'reconnecting'
let socket = null;
let reconnectDelay = 1000;

const connect = async () => {
  socket = new WebSocket("ws://localhost:3000");
  socketStatus.value = "reconnecting";

  socket.onopen = () => {
    console.log("Connected to Chat Server");
    socketStatus.value = "connected";

    reconnectDelay = 1000; // Reset delay on successful connection
  };

  socket.onmessage = async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "messages") {
      messages.value = msg.data;
      console.log(msg)
      await scrollToBottom();
    }
  };

  socket.onclose = (e) => {
    console.log(`Socket closed. Reconnecting in ${reconnectDelay / 1000}s...`, e.reason);
    socketStatus.value = "disconnected";

    setTimeout(async () => {
      reconnectDelay *= 2;
      if (reconnectDelay <= 30000)
        await connect();
    }, reconnectDelay);
  };

  socket.onerror = (err) => {
    console.error("Socket encountered error: ", err);
    //socket.close();
  };
};

const scrollToBottom = async () => {
  await nextTick();
  if (feed.value) feed.value.scrollTop = feed.value.scrollHeight;
};

onMounted(async () => { await connect(); });

function sendMessage(msg) {
  if (!msg.trim() || !user.value.username.trim()) return;

  let body = JSON.stringify({
    type: "message",
    data: {
      user: user.value.username,
      text: msg
    }
  });

  socket.send(body);
};
</script>

<style>
@import "@/assets/site.css";

.monitor-frame {
  width: 1200px;
  /* Adjust based on your actual terminal.jpg size */
  height: 900px;
  background-image: url('@/assets/terminal.jpg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.chat-container {
  background: #0a0a0a;
  color: #33ff33;
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 0 0 1rem rgba(51, 255, 51, 0.8);

  width: 800px;
  height: 600px;
  border-radius: 20px;

  /* Positioning it slightly offset if the monitor in terminal.jpg isn't perfectly centered */
  margin-top: -40px;
}

.crt-overlay {
  position: absolute;
  top: -100vh;
  left: -50vw;
  width: 200vw;
  height: 300vh;
  pointer-events: none;
  z-index: 10;

  /* Horizontal scanlines + RGB chromatic tint */
  background: linear-gradient(rgba(18, 16, 16, 0) 50%,
      rgba(0, 0, 0, 0.2) 50%), linear-gradient(90deg,
      rgba(255, 0, 0, 0.05),
      rgba(0, 255, 0, 0.02),
      rgba(0, 0, 118, 0.05));
  background-size: 300% 6px, 6px 300%;
  animation: scanline-scroll 60s linear infinite;
}

@keyframes scanline-scroll {
  0% {
    transform: translate(0%, 0%)
  }

  100% {
    transform: translate(16%, 33%);
  }
}

header {
  border-bottom: 1px solid #33ff33;
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.message-feed {
  flex-grow: 1;
  overflow-y: auto;
}

footer {
  border-top: 1px solid #33ff33;
  padding-top: 20px;
}

/* Custom Terminal Scrollbar */
.message-feed::-webkit-scrollbar {
  width: 8px;
}

.message-feed::-webkit-scrollbar-track {
  background: #050505;
  border-left: 1px solid #1a551a;
}

.message-feed::-webkit-scrollbar-thumb {
  background: #33ff33;
  box-shadow: 0 0 10px rgba(51, 255, 51, 0.5);
  border: 1px solid #000;
}

.message-feed::-webkit-scrollbar-thumb:hover {
  background: #55ff55;
}

.message-feed {
  scrollbar-width: thin;
  scrollbar-color: #33ff33 #050505;
}

.wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
