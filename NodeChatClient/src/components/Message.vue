<template>
    <div>
          <span class="timestamp">[{{ termDate(msg.timestamp) }}]</span>
          <span class="user-alias">&lt;{{ msg.user }}&gt;:</span>
          <span class="message-text">{{ msg.text }}</span>
    </div>
</template>

<script setup>
const props = defineProps(["msg"]);
const termDate = str => new Date(str).toLocaleString("sv-SE", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
}).replace(" ", "_");
</script>

<style scoped>
.message-row {
  margin-bottom: 8px;
  line-height: 1.4;
}

.timestamp { color: #1a8a1a; margin-right: 10px; }
.user-alias { font-weight: bold; margin-right: 10px; }
</style>