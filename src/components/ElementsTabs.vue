<script setup lang="ts" generic="T extends string">
interface Props {
  tabs: Record<T, string> //Key - value
}

const value = defineModel<T>({required: true,});
defineProps<Props>()
</script>

<template>
  <ul class="nav nav-tabs">
    <li v-for="(tab, index) in tabs" :key="index" class="nav-item">
      <button type="button" class="nav-link" :class="{active: index === value}" href="#" @click="value = index">
        {{ tab }}
      </button>
    </li>
  </ul>
  <div v-for="(_, index) in tabs" :key="index" class="tab-content">
    <template v-if="index === value">
      <slot :name="index" />
    </template>
  </div>
</template>

<style scoped>

</style>