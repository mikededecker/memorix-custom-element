<script setup lang="ts" generic="T extends string | number">
const model = defineModel<T>({ required: true, });

defineEmits<{
  'submit': [value: T]
}>()
</script>

<template>
  <input v-model="model" type="text" @keyup.enter="$emit('submit', model)"/>
</template>