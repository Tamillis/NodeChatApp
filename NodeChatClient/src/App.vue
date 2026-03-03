<template>
  <Debug v-model="calibration" />
  <div class="monitor-frame">
    <div class="chat-container">

      <div v-if="crtEnabled" class="crt-overlay"></div>

      <div class="flex flex-col h100">
        <header>
          <span>CHAT_LOG v0.2.1 - @</span>
          <input v-model="room" class="terminal-input input f-grow-1" placeholder="ROOM" :disabled="!uiEnabled" />
          <span>{{ time }}</span>
          <button @click="crtEnabled = !crtEnabled" class="btn" :title="crtEnabled ? 'Disable CRT' : 'Enable CRT'"
            style="text-wrap: nowrap; width: 90px;">
            [CRT:{{ crtEnabled ? 'ON' : 'OFF' }}]
          </button>
        </header>

        <main class="message-feed" ref="feed">
          <div v-for="(msg, i) in messages.toReversed()" :key="i">
            <Message :msg="msg" />
          </div>
        </main>

        <footer>
          <ChatForm v-if="view === 'chat'" @send-message="sendMessage" @view="(newView) => view = newView"
            :username="user.username" :room="room" :uiEnabled="uiEnabled && user.username" />
          <AuthForm v-else v-model="user" @view="(newView) => view = newView" />
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from "vue";
import { getTime } from "./assets/utils.js"
import Message from "./components/Message.vue";
import ChatForm from "./components/ChatForm.vue";
import AuthForm from "./components/AuthForm.vue";
import Debug from "./components/Debug.vue";

const messages = ref([]);
const user = ref({
  username: "tester",
  passwordHash: ""
});
const room = ref("root");
const time = ref(getTime(new Date()));

const feed = ref(null);
const view = ref("chat");  // should be just "chat" or "auth"
const crtEnabled = ref(true);
const uiEnabled = ref(false);
const calibration = ref({
  screenWidth: 807,
  screenHeight: 618,
  rotateY: -1.5,
  skewY: 1,
  top: -372,
  left: -209,
  radiusWidth: 150,
  radiusHeight: 200
});

const cssWidth = computed(() => `${calibration.value.screenWidth}px`);
const cssHeight = computed(() => `${calibration.value.screenHeight}px`);
const cssRotate = computed(() => `${calibration.value.rotateY}deg`);
const cssSkew = computed(() => `${calibration.value.skewY}deg`);
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

//TODO: the auth bit below
const sendAuth = (type) => {
    systemMessage(`ENCRYPTING ${newUser.username}...`);
    
    // Send to your Node backend via the open socket
    socket.send(JSON.stringify({
        type: type, // 'login' or 'register'
        data: newUser.value
    }));
};

// Listen for response (Basic example)
socket.onmessage = (e) => {
   const res = JSON.parse(e.data);
   if (res.type === 'auth_response' && res.data.success) {
       user.value = { alias: res.data.alias, authenticated: true };
       $emit('view', 'chat');
   }
}

async function connect() {
  systemMessage("Attempting to connect to " + socketUrl, true)
  socket = new WebSocket(socketUrl);
  socketStatus.value = "reconnecting";

  socket.onopen = () => {
    console.log("Connected to Chat Server");
    socketStatus.value = "connected";

    introMessages();

    reconnectDelay = 1000; // Reset delay on successful connection
  };

  socket.onmessage = async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "messages") {
      if (!msg.data || msg.data.length == 0) systemMessage("NO CHAT HISTORY IN " + room.value);
      else messages.value = msg.data;

      await scrollToBottom();
    }
  };

  socket.onclose = (e) => {
    console.log(`Socket closed. Reconnecting in ${reconnectDelay / 1000}s...`, e.reason);
    systemMessage(`Socket closed. Reconnecting in ${reconnectDelay / 1000}s...`, true);
    socketStatus.value = "disconnected";

    setTimeout(async () => {
      reconnectDelay *= 2;
      if (reconnectDelay <= 30000)
        await connect();
    }, reconnectDelay);
  };

  socket.onerror = (err) => {
    console.error("Socket encountered error: ", err);
  };
};

async function scrollToBottom() {
  await nextTick();
  if (feed.value) feed.value.scrollTop = feed.value.scrollHeight;
};

function setRoom(newRoom) {
  clearTimeout(debounceTimeout);

  newRoom = newRoom.trim().toLowerCase();

  if (newRoom) {
    systemMessage(`CONNECTING TO ROOM: ${newRoom}...`);

    debounceTimeout = setTimeout(() => {

      let roomMsg = JSON.stringify({
        type: "room",
        data: newRoom.trim().toLowerCase()
      });
      socket.send(roomMsg);
    }, 500);
  }
  else {
    systemMessage(`NO ROOM SET`);
  }
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

function systemMessage(msg, keep) {
  messages.value.reverse();
  if (!keep) messages.value = [];
  if (typeof msg == "string")
    messages.value.push({
      user: "SYSTEM",
      timestamp: new Date(),
      text: msg
    });
  else if (Array.isArray(msg)) {
    for (let m of msg) {
      messages.value.push({
        user: "SYSTEM",
        timestamp: new Date(),
        text: m
      });
    };
  }
  messages.value.reverse();
}

function introMessages() {
  systemMessage(`WELCOME TO THE CHAT_LOG`, true);
  setTimeout(() => {
    systemMessage(`MY NAME IS PETER BELLABY`, true);
    setTimeout(() => {
      systemMessage(`THIS IS A DEMO OF A SIMPLE VUE APP AND NODE WEBSOCKET SERVER`, true);
      setTimeout(() => {
        systemMessage(`CONNECTING TO ROOM: ${room.value}...`, true);
        setTimeout(() => {
          uiEnabled.value = true;
          let roomMsg = JSON.stringify({
            type: "room",
            data: room.value
          });
          socket.send(roomMsg);
        }, 1333)
      }, 5000);
    }, 2500);
  }, 666);
}
</script>

<style>
@import "@/assets/site.css";

.monitor-frame {
  width: 100vw;
  height: 100vh;
  background-image: url('@/assets/terminal_upscale.jpg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 2000px;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0px;
  left: 0px;
}

.chat-container {
  position: relative;
  background: #051a00;
  color: #33ff33;

  text-shadow: 0 0 1rem rgba(51, 255, 51, 0.8);

  width: 800px;
  height: 600px;
  padding: 2rem 4rem;

  /* --- REFINED VINTAGE EFFECTS --- */
  border-radius: v-bind(cssRadiusWidth) / v-bind(cssRadiusHeight);
  box-shadow:
    inset 20px 0 40px rgba(0, 0, 0, 0.9),
    /* Deeper shadow on the far edge */
    inset -10px 0 20px rgba(0, 0, 0, 0.6),
    0 0 15px rgba(51, 255, 51, 0.05);
  /* Subtle outer glow on the plastic */

  /* Fix for blurry text often caused by 3D transforms */
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;

  /* Using v-bind to link Javascript to CSS */
  width: v-bind(cssWidth);
  height: v-bind(cssHeight);

  /* Apply the 3D mapping */
  transform: perspective(1000px) rotateY(v-bind(cssRotate)) skewY(v-bind(cssSkew));

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
</style>
