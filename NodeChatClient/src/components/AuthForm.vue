<template>
  <div class="flex" v-if="authState == 'login'">
    <button @click="$emit('view', 'chat')" class="btn">[CHAT]</button>
    <span class="prompt">LOGIN_USER:</span>
    <input v-model="user.username" placeholder="ALIAS" class="input f-grow-1" />
    <input v-model="user.password" type="password" placeholder="PASS" class="input f-grow-1" />
    <button class="btn" @click="$emit('login')">[SUBMIT]</button>
    <button @click="authState = 'reg'" class="btn">[REG]</button>
  </div>
  <div class="flex" v-if="authState == 'reg'">
    <button @click="$emit('view', 'chat')" class="btn">[CHAT]</button>
    <span class="prompt">REGISTER_USER:</span>
    <input v-model="user.username" placeholder="ALIAS" class="input f-grow-1" />
    <input v-model="user.password" type="password" placeholder="PASS" class="input f-grow-1" />
    <button class="btn" @click="$emit('reg')">[CREATE]</button>
    <button @click="authState = 'login'" class="btn">[LOGIN]</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const user = defineModel();
const authState = ref("login");

const emits = defineEmits(["view", "login", "reg"])

</script>

<style lang="css" scoped></style>