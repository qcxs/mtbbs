import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import { markdownToBbcodeConverter, bbcodeToHtmlConverter } from './utils'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')

const win = window as Record<string, unknown>
win.mtConvert = {
  markdownToBbcode: (text: string) => markdownToBbcodeConverter.convert(text),
  bbcodeToHtml: (text: string) => bbcodeToHtmlConverter.convert(text)
}
