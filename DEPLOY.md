# mtbbs - GitHub Pages 多项目部署指南

本仓库演示如何通过 **GitHub Actions + GitHub Pages** 在一个仓库中构建和部署多个独立的前端项目。

## 目录结构

```
/
├── .github/workflows/
│   ├── deploy-root-page.yml     # 根入口页面的部署（纯 HTML，无需构建）
│   ├── deploy-demo.yml          # demo 项目的自动构建部署
│   └── deploy-mt-convert.yml    # mt-convert 项目的自动构建部署
├── root-page/                   # 根入口页面（访问 / 时显示的导航页）
├── demo/                        # 占位项目（最小 Vite + TS 模板）
├── mt-convert/                  # MT Convert 转换器（Vue 3 + Element Plus）
└── DEPLOY.md                    # 本文件 - 部署指南
```

## 部署拓扑

```
GitHub 仓库: qcxs/mtbbs
    │
    ├── GitHub Pages: https://qcxs.github.io/mtbbs/
    │
    ├── /               ── root-page  ── 项目导航入口（纯 HTML，无需构建）
    │
    ├── /mt-convert/    ── mt-convert 项目  ── vite.config.ts base: "/mtbbs/mt-convert/"
    │
    ├── /demo/          ── demo 项目       ── vite.config.ts base: "/mtbbs/demo/"
    │
    └── /.../           ── 其他项目（如需扩展）
```

每个项目的构建产物被部署到 `gh-pages` 分支的对应子目录中，通过 `keep_files: true` 确保互不覆盖。

## 前提条件

1. 在 GitHub 上创建仓库（如 `qcxs/mtbbs`）
2. 在仓库 **Settings → Pages** 中，将 Source 设置为 **"Deploy from a branch"**，Branch 选择 `gh-pages`，目录选 **`/ (root)`**
3. 每个子项目必须是独立的 Vite（或其他构建工具）项目，拥有自己的 `package.json` 和 `vite.config.ts`

## 根入口页面

由于所有子项目都部署在子目录下，访问 `https://qcxs.github.io/mtbbs/` 根路径时，需要有一个 `index.html` 作为入口。

本项目使用 [root-page/](root-page/) 作为根入口页面：

- **位置**：`root-page/index.html`（纯静态 HTML，无需构建工具）
- **工作流**：[deploy-root-page.yml](.github/workflows/deploy-root-page.yml)
- **部署方式**：`destination_dir` 留空，直接部署到 `gh-pages` 分支根目录
- **内容**：列出所有子项目的卡片导航，点击跳转到各项目

> 如果你不需要根入口页面，也可以让根路径返回 404。但建议保留该页面作为项目导航。

## 添加新项目

以下是在本仓库中添加一个新项目的完整步骤。

### 1. 创建项目文件

在根目录下创建子项目目录，放入完整的项目源码：

```
my-project/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   └── main.ts
└── .gitignore
```

### 2. 设置 Vite base

在 `vite.config.ts` 中，将 `base` 设为 Pages 子路径：

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/mtbbs/my-project/',  // 关键：与部署路径一致
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

> **原理**：`base` 决定了构建产物（JS/CSS）的引用前缀，必须匹配最终的访问路径。

### 3. 创建 GitHub Actions 工作流

在 `.github/workflows/` 下创建工作流文件：

```yml
# .github/workflows/deploy-my-project.yml
name: Build and Deploy my-project

on:
  push:
    branches:
      - main
    paths:
      - 'my-project/**'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: "my-project-deploy"
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: my-project
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: my-project/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./my-project/dist
          destination_dir: my-project
          keep_files: true
```

### 4. 推送代码

将变更推送到 `main` 分支，GitHub Actions 会自动执行工作流，几分钟后即可通过 `https://qcxs.github.io/mtbbs/my-project/` 访问。

## 关键设计

### `peaceiris/actions-gh-pages` 参数说明

| 参数 | 值 | 说明 |
|------|----|------|
| `publish_dir` | `./my-project/dist` | 构建产物的本地路径 |
| `destination_dir` | `my-project` | 部署到 gh-pages 分支的子目录 |
| `keep_files` | `true` | 保留其他项目的已有文件，不覆盖 |

### 工作流文件命名与组织

- 所有工作流文件放在根目录的 `.github/workflows/` 下
- 每个项目一个独立的工作流文件
- 工作流通过 `paths` 过滤，只在自己的文件变更时触发
- 通过 `concurrency.group` 避免同一项目的重复构建

### 为什么选用 Hash 路由

如果项目使用 Vue Router，应使用 Hash 模式：

```ts
// router.ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  // ...
})
```

因为 History 模式需要服务端配置 URL 重写，而 GitHub Pages 是纯静态托管，无法支持。Hash 模式天然兼容任何部署路径。

## 故障排查

### 访问页面显示白屏

1. 检查构建产物的资源引用路径是否正确
2. 确认 `vite.config.ts` 中的 `base` 与部署路径匹配
3. 在浏览器开发者工具中查看网络请求，确认 JS/CSS 资源 404 的位置

### 工作流未触发

1. 确认触发文件位于正确的 `paths` 路径下
2. 确认推送到的是 `main` 分支
3. 在 GitHub Actions 页面手动运行工作流测试

### 部署后看不到新项目

1. 确认 GitHub Pages 设置中 Source 为 `gh-pages` 分支、目录为 `/ (root)`
2. 等待 1-2 分钟让 Pages 生效
3. 检查 `gh-pages` 分支是否存在、目录结构是否正确

## 相关文档

- [mt-convert 项目文档](mt-convert/README.md)
- [mt-convert 开发教训记录](mt-convert/LESSONS.md)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)
- [Vite 部署到 GitHub Pages](https://vitejs.dev/guide/static-deploy.html#github-pages)
