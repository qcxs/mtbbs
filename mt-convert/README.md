# MT Convert 转换器

> 本项目是 [mtbbs](https://github.com/qcxs/mtbbs)（MT 论坛）源码中的一个子模块，提供 Markdown / BBCode / HTML 互转功能。

一个基于 Vue 3 + TypeScript + Element Plus 开发的论坛文本格式转换工具，专为 MT 论坛优化。

## 在线体验

[https://qcxs.github.io/mtbbs/mt-convert/](https://qcxs.github.io/mtbbs/mt-convert/)

## 功能特性

### Markdown → BBCode
- 支持完整 Markdown 语法转换：标题、粗体、斜体、删除线、高亮、列表、表格、代码块、引用、链接、图片等
- 支持任务列表，自动转换已完成 `[✓]` / 未完成 `[✗]` 符号
- 自动识别 Email 链接，转换为 `[email]` BBCode 标签
- 自动识别 Front Matter（`---` 包裹的元数据），转换为 `[free]` 标签
- 支持嵌套引用展平处理
- 支持嵌套列表缩进解析
- 支持自动编号（可选）：在标题前添加 `1.1.1` 格式层级编号
- 支持去除 Emoji（可选）
- 实时转换，输入即得结果
- BBCode 和 HTML 双预览切换
- 支持复制转换结果

### BBCode → HTML
- 支持 MT 论坛 BBCode 语法解析
- 实时预览 HTML 渲染效果（Shadow DOM 隔离样式）
- 支持复制原始 BBCode
- 包含表情解析和论坛样式渲染

### 通用功能
- 文件上传与拖放支持，自动识别文本内容
- 内容长度限制（20000 字符），超出自动提示
- 输入内容自动缓存，切换页面不丢失
- 响应式布局，窗口宽度 < 650px 自动切换为上下单列显示
- 清空输入、刷新预览等便捷操作

## 技术栈

- **Vue 3** + **TypeScript** - 前端框架
- **Vue Router 4** - 路由管理（Hash 模式）
- **Vite 5** - 构建工具
- **Element Plus** - UI 组件库
- **marked** - Markdown 解析库

## 项目结构

```
mt-convert/
├── public/
│   └── static/css/          # 论坛样式文件
├── src/
│   ├── components/
│   │   ├── SettingsDialog.vue        # 互转设置（模板自定义）
│   │   └── OutputSettingsDialog.vue  # 输出设置（Emoji/自动编号）
│   ├── utils/
│   │   ├── converters/
│   │   │   ├── MarkdownToBbcodeConverter.ts  # Markdown → BBCode 转换器
│   │   │   ├── BbcodeToHtmlConverter.ts      # BBCode → HTML 转换器
│   │   │   └── index.ts
│   │   ├── converterSettings.ts  # 转换设置类型、默认值、存储
│   │   ├── settingsState.ts      # 弹窗注册状态
│   │   ├── useInputCache.ts      # 输入内容缓存
│   │   └── credits.ts            # 鸣谢名单配置
│   ├── views/
│   │   ├── MdToBbcode.vue        # Markdown → BBCode 页面
│   │   └── BbcodeToHtml.vue      # BBCode → HTML 页面
│   ├── App.vue                   # 根组件（导航、设置菜单、鸣谢）
│   ├── main.ts
│   ├── router.ts
│   └── style.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── LESSONS.md
```

## 使用方法

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 部署到 GitHub Pages

本项目通过 GitHub Actions 自动构建并部署到 GitHub Pages。

### 前置条件

1. 在 GitHub 上创建仓库（如 `qcxs/mtbbs`），将本 `mt-convert/` 目录作为仓库的子目录
2. 在仓库 Settings → Pages 中，将 Source 设置为 **"Deploy from a branch"**，Branch 选择 `gh-pages`，目录选 `/ (root)`

### 自动部署机制

- **触发条件**：推送 `main` 分支且修改了 `mt-convert/**` 下的文件时自动触发
- **工作流位置**：[`.github/workflows/deploy-mt-convert.yml`](../.github/workflows/deploy-mt-convert.yml)
- **部署方式**：构建产物被部署到 `gh-pages` 分支的 `mt-convert/` 子目录下，`keep_files: true` 确保后续其他项目部署时不互相覆盖
- **手动触发**：可在 GitHub Actions 页面手动运行 `Build and Deploy mt-convert` 工作流
- **访问地址**：`https://qcxs.github.io/mtbbs/mt-convert/`

## 核心转换规则

### Markdown → BBCode

| Markdown | BBCode |
|----------|--------|
| `# 标题` | `[size=6][b]标题[/b][/size]` |
| `## 标题` | `[size=5][b]标题[/b][/size]` |
| `### 标题` | `[size=4][b]标题[/b][/size]` |
| `**粗体**` | `[b]粗体[/b]` |
| `*斜体*` | `[i]斜体[/i]` |
| `~~删除线~~` | `[s]删除线[/s]` |
| `==高亮==` | `[color=#000000][backcolor=#FFFF00]高亮[/backcolor][/color]` |
| `` `代码` `` | `[color=#333333][backcolor=#f4f4f4]代码[/backcolor][/color]` |
| `[链接](url)` | `[url=url]链接[/url]` |
| `![](url)` | `[img]url[/img]` |
| `> 引用` | `[quote]引用[/quote]` |
| `- 列表项` | `[list][*]列表项[/list]` |
| `1. 有序项` | `[list=1][*]有序项[/list]` |
| `- [x] 任务` | `[list][*][✓] 任务[/list]` |
| `- [ ] 任务` | `[list][*][✗] 任务[/list]` |
| `---` | `[hr]` |
| `mailto:email` | `[email]email[/email]` |
| Front Matter `---` | `[free]` |

> 以上为默认模板，所有转换模板均可在"互转设置"中自定义。

### BBCode → HTML

遵循 Discuz! 论坛标准，将 BBCode 转换为 HTML 预览。

支持的 BBCode 标签：

```
[b], [i], [u], [s], [color=], [size=], [backcolor=], [align=]
[quote], [code], [list], [list=1], [*], [url=], [img]
[table], [tr], [td], [hr], [email], [qq], [hide], [free]
[media], [attach], [attachimg]
```

## 设置

通过页面右上角的"设置"下拉菜单可访问：

### 互转设置
自定义各 Markdown 元素（标题、加粗、斜体、列表、表格等）的 BBCode 输出模板。使用 `${变量名}` 占位符灵活定制输出格式。

### 输出设置
- **去除 Emoji**：转换时自动删除 Emoji 符号
- **自动编号**：在标题前自动添加 `1.1.1` 格式层级编号（最多三级）

## 鸣谢

鸣谢名单配置在 `src/utils/credits.ts` 中，编辑该文件可添加或修改鸣谢项。目前鸣谢：

- [Obsidian BBCode Converter](https://github.com/salockhart/obsidian-bbcode) - Markdown 转 BBCode 转换架构参考

## 可配置项

- **鸣谢名单**：[credits.ts](src/utils/credits.ts) - 添加/修改鸣谢项
- **转换模板**：在页面"互转设置"中自定义，或修改 [converterSettings.ts](src/utils/converterSettings.ts) 中的 `DEFAULT_SETTINGS`
- **输入缓存**：[useInputCache.ts](src/utils/useInputCache.ts) - 可通过修改 `DEBOUNCE_DELAY` 调整缓存延迟

## 浏览器兼容性

支持所有现代浏览器（Chrome、Firefox、Safari、Edge）。如需兼容旧版浏览器，请自行配置 polyfill。

## 版权说明

- 作者：青春向上
- 论坛：[MT 论坛](https://bbs.binmt.cc/home.php?mod=space&uid=88062&do=profile)
- GitHub：[qcxs/mtbbs](https://github.com/qcxs/mtbbs)
