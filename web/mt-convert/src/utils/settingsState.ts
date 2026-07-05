import { ref } from 'vue'

export const pageHasSettings = ref(false)
export const openPageSettings = ref<(() => void) | null>(null)
export const openPageOutputSettings = ref<(() => void) | null>(null)
