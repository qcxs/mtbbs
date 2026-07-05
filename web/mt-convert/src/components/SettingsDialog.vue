<template>
  <el-dialog
    title="互转设置"
    v-model="visible"
    width="700px"
    class="settings-dialog settings-dialog-el"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="settings-body">
      <p class="settings-hint">
        自定义各 Markdown 元素的 BBCode 输出模板。可使用 <code>${变量名}</code> 占位符，具体变量见各条目说明。
      </p>
      <el-divider />
      <div
        v-for="item in templateItems"
        :key="item.key"
        class="setting-item"
      >
        <div class="setting-header">
          <div class="setting-header-left">
            <span class="setting-label">{{ item.label }}</span>
            <span class="setting-vars">可用变量: <code>{{ item.variables }}</code></span>
            <span v-if="item.desc" class="setting-desc">{{ item.desc }}</span>
          </div>
          <el-button
            v-if="isModified(item.key)"
            text
            size="small"
            class="item-reset-btn"
            @click="resetItem(item.key)"
          >
            重置
          </el-button>
        </div>
        <el-input
          :model-value="localSettings[item.key] as string"
          @update:model-value="(val: string) => updateSetting(item.key, val)"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 5 }"
          placeholder="输入模板"
          class="setting-input"
        />
      </div>
    </div>
    <template #footer>
      <div class="settings-footer">
        <el-button @click="resetAll">恢复默认</el-button>
        <el-button type="primary" @click="saveAndClose">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  type ConverterSettings,
  DEFAULT_SETTINGS,
  SETTING_META,
  loadSettings,
  saveSettings,
  resetSettings
} from '@/utils/converterSettings'

const visible = ref(false)
const allMeta = SETTING_META

const templateItems = computed(() => allMeta)

const localSettings = reactive<ConverterSettings>({ ...DEFAULT_SETTINGS })

const trimTemplate = (val: string | boolean): string | boolean => {
  return typeof val === 'string' ? val.trim() : val
}

const open = () => {
  const saved = loadSettings()
  for (const key of Object.keys(saved)) {
    ;(saved as any)[key] = trimTemplate((saved as any)[key])
  }
  Object.assign(localSettings, saved)
  visible.value = true
}

const updateSetting = (key: keyof ConverterSettings, value: string | boolean) => {
  ;(localSettings as any)[key] = value
}

const isModified = (key: keyof ConverterSettings): boolean => {
  const current = (localSettings as any)[key]
  const defaultVal = (DEFAULT_SETTINGS as any)[key]
  if (typeof current === 'string' && typeof defaultVal === 'string') {
    return current.trim() !== defaultVal.trim()
  }
  return current !== defaultVal
}

const resetItem = (key: keyof ConverterSettings) => {
  ;(localSettings as any)[key] = trimTemplate((DEFAULT_SETTINGS as any)[key])
}

const resetAll = () => {
  const defaults = resetSettings()
  Object.assign(localSettings, defaults)
  ElMessage.success('已恢复默认设置')
}

const saveAndClose = () => {
  const toSave = { ...localSettings }
  for (const key of Object.keys(toSave)) {
    ;(toSave as any)[key] = trimTemplate((toSave as any)[key])
  }
  saveSettings(toSave as ConverterSettings)
  visible.value = false
  ElMessage.success('设置已保存')
}

defineExpose({ open })
</script>

<style scoped>
.settings-body {
  padding: 0 4px;
}

.settings-hint {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.settings-hint code {
  background: #f4f4f4;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #e74c3c;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.setting-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  min-width: 120px;
}

.setting-vars {
  font-size: 12px;
  color: #999;
}

.setting-vars code {
  background: #f4f4f4;
  padding: 1px 5px;
  border-radius: 2px;
  font-size: 11px;
  color: #4361ee;
}

.setting-desc {
  font-size: 12px;
  color: #e67e22;
}

.setting-input :deep(textarea) {
  font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
}

.item-reset-btn {
  font-size: 12px;
  color: #e74c3c;
  flex-shrink: 0;
}

.settings-footer {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 650px) {
  .settings-dialog-el {
    width: 95% !important;
    max-width: 95% !important;
  }
  .settings-dialog-el .el-dialog__body {
    padding: 16px 12px;
  }
}
</style>
