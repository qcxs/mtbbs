import { onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const CACHE_PREFIX = 'mt-convert-input-'
const DEBOUNCE_DELAY = 1000

export function useInputCache() {
  const route = useRoute()
  const cacheKey = CACHE_PREFIX + (route.name as string || 'default')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const save = (value: string) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(cacheKey, value)
      } catch {
        /* ignore */
      }
    }, DEBOUNCE_DELAY)
  }

  const flush = (value: string) => {
    if (saveTimer) clearTimeout(saveTimer)
    try {
      localStorage.setItem(cacheKey, value)
    } catch {
      /* ignore */
    }
  }

  const load = (): string => {
    try {
      return localStorage.getItem(cacheKey) || ''
    } catch {
      return ''
    }
  }

  const clear = () => {
    if (saveTimer) clearTimeout(saveTimer)
    try {
      localStorage.removeItem(cacheKey)
    } catch {
      /* ignore */
    }
  }

  onUnmounted(() => {
    if (saveTimer) clearTimeout(saveTimer)
  })

  return { save, flush, load, clear }
}
