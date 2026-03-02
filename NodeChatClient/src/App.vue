<template>
  <Debug v-model="calibration" />
  <div class="monitor-frame">
    <div class="chat-container">

      <div v-if="crtEnabled" class="crt-overlay"></div>

      <div class="flex flex-col h100">
        <header>
          <span>CHAT_LOG v0.0.4 - @</span>
          <input v-model="room" class="terminal-input input f-grow-1" />
          <span>{{ time }}</span>
          <span>
            <button @click="crtEnabled = !crtEnabled" class="btn" :title="crtEnabled ? 'Disable CRT' : 'Enable CRT'" style="width:84px">
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
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from "vue";
import {getTime} from "./assets/utils.js"
import Message from "./components/Message.vue";
import ChatForm from "./components/ChatForm.vue";
import AuthForm from "./components/AuthForm.vue";
import Debug from "./components/Debug.vue";

const messages = ref([]);
const user = ref({
  username: "tester",
  passwordHash: "password"
});
const room = ref("root");
const time = ref(getTime(new Date()));

const feed = ref(null);
const view = ref("chat");  // should be just "chat" or "auth"
const crtEnabled = ref(true);
const calibration = ref({
  screenWidth: 621,
  screenHeight: 434,
  rotateY: -2.5,
  skewY: 0.7,
  perspective: 500,
  top: -284,
  left: -157,
  radiusWidth: 92,
  radiusHeight: 150
});

const cssWidth = computed(() => `${calibration.value.screenWidth}px`);
const cssHeight = computed(() => `${calibration.value.screenHeight}px`);
const cssRotate = computed(() => `${calibration.value.rotateY}deg`);
const cssSkew = computed(() => `${calibration.value.skewY}deg`);
const cssPersp = computed(() => `${calibration.value.perspective}px`);
const cssLeft = computed(() => `${calibration.value.left}px`);
const cssTop = computed(() => `${calibration.value.top}px`);
const cssRadiusWidth = computed(() => `${calibration.value.radiusWidth}px`);
const cssRadiusHeight = computed(() => `${calibration.value.radiusHeight}px`);

const socketStatus = ref("disconnected"); // 'connected', 'disconnected', 'reconnecting'

const socketUrl = import.meta.env.VITE_WS_URL;
let socket = null;
let reconnectDelay = 1000;

let debounceTimeout = null;
watch(room, setRoom);

let timer;
onMounted(async () => { 
  timer = setInterval(() => {
    time.value = getTime(new Date());
  }, 333);
  await connect(); 
});

onUnmounted(() => {
  clearInterval(timer);
});

async function connect() {
  console.log("Attempting to connect to " + socketUrl)
  socket = new WebSocket(socketUrl);
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

  setRoom(room.value);
};

async function scrollToBottom() {
  await nextTick();
  if (feed.value) feed.value.scrollTop = feed.value.scrollHeight;
};

function setRoom(newRoom) {
  clearTimeout(debounceTimeout);

  newRoom = newRoom.trim().toLowerCase();

  messages.value = [{ 
    user: "SYSTEM", 
    timestamp: new Date(), 
    text: `CONNECTING TO ROOM: ${newRoom}...` 
  }];

  debounceTimeout = setTimeout(() => {

    if (newRoom) {
      let roomMsg = JSON.stringify({
        type: "room",
        data: newRoom.trim().toUpperCase()
      });
      socket.send(roomMsg);
    }
  }, 2000);
}

function sendMessage(msg) {
  if (!msg.trim() || !user.value.username.trim()) return;

  let body = JSON.stringify({
    type: "message",
    data: {
      user: user.value.username,
      text: msg,
      room: room.value
    }
  });

  socket.send(body);
};
</script>

<style>
@import "@/assets/site.css";

.monitor-frame {
  width: 100vw;
  /* Adjust based on your actual terminal.jpg size */
  height: 100vh;
  background-image: url('@/assets/terminal.jpg');
  background-repeat: no-repeat;
  background-position: center;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top:0px;
  left:0px;
}

.chat-container {
  position: relative;
  background: #051a00;
  color: #33ff33;
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 0 0 1rem rgba(51, 255, 51, 0.8);

  width: 800px;
  height: 600px;
  padding: 3rem;

  /* --- REFINED VINTAGE EFFECTS --- */
  border-radius: v-bind(cssRadiusWidth) / v-bind(cssRadiusHeight); 
  box-shadow: 
    inset 20px 0 40px rgba(0, 0, 0, 0.9),  /* Deeper shadow on the far edge */
    inset -10px 0 20px rgba(0, 0, 0, 0.6), 
    0 0 15px rgba(51, 255, 51, 0.05);       /* Subtle outer glow on the plastic */

  /* Fix for blurry text often caused by 3D transforms */
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;

  /* Using v-bind to link Javascript to CSS */
  width: v-bind(cssWidth);
  height: v-bind(cssHeight);
  
  /* Apply the 3D mapping */
  transform: 
    perspective(v-bind(cssPersp)) 
    rotateY(v-bind(cssRotate)) 
    skewY(v-bind(cssSkew));

  /* Positioning it slightly offset if the monitor in terminal.jpg isn't perfectly centered */
  margin-top: v-bind(cssTop);
  margin-left: v-bind(cssLeft);
}

.crt-overlay {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  border-radius: v-bind(cssRadiusWidth) / v-bind(cssRadiusHeight); 
  pointer-events: none;
  z-index: 10;

  /* Horizontal scanlines + RGB chromatic tint */
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%), 
  linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.02), rgba(0, 0, 118, 0.05));
  background-size: 100% 6px, 6px 100%;
  animation: scanline-scroll 60s linear infinite;
}

@keyframes scanline-scroll {
from {
    background-position: 0 0, 0 0;
  }
  to {
    /* Adjust these percentages to change the "speed" or direction of the drift */
    background-position: 0 100%, 100% 0;
  }
}

header {
  border-bottom: 1px solid #33ff33;
  display: flex;
  align-items: end;
  gap: 0.5rem;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.message-feed {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 4px;
}

footer {
  border-top: 1px solid #33ff33;
  padding-top: 10px;
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
