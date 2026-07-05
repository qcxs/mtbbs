<template>
  <div class="page-converter">
    <el-card class="converter-card" shadow="never">
      <div class="converter-grid">
        <div class="converter-panel">
          <div class="panel-label">
            <div class="panel-label-left">
              <span class="label-dot" style="background:#4361ee"></span>
              <span>Markdown</span>
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
                accept=".md,.txt"
                style="display:none"
                @change="handleFileUpload"
              />
            </div>
          </div>
          <el-input
            v-model="mdText"
            type="textarea"
            :rows="TEXTAREA_ROWS"
            placeholder="在此输入 Markdown 文本..."
            @input="handleInput"
            :maxlength="MAX_INPUT_LENGTH"
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
                @click="refreshPreview"
                title="刷新预览"
                class="copy-btn"
              >
                刷新预览
              </el-button>
              <el-button
                text
                size="small"
                @click="showBbcodeDialog"
                class="copy-btn"
              >
                复制BBCode
              </el-button>
            </div>
          </div>
          <div ref="previewContainer" class="preview-wrapper"></div>
        </div>
      </div>
    </el-card>

    <el-dialog
      title="BBCode 代码"
      v-model="dialogVisible"
      width="80%"
      append-to-body
    >
      <el-input
        v-model="bbcodeText"
        type="textarea"
        :rows="DIALOG_TEXTAREA_ROWS"
        readonly
        class="bbcode-dialog-input"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="copyBbcodeFromDialog">复制</el-button>
        </div>
      </template>
    </el-dialog>

    <SettingsDialog ref="settingsDialogRef" @closed="onSettingsClosed" />
    <OutputSettingsDialog ref="outputSettingsDialogRef" @closed="onSettingsClosed" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { markdownToBbcodeConverter } from '@/utils'
import { bbcodeToHtmlConverter } from '@/utils'
import { useInputCache } from '@/utils/useInputCache'
import { loadSettings } from '@/utils/converterSettings'
import { MAX_INPUT_LENGTH, TEXTAREA_ROWS, DIALOG_TEXTAREA_ROWS, CONVERT_DEBOUNCE_MS } from '@/utils/constants'
import { pageHasSettings, openPageSettings, openPageOutputSettings } from '@/utils/settingsState'
import SettingsDialog from '@/components/SettingsDialog.vue'
import OutputSettingsDialog from '@/components/OutputSettingsDialog.vue'

const mdText = ref('')
const bbcodeText = ref('')
const previewContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dialogVisible = ref(false)
const settingsDialogRef = ref<InstanceType<typeof SettingsDialog> | null>(null)
const outputSettingsDialogRef = ref<InstanceType<typeof OutputSettingsDialog> | null>(null)
const cache = useInputCache()
let convertTimeout: ReturnType<typeof setTimeout> | null = null

const handleInput = () => {
  cache.save(mdText.value)
  if (convertTimeout) {
    clearTimeout(convertTimeout)
  }
  convertTimeout = setTimeout(() => {
    bbcodeText.value = mdText.value ? markdownToBbcodeConverter.convert(mdText.value.trim()) : ''
    nextTick(() => {
      updatePreview()
    })
  }, CONVERT_DEBOUNCE_MS)
}

const updatePreview = () => {
  if (!previewContainer.value) return
  
  if (!bbcodeText.value) {
    if (previewContainer.value.shadowRoot) {
      const el = previewContainer.value.shadowRoot.querySelector('#preview-content')
      if (el) {
        el.innerHTML = '<div style="color:#bbb;text-align:center;padding:80px 0;font-size:14px">预览效果将显示在这里...</div>'
      }
    } else {
      previewContainer.value.innerHTML = '<div style="color:#bbb;text-align:center;padding:80px 0;font-size:14px">预览效果将显示在这里...</div>'
    }
    return
  }
  
  try {
    const html = bbcodeToHtmlConverter.convert(bbcodeText.value)
    renderShadowDOM(previewContainer.value, html)
  } catch (error) {
    console.error('预览渲染失败:', error)
    const el = previewContainer.value.shadowRoot?.querySelector('#preview-content')
    if (el) {
      el.innerHTML = '<div style="color:#f56c6c;text-align:center;padding:80px 0;font-size:14px">预览渲染失败，请检查输入内容</div>'
    } else {
      previewContainer.value.innerHTML = '<div style="color:#f56c6c;text-align:center;padding:80px 0;font-size:14px">预览渲染失败，请检查输入内容</div>'
    }
  }
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
    handleFileDrop(content)
  }
  reader.readAsText(file, 'utf-8')
  
  target.value = ''
}

const clearInput = () => {
  mdText.value = ''
  bbcodeText.value = ''
  cache.clear()
  if (convertTimeout) {
    clearTimeout(convertTimeout)
  }
  nextTick(() => {
    updatePreview()
  })
}

const handleFileDrop = (content: string) => {
  const trimmed = content.trim()
  if (trimmed.length > MAX_INPUT_LENGTH) {
    ElMessage.error(`文件内容超过${MAX_INPUT_LENGTH}字符限制，请上传更小的文件`)
    return
  }
  mdText.value = trimmed
  cache.flush(trimmed)
  handleInput()
}

const handleGlobalFileDrop = (event: Event) => {
  const content = (event as CustomEvent).detail?.content
  if (content) {
    handleFileDrop(content)
  }
}

const refreshPreview = () => {
  if (convertTimeout) {
    clearTimeout(convertTimeout)
  }
  bbcodeText.value = mdText.value ? markdownToBbcodeConverter.convert(mdText.value.trim()) : ''
  nextTick(() => {
    updatePreview()
  })
  ElMessage.success('预览已刷新')
}

const showBbcodeDialog = () => {
  if (!bbcodeText.value) {
    ElMessage.warning('没有可复制的BBCode内容')
    return
  }
  dialogVisible.value = true
}

const copyBbcodeFromDialog = async () => {
  if (!bbcodeText.value) return
  try {
    await navigator.clipboard.writeText(bbcodeText.value)
    ElMessage.success('已复制到剪贴板')
    dialogVisible.value = false
  } catch {
    ElMessage.error('复制失败')
  }
}

const onSettingsClosed = () => {
  const settings = loadSettings()
  markdownToBbcodeConverter.updateSettings(settings)
  if (mdText.value) {
    handleInput()
  }
}

onMounted(() => {
  window.addEventListener('file-dropped', handleGlobalFileDrop)
  pageHasSettings.value = true
  openPageSettings.value = () => {
    settingsDialogRef.value?.open()
  }
  openPageOutputSettings.value = () => {
    outputSettingsDialogRef.value?.open()
  }
  const cached = cache.load()
  if (cached) {
    mdText.value = cached
    handleInput()
  }
})

onUnmounted(() => {
  window.removeEventListener('file-dropped', handleGlobalFileDrop)
  pageHasSettings.value = false
  openPageSettings.value = null
  if (convertTimeout) {
    clearTimeout(convertTimeout)
  }
})
</script>

<style scoped>
.bbcode-dialog-input textarea {
  font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.dialog-footer {
  text-align: right;
}
</style>
