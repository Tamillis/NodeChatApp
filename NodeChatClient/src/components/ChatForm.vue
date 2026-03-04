<template>
    <div class="flex">
        <span class="prompt">{{ username }}@{{ room }}:~$</span>
        <input 
        v-model="msg" 
        @keyup.enter="sendMessage"
        type="text"
        autofocus 
        placeholder="SEND"
        class="input f-grow-1"
        :disabled="!uiEnabled || !authenticated"
        />
        <button @click="sendMessage" class="btn" :disabled="!uiEnabled || !authenticated">[SEND]</button>
        <button @click="$emit('view', 'auth')" class="btn" title="Switch User" :disabled="!uiEnabled" v-if="!authenticated" >
            [AUTH]
        </button>
        <button @click="$emit('logout')" class="btn" title="Switch User" v-else >
            [LOGOUT]
        </button>
    </div>
</template>

<script setup>
import {ref} from 'vue';

const emit = defineEmits(['sendMessage', 'view', 'logout'])

const msg = ref("");
const props = defineProps(["username", "room", "uiEnabled", "authenticated"]);

function sendMessage() {
    emit('sendMessage', msg.value);
    msg.value = "";
}
</script>

<style lang="css" scoped>

</style>