<template>
  <div id="app-root">
    <header class="app-header">
      <div class="header-inner">
        <div class="header-brand">MT Convert</div>
        <el-menu class="header-menu" mode="horizontal" :default-active="$route.name">
          <el-menu-item index="md-to-bbcode">
            <router-link to="/">Markdown → BBCode</router-link>
          </el-menu-item>
          <el-menu-item index="bbcode-to-html">
            <router-link to="/bbcode-to-html">BBCode → HTML</router-link>
          </el-menu-item>
        </el-menu>
        <el-dropdown
          v-if="$route.meta?.showSettings"
          ref="settingsDropdown"
          trigger="click"
          @command="onSettingsCommand"
        >
          <el-button text size="small" class="header-settings-btn">
            设置<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="templates">互转设置</el-dropdown-item>
              <el-dropdown-item command="output">输出设置</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <el-divider />
      <div class="footer-content">
        <p class="footer-text">
          作者：<a href="https://bbs.binmt.cc/home.php?mod=space&uid=88062&do=profile" target="_blank" class="footer-link">青春向上</a>
        </p>
        <p class="footer-sub">
          MT 论坛转换器 v1.0.0
          <span class="footer-sep">·</span>
          <a class="footer-link" href="javascript:void(0)" @click="creditsVisible = true">鸣谢</a>
        </p>
      </div>
    </footer>

    <el-dialog
      title="鸣谢"
      v-model="creditsVisible"
      width="500px"
      append-to-body
    >
      <div class="credits-list">
        <div v-for="item in credits" :key="item.name" class="credit-item">
          <div class="credit-name">
            <a :href="item.url" target="_blank" class="credit-link">{{ item.name }}</a>
          </div>
          <div class="credit-desc">{{ item.description }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { openPageSettings, openPageOutputSettings } from '@/utils/settingsState'
import { credits } from '@/utils/credits'

const creditsVisible = ref(false)

const onSettingsCommand = (command: string) => {
  if (command === 'templates') {
    openPageSettings.value?.()
  } else if (command === 'output') {
    openPageOutputSettings.value?.()
  }
}
</script>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-settings-btn {
  white-space: nowrap;
  flex-shrink: 0;
}

.footer-sep {
  margin: 0 6px;
  color: #ccc;
}

.credits-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.credit-item {
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.credit-name {
  margin-bottom: 4px;
}

.credit-link {
  font-size: 14px;
  font-weight: 600;
  color: #4361ee;
  text-decoration: none;
}

.credit-link:hover {
  text-decoration: underline;
}

.credit-desc {
  font-size: 13px;
  color: #666;
}
</style>
