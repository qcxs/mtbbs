# mtbbs
自用mt论坛脚本

简要介绍：
ball.js（悬浮球）
1，用于快捷跳转至其他页面，例如：搜索、签到、精华、图床……
2，内置每30秒访问个人页面，提取消息数并显示在悬浮球上。用于读帖时发现新消息。
由于每个页面均会添加悬浮球，故将上一次访问个人页面时间与消息数存储在localStorage中，用于多悬浮球之间通信，避免重复访问。

copy.js
详见：https://bbs.binmt.cc/thread-154148-1-1.html
可以将html解析为ubb代码，但若帖子中存在“<”，会被误以为html标签造成文字丢失，不修复。

InsertLabel_2.0.js（插入标签）
详见：https://bbs.binmt.cc/thread-154052-1-1.html
提供快捷插入ubb代码标签、彩虹字、预览（ubb2html）、常用语等功能。

pc_uploadImg.js
详见：https://bbs.binmt.cc/thread-154474-1-1.html
为mt论坛pc端提供剪切板图片、拖拽图片上传，原网站只能选择文件上传。

qcxs_mtbbs.py
用于青龙面板挂机与签到，编辑代码“OSAP="qcxs_mtbbs"”，其中“qcxs_mtbbs”为环境变量名，新建此环境变量，格式：账号&密码。在青龙面板添加定时任务执行。如若想挂多个账号，修改其中环境变量名+文件名即可。在当前目录下创建cache文件夹，存储cookie、签到日期，防止重复登录/签到。