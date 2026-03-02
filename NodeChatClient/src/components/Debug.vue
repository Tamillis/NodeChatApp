<template>
    <div class="calibration-panel" v-if="false">
        <label>Width: {{ model.screenWidth }}
            <input type="range" v-model="model.screenWidth" min="400" max="1200">
        </label>
        <label>Height: {{ model.screenHeight }}
            <input type="range" v-model="model.screenHeight" min="300" max="900">
        </label>
        <label>Rotate Y: {{ model.rotateY }}
            <input type="range" v-model="model.rotateY" min="-45" max="45" step="0.5">
        </label>
        <label>Skew Y: {{ model.skewY }}
            <input type="range" v-model="model.skewY" min="-10" max="10" step="0.1">
        </label>
        <label>Perspective: {{ model.prespective }}
            <input type="range" v-model="model.prespective" min="500" max="2000" step="1">
        </label>
        <label>Margin Left: {{ model.left }}
            <input type="range" v-model="model.left" min="-500" max="500" step="1">
        </label>
        <label>Margin Top: {{ model.top }}
            <input type="range" v-model="model.top" min="-500" max="500" step="1">
        </label>
        <label>Radius Width: {{ model.radiusWidth }}
            <input type="range" v-model="model.radiusWidth" min="0" max="150" step="1">
        </label>
        <label>Radius Height: {{ model.radiusHeight }}
            <input type="range" v-model="model.radiusHeight" min="0" max="150" step="1">
        </label>
    </div>
</template>

<style scoped>
.calibration-panel {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 100;
    background: rgb(0, 0, 0);
    color: white;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 12px;
    border: 1px solid #33ff33;
}

label, input {
    text-align: center;
    width: 150px;
}
</style>

<script setup>
const model = defineModel();
</script>