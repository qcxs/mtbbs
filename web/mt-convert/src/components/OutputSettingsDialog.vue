<template>
  <el-dialog
    title="输出设置"
    v-model="visible"
    width="500px"
    class="output-settings-dialog-el"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="output-body">
      <div class="setting-item">
        <div class="setting-header">
          <span class="setting-label">去除 Emoji</span>
          <span class="setting-desc">转换时自动删除 Emoji 符号</span>
        </div>
        <el-switch
          :model-value="localSettings.removeEmoji"
          @update:model-value="(val: boolean) => { localSettings.removeEmoji = val; markModified() }"
          active-text="开启"
          inactive-text="关闭"
        />
        <span class="emoji-preview">😀🚀🎉❤️</span>
      </div>

      <el-divider />

      <div class="setting-item">
        <div class="setting-header">
          <span class="setting-label">自动编号</span>
          <span class="setting-desc">在标题前自动添加 1.1.1 编号</span>
        </div>
        <el-switch
          :model-value="localSettings.autoNumbering"
          @update:model-value="(val: boolean) => { localSettings.autoNumbering = val; markModified() }"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
    </div>
    <template #footer>
      <div class="output-footer">
        <el-button @click="resetAll">恢复默认</el-button>
        <el-button type="primary" @click="saveAndClose">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { type ConverterSettings, DEFAULT_SETTINGS, loadSettings, saveSettings, resetSettings } from '@/utils/converterSettings'

const visible = ref(false)
const localSettings = reactive<Pick<ConverterSettings, 'removeEmoji' | 'autoNumbering'>>({
  removeEmoji: DEFAULT_SETTINGS.removeEmoji,
  autoNumbering: DEFAULT_SETTINGS.autoNumbering
})

const open = () => {
  const saved = loadSettings()
  localSettings.removeEmoji = saved.removeEmoji
  localSettings.autoNumbering = saved.autoNumbering
  visible.value = true
}

const markModified = () => {
  /* reactive handles it */
}

const resetAll = () => {
  const defaults = resetSettings()
  localSettings.removeEmoji = defaults.removeEmoji
  localSettings.autoNumbering = defaults.autoNumbering
  ElMessage.success('已恢复默认设置')
}

const saveAndClose = () => {
  const full = loadSettings()
  full.removeEmoji = localSettings.removeEmoji
  full.autoNumbering = localSettings.autoNumbering
  saveSettings(full)
  visible.value = false
  ElMessage.success('设置已保存')
}

defineExpose({ open })
</script>

<style scoped>
.output-body {
  padding: 0 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.setting-desc {
  font-size: 12px;
  color: #e67e22;
}

.emoji-preview {
  margin-left: 8px;
  font-size: 20px;
  opacity: 0.5;
}

.output-footer {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 650px) {
  .output-settings-dialog-el {
    width: 95% !important;
    max-width: 95% !important;
  }
  .output-settings-dialog-el .el-dialog__body {
    padding: 16px 12px;
  }
}
</style>
