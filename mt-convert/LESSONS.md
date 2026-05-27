# 项目教训记录

> 本文件记录项目开发过程中犯过的错误，每次新任务前阅读，避免重复踩坑。
>
> 本项目是 [mtbbs](https://github.com/qcxs/mtbbs)（MT 论坛）源码中的一个子模块 `mt-convert`。

## 1. Vue Router base 与 Vite base 必须匹配

- `vite.config.ts` 设置了 `base: '/mtbbs/mt-convert/'`（该工具在此路径下部署）
- `router.ts` 使用 `createWebHashHistory()`（Hash 模式），与任何 base 路径兼容
- 不一致会导致页面只有 header、没有路由内容

## 2. 拖拽上传是全局功能，不要只写在一个组件中

- 拖拽监听器挂在 `index.html` 的全局 `document` 上
- 通过 `window.dispatchEvent(new CustomEvent('file-dropped', ...))` 分发
- 每个需要接收的页面必须用 `window.addEventListener('file-dropped', handler)` 监听
- 重写页面后记得重新加上监听，否则拖拽功能会丢失

## 3. 原项目样式要复制过来，不要只靠 Element Plus 默认样式

- 原项目的 `comiis.css` 和 `comiis_1_style.css` 需要放到 `public/static/css/` 目录
- Shadow DOM 的 div 嵌套结构和 id 属性必须与原项目一致
- 预览渲染用 Shadow DOM 隔离样式，不受全局 CSS 影响

## 4. Markdown 转 BBCode 不要产生 HTML 标签

- `marked` 配置中 `breaks` 必须设为 `false`（设为 `true` 会产生 `<br>` 标签）
- BBCode 不支持 HTML 标签，`<br>` 等会被转义成文字显示
- 换行直接用 `\n` 处理即可

## 5. URL/BBCode 正则解析用两步法

- 不要试图一步完成 URL 匹配和替换
- 先用 `match()` 或 `matchAll()` 找出所有匹配项
- 再对每个匹配逐个处理并 `replace`
- 避免因 HTML 转义导致的正则匹配失败（尤其是表格内嵌套链接）

## 6. Vue template 不要有重复的 class 属性

```vue
<!-- 错误 -->
<el-dialog class="settings-dialog-el" ... class="settings-dialog">
<!-- 正确 -->
<el-dialog class="settings-dialog settings-dialog-el" ...>
```

## 7. 浏览器 evaluate_script 用纯 JavaScript，不要用 TypeScript

- Chrome MCP 的 `evaluate_script` 执行环境是浏览器，不支持 TS
- 不要用 `as` 类型断言、`const btn: HTMLElement` 等 TS 语法
- 用 `Array.from()` 或 `for` 循环代替 `forEach` + `as`

## 8. Emoji 正则要包含变体选择器

```typescript
// 错误：会残留 ️ (U+FE0F)
/\p{Extended_Pictographic}/gu
// 正确：包含变体选择器和零宽连字
/[\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{200D}]/gu
```

## 9. 弹窗必须限制最大宽度，防止水平溢出

```css
/* 全局规则，任何宽度下弹窗不超过视口 */
.el-dialog {
    max-width: calc(100vw - 32px) !important;
}
```
- 不要只依赖 media query 在某个断点限制宽度
- 650-700px 之间的视口会暴露问题

## 10. 循环处理列表时要正确推进索引

- `processTaskLists` 中处理完一个 `[*]` 项后必须 `taskListIndex++`
- 否则后续项会在同一行重复处理，导致其他项被跳过

## 11. 设置弹窗的模板要去除首尾空白

- 默认模板末尾的 `\n\n`（BBCode 格式需要）不应显示在 textarea 中
- 在 `open()` 加载和 `saveAndClose()` 保存时都要 `.trim()`
- `isModified()` 比较时也要 `.trim()` 后比较，避免因格式差异误判

## 13. append-to-body 弹窗的样式必须写在全局 CSS 中

- 使用 `append-to-body` 的弹窗渲染在 Vue 根组件之外
- scoped CSS 的 data-v-xxx 属性选择器无法匹配到这些元素
- 弹窗的布局样式（max-height、flex、overflow）必须写在 `style.css` 全局样式文件中
- 弹窗高度应限制在可视区内：`max-height: calc(100vh - 48px)` + `margin-top/bottom: 24px`
- 弹窗用 `display: flex; flex-direction: column` 让 header/body/footer 垂直排列
- body 区域用 `flex: 1; overflow: hidden` 占满剩余高度，并裁剪溢出
- 内部滚动容器用 `height: 100%; overflow-y: auto`（不要用 `max-height: 100%`，flex 子元素无固定高度，百分比不生效）

## 12. localStorage 读取出错一律清空

- 不要维护版本号，版本号会过时
- `JSON.parse` 失败或数据结构不兼容 → 直接 `removeItem` 清空 → 返回默认值
- 所有 localStorage 操作都要包 `try/catch`

## 通用原则

- **读文件后再修改**：编辑前先 Read 目标文件，了解当前状态
- **改后校验**：GetDiagnostics 检查类型错误，Chrome 检查运行时效果
- **一个功能多文件联动**：前端/路由/配置/样式同步修改，不要漏
- **用户明确说了不改的就不改**：如 "BBCode2html 不能修改"、"quote 不支持嵌套"

## 14. GitHub Pages 多项目部署用 peaceiris/actions-gh-pages

- 本项目（`mt-convert`）是 `qcxs/mtbbs` 仓库的一个子目录，未来可能有其他子项目
- 使用 `peaceiris/actions-gh-pages` 配合 `destination_dir` 将构建产物部署到子目录
- `keep_files: true` 确保其他项目的部署不被覆盖
- 工作流文件必须放在 **仓库根目录** 的 `.github/workflows/` 下，不能放在子项目中
- GitHub Pages 设置：Source = "Deploy from a branch", Branch = `gh-pages`, folder = `/ (root)`

## 15. Vite base 必须匹配 GitHub Pages 子目录路径

- 部署到 `https://qcxs.github.io/mtbbs/mt-convert/` 时，Vite `base` 必须设为 `/mtbbs/mt-convert/`
- Shadow DOM 中引用的 CSS 文件使用相对路径（如 `static/css/comiis.css`），不需要加 `/mtbbs/mt-convert/` 前缀，因为相对路径相对于页面 URL 自动解析
