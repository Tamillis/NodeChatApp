<template>
    <span class="prompt">AUTH_REQUIRED:</span>
    <input v-model="model.username" placeholder="ALIAS" class="terminal-input input" />
    <input v-model="model.password" type="password" placeholder="PASS" class="terminal-input input" />
</template>

<script setup>
const model = defineModel();
</script>

<style lang="css" scoped>
.terminal-input {
  font-size: 1.1rem;
  flex-grow: 1;
}
</style>