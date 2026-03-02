<template>
    <div>
        <span class="timestamp">[{{ getTime(msg.timestamp) }}]</span>
        <span class="user-alias">&lt;{{ msg.user }}&gt;:</span>
        <span class="message-text">{{ msg.text }}</span>
    </div>
</template>

<script setup>
import { getTime } from ".././assets/utils.js"

const props = defineProps(["msg"]);

</script>

<style scoped>
.message-row {
    margin-bottom: 8px;
    line-height: 1.4;
}

.timestamp {
    color: #1a8a1a;
    margin-right: 10px;
}

.user-alias {
    font-weight: bold;
    margin-right: 10px;
}
</style>