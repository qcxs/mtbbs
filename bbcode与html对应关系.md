这个文件收录我整理的对应关系，为编写HTML2BBCode做出了重大贡献。

# 普通文字（没有被html标签包裹）

````
（按照上面的顺序依次展现）
````

# url（超链接）

使用示例

````
[url=https://blog.xiaow.qzz.io]超链接[/url]
````

html

````
<a href="https://blog.xiaow.qzz.io" target="_blank">超链接</a>
````

# 修改提示

为系统自动添加

````
<i class="pstatus"> 本帖最后由 用户名 于 2026-1-15 00:12 编辑 </i>
````

# i（斜体）

````
[i]内容[/i]
````

html

````
<i>内容</i>
````

# u（下划线）

````
[u]内容[/u]
````

html

````
<u>内容</u>
````

# email

使用示例

````
[email=123456789@qq.com]超链接但是电子邮箱专用[/email]
````

html

````
<a href="mailto:123456789@qq.com">超链接但是电子邮箱专用</a>
````

# hide（隐藏内容）

使用示例

````
[hide]111111[/hide]
````

## 还未回复

````html
<div class="comiis_quote bg_h f_c">青春向上，如果您要查看本帖隐藏内容请<a href="https://bbs.binmt.cc/forum.php?mod=post&amp;action=reply&amp;fid=41&amp;tid=161352" onclick="showWindow('reply', this.href)">回复</a></div>
````

解析为“此内容为隐藏内容，请回复后重新解析”

## 已回复后

````html
<div class="comiis_quote bg_h f_c"><h2 class="f_a">本帖隐藏的内容: </h2><font color="#9a968f"><font style="background-color:rgb(41, 70, 17)">内容</div>
````

其中内容可再次解析

# qq

使用示例

````
[qq]123456789[/qq]
````

html

````html
<a href="http://wpa.qq.com/msgrd?v=3&amp;uin=123456789&amp;site=[Discuz!]&amp;from=discuz&amp;menu=yes" target="_blank"><img src="static/image/common/qq_big.gif" border="0"></a>
````

# s（删除线）

````
[s]内容[/s]
````

html

````html
<strike>内容</strike>
````

# b（加粗）

使用示例

````
[b]内容[/b]
````

html

````html
<strong>内容</strong>
````

# background（背景色）

使用示例

````
[background=rgb(41, 70, 17)]内容[/background]
````

html

````html
<font style="background-color:rgb(41, 70, 17)">内容</font>
````

# color（颜色）

使用示例

````
[color=#9a968f]内容[/color]
````

html

````html
<font color="#9a968f">内容</font>
````

# align（对其方式）

使用示例

````
[align=left/center/right]左中右对齐[/align]
````

示例html

````html
<div align="center">内容</div>
````

# list

使用示例

````
[list]
[*]列表项1  
[*]列表项2  
[/list]
````

三种情况
无需列表\[list\]

````html
<ul><li>列表项1</li><li>列表项2</li><li>列表项3<br>
</li></ul>
````

有序列表\[list=1\]

````html
<ul type="1" class="litype_1"><li>第一步&nbsp;&nbsp;</li><li>第二步&nbsp;&nbsp;</li><li>第三步<br>
</li></ul>
````

有序列表\[list=a\]

````html
<ul type="a" class="litype_2"><li>选项A&nbsp;&nbsp;</li><li>选项B&nbsp;&nbsp;</li><li>选项C<br>
</li></ul>
````

# font（设置字体）

使用示例

````
[font=黑体]内容[/font]
````

html

````html
<font face="黑体">内容</font>
````

# size（字体大小）

使用示例

````
[size=3]内容[/size]
````

html

````html
<font size="3">内容</font>
````

# img(图床)

使用示例

````
[img=120,120]https://api.qrtool.cn/[/img]
````

其中宽高可省略
html

````html
<img width="120" height="120" src="https://api.qrtool.cn/" border="0" alt="">
````

# attachimg(图片附件)

使用示例

````
[attachimg]https://api.qrtool.cn/[/attachimg]
````

不能设置宽高
html

````html
<span onclick="window.location.href='forum.php?mod=viewthread&amp;tid=161415&amp;aid=349962&amp;from=album&amp;page=1'"><img id="aimg_349962" src="https://oss3-bbs.mt2.cn/forum/202601/12/143324v99zjuzy0rey0wby.png" alt="AI-MCP全自动分析工具[已更新SmaliBridgev1.2][1000103867.png]"></span>
````

# free(免费信息)

使用示例

````
[free]内容[/free]
````

html

````html
<div class="comiis_quote bg_h f_c"><blockquote>内容</blockquote></div>
````

命中class，并解析子元素

# quote

使用示例

````
[quote]内容[/quote]
````

html，除内容外，为固定写法

````html
<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font size="2">回复</font> 内容</blockquote></div>
````

子元素可再次解析

# code(代码块)

使用示例，内嵌代码不参与解析

````
[code][b]加粗文本[/b]
[i]斜体文本[/i]
[u]下划线文本[/u]
[color=red]红色文字，也可以将red替换为16进制表示任何颜色[/color]
[size=5]大号文字[/size]
[font=微软雅黑]雅黑字体[/font]
[s]中划线[/s]
[backcolor=green]字体背景色，与color标签一样[/backcolor][/code]
````

html

````html
<div class="comiis_blockcode comiis_bodybg b_ok f_b"><div class="bg_f b_l"><ol><li>[b]加粗文本[/b]<br>
</li><li>[i]斜体文本[/i]<br>
</li><li>[u]下划线文本[/u]<br>
</li><li>[color=red]红色文字，也可以将red替换为16进制表示任何颜色[/color]<br>
</li><li>[size=5]大号文字[/size]<br>
</li><li>[font=微软雅黑]雅黑字体[/font]<br>
</li><li>[s]中划线[/s]<br>
</li><li>[backcolor=green]字体背景色，与color标签一样[/backcolor]</li></ol></div></div>
````

只需判断出此标签，通过textContent获取内容。并且代码块中标签不被解析。

# attach(附件)

使用示例

````
[attach]123456[/attach]
````

解析时写死内容
html

````html
<div class="comiis_attach bg_e b_ok cl">
<a href="https://bbs.binmt.cc/forum.php?mod=attachment&amp;aid=MzQ5MjMxfGNlM2JmYjAzfDE3Njg1MzMyODR8ODgwNjJ8MTYxMTE5">
<p class="attach_tit">
<img src="https://cdn-bbs.mt2.cn/static/image/filetype/text.gif" border="0" class="vm" alt="">

<span class="f_ok">test.txt</span>

<em class="f_d">&nbsp;2026-1-2 21:07上传</em>
</p>		
<p class="attach_size f_c">
41 Bytes , 下载次数: 16, 下载积分: 金币 -1 
</p>
</a>
	
<div class="attach_txt bg_f b_ok">
<span class="f_c">测试专用 请勿下载</span>
</div>

</div>
````

# media（视频）

使用示例

````
[media=x,500,375]https://www.bilibili.com/video/BV1NL411M7Jr[/media]
````

media=x,500,375为固定写法
html

````html
<ignore_js_op><span id="flv_B34"><iframe src="https://player.bilibili.com/player.html?bvid=1NL411M7Jr" border="0" scrolling="no" framespacing="0" allowfullscreen="true" style="max-width: 100%" width="100%" height="auto" frameborder="no"></iframe></span><script type="text/javascript" reload="1">document.getElementById('flv_B34').innerHTML=("<iframe src='https://player.bilibili.com/player.html?bvid=1NL411M7Jr' border='0' scrolling='no' framespacing='0' allowfullscreen='true' style='max-width: 100%' width='100%' height='auto' frameborder='no'></iframe>");</script></ignore_js_op>
````

需要提取BV号，再拼接链接

# 表情

使用示例

````
[色]
````

html

````html
<img src="https://cdn-bbs.mt2.cn/static/image/smiley/qq/qq014.gif" smilieid="1229" border="0" alt="">
````

解析思路，当为img且以https://cdn-bbs.mt2.cn/static/image/smiley/开头时，遍历window.smilies_type，从中可以找到剩余两个参数

````js
 // 处理表情标签

        const smileyMap = new Map();

        Object.keys(smilies_type).forEach(typeKey => {

            const [, dir] = smilies_type[typeKey];

            const typeId = typeKey.replace('_', '');

            const arrays = smilies_array[typeId];

            if (arrays) {

                Object.keys(arrays).forEach(pageKey => {

                    arrays[pageKey].forEach(item => {

                        const [, tag, filename] = item;

                        const fullPath = `https://cdn-bbs.mt2.cn/static/image/smiley/${dir}/${filename}`;

                        smileyMap.set(fullPath, tag);

                    });

                });

            }

        });

        bbcode = bbcode.replace(

            /<img[^>]*src="([^"]+)"[^>]*>/gi,

            (match, src) => smileyMap.get(src) || match

        );
````

# @朋友

使用示例，后接空格

````
@用户名 
````

html

````html
<a href="https://bbs.binmt.cc/space-uid-88062.html" target="_blank">@青春向上</a>
````

对应bbocde，昵称后面有一个空格，上述href的a标签由系统自动生成，故只需写出@+昵称+空格

````
@青春向上 
````

# table、tr、td

组合使用，示例2x4，可内嵌其余标签

````
[table]
[tr][td] [/td][td] [/td][/tr]
[tr][td] [/td][td] [/td][/tr]
[/table][table]
[tr][td] [/td][td] [/td][/tr]
[tr][td] [/td][td] [/td][/tr]
[/table]
````

html示例

````html
<table><tbody><tr><td><font color="00BFFF"><strong><font size="5"><div align="center">系列教程<font size="2"><br>
（点击跳转）</font></div></font></strong></font></td></tr><tr><td><a href="https://bbs.binmt.cc/thread-123400-1-1.html" target="_blank"><font color="96a4ff"><strong><font size="3">【简单逆向】7723游戏实名弹窗通用去除</font></strong></font></a></td></tr><tr><td><a href="https://bbs.binmt.cc/thread-123719-1-1.html" target="_blank"><font color="96a4ff"><strong><font size="3">【简单逆向】虫虫助手游戏实名弹窗去除思路</font></strong></font></a><br>
</td></tr><tr><td><a href="https://bbs.binmt.cc/thread-129509-1-1.html" target="_blank"><font color="96a4ff"><strong><font size="3">【逆向实战】灵活运用教程思路去除弹窗</font></strong></font></a></td></tr><tr><td><a href="https://bbs.binmt.cc/thread-131561-1-1.html" target="_blank"><font color="96a4ff"><strong><font size="3"><font color="E4DA3E">(本帖)</font>【简单逆向】unity去除google广告思路</font></strong></font></a><br>
</td></tr><tr><td><a href="https://bbs.binmt.cc/thread-130108-1-1.html" target="_blank"><font color="grey"><strong><font size="3"><strike>【小白必看】第三方下载游戏精简思路</strike></font></strong></font></a><br>
<font color="grey"><strong><font size="2"><i>此帖因技术问题暂未完工，具体发布日期待定。</i></font></strong></font><br>
</td></tr></tbody></table>
````

对应bbocde

````
[table][tr][td][color=00BFFF][b][size=5][align=center]系列教程 （点击跳转）[/color][/align][/size][/b][/td][/tr][tr][td][url=https://bbs.binmt.cc/thread-123400-1-1.html][color=96a4ff][b][size=3]【简单逆向】7723游戏实名弹窗通用去除[/color][/b][/size][/url][/td][/tr][tr][td][url=https://bbs.binmt.cc/thread-123719-1-1.html][color=96a4ff][b][size=3]【简单逆向】虫虫助手游戏实名弹窗去除思路[/color][/b][/size][/url] [/td][/tr][tr][td][url=https://bbs.binmt.cc/thread-129509-1-1.html][color=96a4ff][b][size=3]【逆向实战】灵活运用教程思路去除弹窗[/color][/b][/size][/url][/td][/tr][tr][td][url=https://bbs.binmt.cc/thread-131561-1-1.html][color=96a4ff][b][size=3](本帖)[/color]【简单逆向】unity去除google广告思路[/size][/b][/url] [/td][/tr][tr][td][url=https://bbs.binmt.cc/thread-130108-1-1.html][color=grey][b][size=3][s]【小白必看】第三方下载游戏精简思路[/s][/color][/b][/size][/url] [color=grey][b][size=2][i]此帖因技术问题暂未完工，具体发布日期待定。[/i][/color][/b][/size] [/td][/tr][/table]
````

# 其它

由于部分标签过于老旧，不再使用，遇见除上述标签以外的内容时，直接使用textContent获取内容即可，无需解析。

# audio（音乐标签）

示例

````
[audio]http://server/audio.wma[/audio]
````

手机端无法使用，PC端可使用

# flash

手机端不支持，现在PC端也不支持，属于已被淘汰

````
[flash]https://test.qcxs.site/gsz.swf[/flash]
````
