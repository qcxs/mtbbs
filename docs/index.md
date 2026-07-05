# mtbbs — MT论坛 移动端适配脚本与工具

这里是 [qcxs/mtbbs](https://github.com/qcxs/mtbbs)，存储了**自用**适配 [MT 论坛](https://bbs.binmt.cc/) **移动端**的脚本、网站。

初始只是个人为 [Alook 浏览器](https://www.alookweb.com/) 编写一些脚本，存放在 123 盘中。经历了不断优化，有三种脚本成功入围 [编程开发 - MT论坛](https://bbs.binmt.cc/forum.php?mod=forumdisplay&fid=42&filter=digest&digest=1) 精华帖，现将脚本源码统一整理，存储在此仓库中，随缘更新。

PS：由于Alook佛系更新，转至[雨见浏览器](https://www.yjllq.com/)，支持插件，故新脚本不再是纯js，开始拥抱油猴API。


## 脚本使用方法

### 通过脚本猫安装（推荐）

[qcxs - 用户主页 \| ScriptCat](https://scriptcat.org/zh-CN/users/202514)

不一定将所有脚本都发布在脚本猫中，但最新脚本在此更新。

### 通过 GitHub 安装

**核心脚本总在更新，此处不再提供最新代码**

在仓库中找到以 `user.js` 结尾的文件，它就是脚本。

![在仓库中查找 user.js 文件](/images/index/image-20260705110456068.png)

点击 **Raw**，油猴自动识别。

![点击 Raw 按钮](/images/index/Pasted%20image%2020260104130844.png)

### 使用 CDN 加速

由于国内访问 GitHub 时好时坏，可以通过 jsDelivr 进行 CDN 加速。

[https://cdn.jsdelivr.net/gh/qcxs/mtbbs/](https://cdn.jsdelivr.net/gh/qcxs/mtbbs/)

![jsDelivr CDN](/images/index/image-20260705110815029.png)

不过由于缓存，需等待一段时间才能获取到最新版本。

### 从 URL 安装

脚本已重命名为 `user.js` 后缀，正常情况下，油猴会自动识别安装，也可自行输入 URL 安装。

![从 URL 安装](/images/index/Pasted%20image%2020260104131438.png)

## 网站

仓库开启了 GitHub Pages，可通过 [qcxs.github.io/mtbbs](https://qcxs.github.io/mtbbs) 访问。

### 工具

- [MT Convert 转换器 - Markdown/BBCode/HTML 互转](https://qcxs.github.io/mtbbs/mt-convert/)

## 脚本

| 脚本 | 说明 | 帖子 |
|------|------|--------|
| ["借鉴一下"](/scripts/copy) | 一键发出几乎和大佬一样的帖子 | [【论坛神器】一键发出几乎和大佬一样的帖子（copy.js）](https://bbs.binmt.cc/thread-154148-1-1.html) |
| [自动下一页](/scripts/autoNextPage) | 论坛阅读辅助工具 | [【论坛脚本】论坛阅读辅助工具-自动下一页](https://bbs.binmt.cc/thread-159149-1-1.html) |
| [消息提醒预览](/scripts/messagePreview) | 消息预览+回帖查看 | [【油猴脚本】消息预览+回帖查看](https://bbs.binmt.cc/thread-165883-1-1.html) |
| [移动端图片恢复](/scripts/restoreImages) | 恢复失效的图片 | [【MT论坛】移动端图片恢复功能](https://bbs.binmt.cc/thread-166955-1-1.html) |
| [发帖辅助工具](/scripts/InsertLabel) | 论坛自用发帖工具 | [【论坛脚本】论坛自用发帖工具js（InsertLabel_2.0.js）](https://bbs.binmt.cc/thread-154052-1-1.html) |
| [手机版小黑屋](/scripts/xhw) | 手机版小黑屋 | [手机版小黑屋纯js版分享](https://bbs.binmt.cc/thread-153883-1-1.html) |
| [标题增强](/scripts/titileTools) | 标题快捷跳转 | - |

## 核心库

[require/](https://github.com/qcxs/mtbbs/tree/main/require/) — BBCode/HTML 互转核心库，抽离出供油猴脚本 require 使用的公共代码。

## 其它

很有用，推荐阅读。

- [【研究报告】MT论坛bbcode与html互转思路及坑](https://bbs.binmt.cc/thread-166223-1-1.html)

更多内容，推荐去考古 [个人中心 - MT论坛](https://bbs.binmt.cc/home.php?mod=space&uid=88062&do=profile)。
