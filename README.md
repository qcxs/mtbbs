# 引言

此仓库存储了**自用**适配[MT论坛](https://bbs.binmt.cc/)移动端的一些脚本。初始只是个人为[Alook浏览器](https://www.alookweb.com/)编写一些脚本，存放在123盘中。经历了不断优化，有三种脚本成功入围[编程开发 - MT论坛](https://bbs.binmt.cc/forum.php?mod=forumdisplay&fid=42&filter=digest&digest=1)精华帖，现将脚本统一整理，存储在此仓库中，随缘更新。

# 使用方法

## 通过脚本猫安装

[qcxs - 用户主页 | ScriptCat](https://scriptcat.org/zh-CN/users/202514)
不一定将所有脚本都发布在脚本猫中，但最新脚本在此更新

## 通过github安装

**核心脚本总在更新，此处不再提供最新代码，只提供大改动前的旧版本、稳定版。**
在其中寻找以user.js结尾的文件，它就是脚本
![attachments/Pasted image 20260104130930.png](attachments/Pasted%20image%2020260104130930.png)
点击raw，油猴自动识别
![attachments/Pasted image 20260104130844.png](attachments/Pasted%20image%2020260104130844.png)

### 使用cdn加速

由于国内访问github时好时坏，也可以通过jsDelivr进行cdn加速。
[qcxs/mtbbs CDN by jsDelivr](https://cdn.jsdelivr.net/gh/qcxs/mtbbs/)
![attachments/Pasted image 20260104131138.png](attachments/Pasted%20image%2020260104131138.png)
不过由于缓存，需等待一段时间才能获取到最新版本。~~（我也不勤更新，不影响）~~

## 从url安装

脚本已重命名为user.js后缀，正常情况下，油猴会自动识别安装，也可自行输入url安装。
![attachments/Pasted image 20260104131438.png](attachments/Pasted%20image%2020260104131438.png)

# 脚本

## 借鉴一下

### 功能一览

[借鉴一下](copy/%E5%80%9F%E9%89%B4%E4%B8%80%E4%B8%8B.md)

### 帖子

[【论坛神器】一键发出几乎和大佬一样的帖子（copy.js）](https://bbs.binmt.cc/thread-154148-1-1.html)

## 自动下一页

### 功能一览

[自动下一页](autoNextPage/%E8%87%AA%E5%8A%A8%E4%B8%8B%E4%B8%80%E9%A1%B5.md)

### 帖子

[【论坛脚本】论坛阅读辅助工具-自动下一页](https://bbs.binmt.cc/thread-159149-1-1.html)

## 消息预览

### 功能一览

[消息预览](messagePreview/%E6%B6%88%E6%81%AF%E9%A2%84%E8%A7%88.md)

### 帖子

[\[油猴脚本\]消息预览 - MT论坛](https://bbs.binmt.cc/thread-165883-1-1.html)

## 小黑屋

### 功能一览

[小黑屋](xhw/%E5%B0%8F%E9%BB%91%E5%B1%8B.md)

### 帖子

[手机版小黑屋纯js版分享](https://bbs.binmt.cc/thread-153883-1-1.html)

## 发帖辅助工具

### 功能一览

[发帖辅助工具](InsertLabel/%E5%8F%91%E5%B8%96%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7.md)

### 帖子

[【论坛脚本】论坛自用发帖工具js（InsertLabel_2.0.js）](https://bbs.binmt.cc/thread-154052-1-1.html)

## 其他

### 悬浮球

ball.js
已废弃，由[标题增强](titileTools/%E6%A0%87%E9%A2%98%E5%A2%9E%E5%BC%BA.md)代替。

* 由于论坛许多页面经常访问，故添加快捷链接跳转。
* 由于论坛不会自动刷新消息，每次查看消息还需刷新网页，如果此时正在阅读其余帖子，总有不便之处。故添加自动检测新消息，当有新消息时悬浮球显示角标。
* 但整体代码过乱且是个人喜好，未发帖子，在此只做备份，随时可能删除。

### 挂机脚本

qcxs_mtbbs.py

#### 核心功能

通过[青龙面板](https://qinglong.online/)实现论坛挂机（维持在线时长）与每日签到。

#### 配置步骤

1. 在青龙面板新建环境变量“mtluntan”，值格式为  账号1&密码1#账号2&密码2 。支持多账号，确保账号密码无&、#特殊字符，否则自行修改代码。
1. 在青龙面板添加脚本，设置定时任务

````
0 8,20,32,44,56 * * * ?
````

#### 注意事项

* 论坛每15分钟更新一次在线时间，脚本访问间隔需小于15分钟，才能维持“在线”。
* 0:00时段避免签到，该时段大量脚本签到会增加论坛服务器压力，并且可能被扣除金币，例如：[关于自动签到](https://bbs.binmt.cc/thread-113351-1-1.html)
* 脚本会在当前目录自动创建  cache  文件夹，用于存储Cookie和签到日期，防止重复登录或重复签到。
