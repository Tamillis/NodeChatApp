<template>
  <div class="flex" v-if="authState == 'login'">
    <span class="prompt">AUTH_REQUIRED:</span>
    <input v-model="user.username" placeholder="ALIAS" class="input f-grow-1" />
    <input v-model="user.passwordHash" type="password" placeholder="PASS" class="input f-grow-1" />
    <button class="btn" @click="authState = 'reg'">[REG]</button>
    <button @click="$emit('view', 'chat')" class="btn">[CHAT]</button>
  </div>
  <div class="flex" v-if="authState == 'reg'">
      <span class="prompt">REGISTER_USER:</span>
    <input :value="newUser.username" placeholder="ALIAS" class="input f-grow-1" />
    <input :value="newUser.password" type="password" placeholder="PASS" class="input f-grow-1" />
    <button class="btn" @click="$emit('reg')">[REG]</button>
    <button class="btn" @click="authState = 'login'">[AUTH]</button>
    <button @click="$emit('view', 'chat')" class="btn">[CHAT]</button>
  </div>
  <div class="flex">
    <div v-if="statusMsg">{{ statusMsg }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const user = defineModel();
const newUser = ref({
  username: "",
  password: ""
})
const authState = ref("login");


</script>

<style lang="css" scoped>

</style>