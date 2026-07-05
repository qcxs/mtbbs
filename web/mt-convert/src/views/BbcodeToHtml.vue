<template>
  <div class="page-converter">
    <el-card class="converter-card" shadow="never">
      <div class="converter-grid">
        <div class="converter-panel">
          <div class="panel-label">
            <div class="panel-label-left">
              <span class="label-dot" style="background:#4361ee"></span>
              <span>BBCode</span>
            </div>
            <div class="panel-label-right">
              <el-button
                text
                size="small"
                @click="clearInput"
                class="copy-btn"
                style="color:#e74c3c"
              >
                清空
              </el-button>
              <el-button
                text
                size="small"
                @click="triggerFileInput"
                class="copy-btn"
              >
                上传
              </el-button>
              <input
                ref="fileInput"
                type="file"
                accept=".txt"
                style="display:none"
                @change="handleFileUpload"
              />
            </div>
          </div>
          <el-input
            v-model="bbcodeText"
            type="textarea"
            :rows="18"
            placeholder="在此输入 BBCode 文本..."
            @input="convert"
            :maxlength="20000"
            show-word-limit
            class="converter-input"
          />
        </div>

        <div class="converter-panel">
          <div class="panel-label">
            <div class="panel-label-left">
              <span class="label-dot" style="background:#4361ee"></span>
              <span>预览效果</span>
            </div>
            <div class="panel-label-right">
              <el-button
                text
                size="small"
                @click="convert"
                class="copy-btn"
              >
                刷新预览
              </el-button>
              <el-button
                text
                size="small"
                @click="copyBbcode"
                class="copy-btn"
              >
                复制
              </el-button>
            </div>
          </div>
          <div ref="previewRef" class="preview-wrapper"></div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { bbcodeToHtmlConverter } from '@/utils'
import { useInputCache } from '@/utils/useInputCache'

const bbcodeText = ref('')
const previewRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const cache = useInputCache()

const convert = () => {
  if (bbcodeText.value !== bbcodeText.value.trim()) {
    bbcodeText.value = bbcodeText.value.trim()
  }
  cache.save(bbcodeText.value)
  if (!previewRef.value) return
  
  if (!bbcodeText.value) {
    if (previewRef.value.shadowRoot) {
      const el = previewRef.value.shadowRoot.querySelector('#preview-content')
      if (el) {
        el.innerHTML = '<div style="color:#bbb;text-align:center;padding:80px 0;font-size:14px">预览效果将显示在这里...</div>'
      }
    } else {
      previewRef.value.innerHTML = '<div style="color:#bbb;text-align:center;padding:80px 0;font-size:14px">预览效果将显示在这里...</div>'
    }
    return
  }
  
  const html = bbcodeToHtmlConverter.convert(bbcodeText.value)
  renderShadowDOM(previewRef.value, html)
}

const renderShadowDOM = (container: HTMLElement, html: string) => {
  let shadowRoot = container.shadowRoot
  if (!shadowRoot) {
    shadowRoot = container.attachShadow({ mode: 'open' })
    
    shadowRoot.innerHTML = `
      <style>
        .comiis_postli img[smilieid] {
          max-height: 22px;
          margin: 1px 1px 0;
          vertical-align: top;
        }
      </style>
      <link rel="stylesheet" href="static/css/comiis.css" type="text/css" media="all">
      <link rel="stylesheet" href="static/css/comiis_1_style.css" id="comiis_app_addclass">
      
      <div class="comiis_postli comiis_list_readimgs nfqsqi" data-ishandlingviewimg="true">
          <div class="comiis_messages comiis_aimg_show cl">
              <div class="comiis_a comiis_message_table cl" id="preview-content"></div>
          </div>
      </div>
    `
  }
  
  const el = shadowRoot.querySelector('#preview-content')
  if (el) el.innerHTML = html
}

const copyBbcode = async () => {
  if (!bbcodeText.value) return
  try {
    await navigator.clipboard.writeText(bbcodeText.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    handleFileContent(content)
  }
  reader.readAsText(file, 'utf-8')
  
  target.value = ''
}

const clearInput = () => {
  bbcodeText.value = ''
  cache.clear()
  convert()
}

const handleFileContent = (content: string) => {
  const trimmed = content.trim()
  if (trimmed.length > 20000) {
    ElMessage.error('文件内容超过20000字符限制，请上传更小的文件')
    return
  }
  bbcodeText.value = trimmed
  cache.flush(trimmed)
  convert()
}

const handleGlobalFileDrop = (event: Event) => {
  const content = (event as CustomEvent).detail?.content
  if (content) {
    handleFileContent(content)
  }
}

onMounted(() => {
  window.addEventListener('file-dropped', handleGlobalFileDrop)
  const cached = cache.load()
  if (cached) {
    bbcodeText.value = cached
    convert()
  }
})

onUnmounted(() => {
  window.removeEventListener('file-dropped', handleGlobalFileDrop)
})
</script>

<style scoped>
</style>
