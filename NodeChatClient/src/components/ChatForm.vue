<template>
    <span class="prompt">{{ username }}@root:~$</span>
    <input 
    v-model="msg" 
    @keyup.enter="sendMessage"
    type="text" 
    placeholder="Send..."
    autofocus 
    class="terminal-input input"
    />
    <button @click="sendMessage" class="btn">Send</button>
</template>

<script setup>
import {ref} from 'vue';

const emit = defineEmits(['sendMessage'])

const msg = ref("");
const props = defineProps(["username"]);

function sendMessage() {
    emit('sendMessage', msg.value);
    msg.value = "";
}
</script>

<style lang="css" scoped>
.terminal-input {
  font-size: 1.1rem;
  flex-grow: 1;
}
</style>