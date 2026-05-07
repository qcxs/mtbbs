(function () {
    'use strict';

    /**
     * BBCode 预览工具类
     * 功能：将 BBCode 渲染到弹窗 iframe 中预览，表情资源优先使用页面已有变量，无则自动加载
     */
    class BBCode2Html {
        constructor() {
            this.previewModal = null;       // 预览弹窗容器
            this.iframe = null;            // 预览内容 iframe
            this.smilies_array = [];       // 表情配置数组（优先使用页面已有）
            this.smilies_type = {};        // 表情分类配置
            this.initSmilies();            // 初始化表情数据
            this.iframeInited = false;      // 新增：iframe 是否已初始化
            this.initModal();              // 初始化弹窗结构
        }

        /**
         * 初始化表情数据
         * 优先使用页面已加载的 smilies_array，未加载则自动请求表情脚本
         */
        async initSmilies() {
            // 若页面已存在表情数据，直接使用
            if (window.smilies_array && window.smilies_type) {
                this.smilies_array = window.smilies_array;
                this.smilies_type = window.smilies_type;
                return;
            }

            // 页面无表情数据，动态加载脚本
            try {
                const script = document.createElement('script');
                script.src = 'https://cdn-bbs.mt2.cn/data/cache/common_smilies_var.js?LOt';
                script.charset = 'utf-8';

                // 脚本加载完成后更新表情数据
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                this.smilies_array = window.smilies_array || [];
                this.smilies_type = window.smilies_type || {};
            } catch (err) {
                console.warn('表情脚本加载失败', err);
                this.smilies_array = [];
                this.smilies_type = {};
            }
        }

        /**
         * 显示预览弹窗
         * @param {string} bbcode - 要预览的 BBCode 字符串
         */
        show(bbcode) {
            if (!bbcode || typeof bbcode !== 'string') {
                alert('请传入有效的 BBCode 内容');
                return;
            }
            this.renderIframe(this.iframe, bbcode);
            this.previewModal.style.display = 'flex';
        }

        /**
         * 关闭预览弹窗
         */
        hide() {
            if (this.previewModal) {
                this.previewModal.style.display = 'none';
            }
        }

        /**
         * 初始化预览弹窗 DOM 结构
         */
        initModal() {
            if (this.previewModal) return;

            // 直接 innerHTML 一次性渲染所有结构 + 行内样式
            const modal = document.createElement('div');
            modal.id = 'bbcode-preview-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:999999;display:none;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';

            modal.innerHTML = `
<div style="width:92%;max-width:960px;height:88vh;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 10px 50px rgba(0,0,0,0.3);display:flex;flex-direction:column;">
    <div style="padding:12px 20px;background:#f8f8f8;border-bottom:1px solid #e5e5e5;font-size:15px;font-weight:500;display:flex;justify-content:space-between;align-items:center;">
        <span>BBCode 内容预览</span>
        <button id="close-preview" style="padding:5px 11px;border:none;background:#ff4d4f;color:#fff;border-radius:4px;cursor:pointer;">关闭</button>
    </div>
    <!-- iframe 容器：增加左右内边距 -->
    <div style="flex:1; padding: 0 20px; background:#fff;">
        <iframe id="bbcode-preview-iframe" style="width:100%;height:100%;border:none;background:#fff;"></iframe>
    </div>
</div>
`;

            document.body.appendChild(modal);

            this.previewModal = modal;
            this.iframe = modal.querySelector('#bbcode-preview-iframe');

            // 绑定事件
            document.getElementById('close-preview').addEventListener('click', () => this.hide());
            modal.addEventListener('click', (e) => e.target === modal && this.hide());
        }

        /**
        * 渲染 BBCode 到 iframe
        * @param {string} bbcode - 原始 BBCode
        */
        renderIframe(iframe, bbcode) {
            if (!iframe) return;
            const doc = iframe.contentDocument;

            if (!iframe.dataset.inited) {
                doc.documentElement.innerHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://cdn-bbs.mt2.cn/template/comiis_app/comiis/css/comiis.css?LOt" type="text/css" media="all">
<link rel="stylesheet" href="https://bbs.binmt.cc/source/plugin/comiis_app/cache/comiis_1_style.css?LOt" type="text/css" media="all" id="comiis_app_addclass"/>
</head>
<body>
<div class="comiis_messages comiis_aimg_show cl"><div class="comiis_a comiis_message_table cl" id="preview-content"></div></div>
</body>
</html>`;
                iframe.dataset.inited = 'true';
            }

            const contentEl = doc.getElementById('preview-content');
            if (contentEl) {
                contentEl.innerHTML = this.replaceText(bbcode);
            }
        }

        /**
         * 根据表情标记获取图片地址
         * @param {string} smileyKey - 表情标记如 [doge]、[#大拇指]
         * @returns {string|null} 表情图片地址
         */
        getSmileyUrl(smileyKey) {
            const base = "https://cdn-bbs.mt2.cn/static/image/smiley/";
            const { smilies_array, smilies_type } = this;

            for (const t in smilies_array) {
                const pages = smilies_array[t];
                for (const p in pages) {
                    for (const s of pages[p]) {
                        if (s[1] === smileyKey) {
                            const folder = smilies_type[`_${t}`]?.[1];
                            return folder ? base + folder + '/' + s[2] : null;
                        }
                    }
                }
            }
            return null;
        }

        /**
         * HTML 转义，防止 XSS
         * @param {string} s - 原始字符串
         * @returns {string} 转义后字符串
         */
        escapeHtml(s) {
            if (typeof s !== 'string') return s;
            return s.replace(/[&<>"']/g, m => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m]));
        }

        /**
     * BBCode 转 HTML 核心方法（Discuz! 优化版）
     * 无while循环，开标签/关标签分离，支持嵌套，性能更高
     * @param {string} text - 原始 BBCode
     * @returns {string} 转换后的 HTML
     */
        replaceText(text) {
            const codes = [];
            let idx = 0;
            let html = this.escapeHtml(text);

            // 代码块解析（保持不变，必须占位）
            html = html.replace(/\[code]([\s\S]*?)\[\/code]/g, (m, c) => {
                const lines = c.split("\n").map(l => `<li>${l}<br></li>`).join('');
                codes.push(`<div class="comiis_blockcode comiis_bodybg b_ok f_b"><div class="bg_f b_l"><ol>${lines}</ol></div></div>`);
                return `__CODE__${idx++}__`;
            });

            // ========================
            // Discuz! 风格：分开替换 开标签 / 关标签
            // ========================

            // 1. 字体尺寸 size
            html = html.replace(/\[size=([^\]]+)]/gi, '<font size="$1">');
            html = html.replace(/\[\/size]/gi, '</font>');

            // 2. 颜色 color
            html = html.replace(/\[color=([^\]]+)]/gi, '<font color="$1">');
            html = html.replace(/\[\/color]/gi, '</font>');

            // 3. 背景色 backcolor
            html = html.replace(/\[backcolor=([^\]]+)]/gi, '<font style="background-color:$1">');
            html = html.replace(/\[\/backcolor]/gi, '</font>');

            // 4. 对齐 align
            html = html.replace(/\[align=([^\]]+)]/gi, '<div align="$1">');
            html = html.replace(/\[\/align]/gi, '</div>');

            // 5. 粗体 b
            html = html.replace(/\[b]/gi, '<strong>');
            html = html.replace(/\[\/b]/gi, '</strong>');

            // 6. 斜体 i
            html = html.replace(/\[i]/gi, '<i>');
            html = html.replace(/\[\/i]/gi, '</i>');

            // 7. 字体 font
            html = html.replace(/\[font=([^\]]+)]/gi, '<font face="$1">');
            html = html.replace(/\[\/font]/gi, '</font>');

            // 8. 下划线 u
            html = html.replace(/\[u]/gi, '<u>');
            html = html.replace(/\[\/u]/gi, '</u>');

            // 9. 删除线 s
            html = html.replace(/\[s]/gi, '<strike>');
            html = html.replace(/\[\/s]/gi, '</strike>');

            // 10. 分割线
            html = html.replace(/\[hr\]/g, '<hr class="l">');

            // 11. 引用 quote（单标签不嵌套，保持原样）
            html = html.replace(/\[quote]([\s\S]*?)\[\/quote]/g, '<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font>回复</font> $1</blockquote></div>');

            // 12. free 块
            html = html.replace(/\[free]([\s\S]*?)\[\/free]/g, '<div class="comiis_quote bg_h f_c"><blockquote>$1</blockquote></div>');

            // 13. hide 隐藏块（支持 [hide]、[hide=任意参数]、[hide=参数,参数]）
            html = html.replace(/\[hide(?:=[^\]]*)?]([\s\S]*?)\[\/hide]/g, '<div class="comiis_quote bg_h f_c"><h2 class="f_a">本帖隐藏的内容: </h2>$1</div>');

            // 14. 列表 list
            html = html.replace(/\[list=1]/gi, '<ul class="litype_1" type="1">');
            html = html.replace(/\[list=a]/gi, '<ul class="litype_2" type="a">');
            html = html.replace(/\[list]/gi, '<ul>');
            html = html.replace(/\[\/list]/gi, '</ul>');
            html = html.replace(/\[\*]/gi, '<li>');

            // email 邮箱标签解析
            html = html.replace(/\[email=([^\]]+)]([\s\S]*?)\[\/email]/gi, '<a href="mailto:$1" target="_blank">$2</a>');
            // 兼容无内容简写 [email]xxx@qq.com[/email]
            html = html.replace(/\[email]([\s\S]*?)\[\/email]/gi, '<a href="mailto:$1" target="_blank">$1</a>');

            // QQ 解析 [qq]数字[/qq]
            html = html.replace(/\[qq](\d+)\[\/qq]/gi, '<a href="http://wpa.qq.com/msgrd?v=3&uin=$1&site=[Discuz!]&from=discuz&menu=yes" target="_blank"><img src="static/image/common/qq_big.gif" border="0"></a>');

            // 附件 [attach]任意内容[/attach] 解析，硬编码
            html = html.replace(/\[attach]([\s\S]+?)\[\/attach]/g, (match, aid) => '<div class="comiis_attach bg_e b_ok cl"><a href="javascript:;"><p class="attach_tit"><img src="https://cdn-bbs.mt2.cn/static/image/filetype/text.gif" border="0" class="vm" alt=""> <span class="f_ok">附件_' + aid + '</span><em class="f_d">&nbsp;2026-1-2 21:07上传</em></p><p class="attach_size f_c">未知大小 , 下载次数: 0, 下载积分: 金币 -1 </p></a><div class="attach_txt bg_f b_ok"><span class="f_c">ID：' + aid + '</span></div></div>');

            // 解析 [media] 标签：仅解析B站视频，其余转为链接
            html = html.replace(/\[media(=[^\]]+)?\]([\s\S]+?)\[\/media\]/gi, (match, params, url) => {
                url = url.trim().replace(/[<>"']/g, '');
                let vid = '';

                // 支持 B站 3种格式
                if (/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/i.test(url)) {
                    vid = RegExp.$1;
                } else if (/bilibili\.com\/video\/av(\d+)/i.test(url)) {
                    vid = 'BV' + RegExp.$1;
                } else if (/b23\.tv\/(BV[a-zA-Z0-9]+)/i.test(url)) {
                    vid = RegExp.$1;
                }

                // B站视频 → 播放器
                if (vid) {
                    return `<iframe src="https://player.bilibili.com/player.html?bvid=${vid}&high_quality=1" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;
                }

                // 非B站 → 普通链接
                return `<a href="${url}" target="_blank" style="color:#0066cc">${url}</a>`;
            });

            // 附件图片解析
            const att = html.match(/\[attachimg]([\s\S]+?)\[\/attachimg]/g);
            if (att) att.forEach(item => {
                const id = item.match(/\[attachimg]([\s\S]+?)\[\/attachimg]/)[1];
                const el = document.getElementById(`aimg_${id}`);
                html = html.replace(item, `<span class="comiis_postimg vm"><img src="${el?.src || ''}" title="${el?.title || ''}"></span>`);
            });

            // 链接解析
            const url = html.match(/\[url(=[\s\S]*?)?]([\s\S]*?)\[\/url]/g);
            if (url) url.forEach(item => {
                const m = item.match(/\[url(?:=([\s\S]*?))?]([\s\S]*?)\[\/url]/);
                html = html.replace(item, `<a href="${m[1] || m[2]}" target="_blank">${m[2]}</a>`);
            });

            // 图片解析
            const img = html.match(/\[img(|\=[\s\S]+?)]([\s\S]*?)\[\/img]/g);
            if (img) img.forEach(item => {
                const s = item.match(/\[img=([\s\S]+?)]/);
                const w = s ? s[1].split(',')[0] : '100%';
                const src = item.match(/\[img(?:=.*?)?]([\s\S]*?)\[\/img]/)[1];
                html = html.replace(item, `<img src="${src}" width="${w}">`);
            });

            // 表格解析
            html = html.replace(/\[td]([\s\S]*?)\[\/td]/g, '<td style="border:1px solid \#E3EDF5">$1</td>');
            html = html.replace(/\[tr]([\s\S]*?)\[\/tr]/g, '<tr>$1</tr>');
            html = html.replace(/\[table]([\s\S]*?)\[\/table]/g, '<table style="width:100%">$1</table>');

            // 表情解析
            const sm = html.match(/\[([\#\w\u4e00-\u9fa5]+)]/g);
            if (sm) sm.forEach(item => {
                const u = this.getSmileyUrl(item);
                if (u) html = html.replace(item, `<img src="${u}" style="max-height:22px">`);
            });

            // 换行
            html = html.replace(/\n/g, '<br>');

            // 代码块回填
            codes.forEach((c, i) => html = html.replace(`__CODE__${i}__`, c));

            return html;
        }
    }

    // 单例挂载全局
    const instance = new BBCode2Html();
    window.BBCode2Html = {
        show: (bb) => instance.show(bb), // 显示预览窗
        hide: () => instance.hide(), // 隐藏
        replaceText: (text) => instance.replaceText(text), // BBCode2Html
        renderInline: (iframe, bbcode) => instance.renderIframe(iframe, bbcode) // 内嵌iframe渲染
    };
})();

// 使用示例
// 带预览窗，已自动注入css
// BBCode2Html.show(`[size=5][align=center]教程预览[doge][#大拇指][/align][/size]`);

// 更新iframe内容
// BBCode2Html.renderInline(iframe,bbcode);

// bbcode2html，需要自行配置css
// console.log(BBCode2Html.replaceText("[b]加粗[/b] [color=red]红色[/color]"))