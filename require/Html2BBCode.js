/**
 * HTML 转 BBCode 工具类（无需new，自动挂载window）
 * 责任链：class → 复杂 → 标签属性 → textContent
 * 支持嵌套、不递归标签、表情、attachimg、code、quote、table等
 * 支持自动识别传入 DOM 或 HTML 字符串
 */
(function () {
    'use strict';

    class Html2BBCode {
        constructor() {
            this.noRecurseTags = new Set(['code']);
            this.smileyMap = new Map();
            this.tipStr = [];
            // 构造时自动初始化表情数据
            this.initSmilies().then(() => {
                this.smileyMap = this.initSmileyMap();
            });
        }

        /**
         * 初始化表情数据
         * 优先使用页面已加载的 smilies_array，未加载则自动请求表情脚本
         */
        async initSmilies() {
            if (window.smilies_array && window.smilies_type) {
                this.smilies_array = window.smilies_array;
                this.smilies_type = window.smilies_type;
                return;
            }

            try {
                const script = document.createElement('script');
                script.src = 'https://cdn-bbs.mt2.cn/data/cache/common_smilies_var.js?LOt';
                script.charset = 'utf-8';

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

        initSmileyMap() {
            const smileyMap = new Map();
            if (!this.smilies_type || !this.smilies_array) return smileyMap;

            Object.keys(this.smilies_type).forEach(typeKey => {
                const [, dir] = this.smilies_type[typeKey];
                const typeId = typeKey.replace('_', '');
                const arrays = this.smilies_array[typeId];
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
            return smileyMap;
        }

        // 支持传入 DOM 或 HTML 字符串自动识别
        convert(input) {
            // 重置数据
            this.tipStr = [];

            let rootDom;

            // 传入的是文本 → 转成临时 DOM
            if (typeof input === 'string') {
                const div = document.createElement('div');
                div.innerHTML = input;
                rootDom = div;
            }
            // 传入的是 DOM 元素
            else if (input instanceof HTMLElement) {
                rootDom = input;
            }
            else {
                return '';
            }

            let bbcode = this.parseNode(rootDom);
            bbcode = this.formatBBCode(bbcode);
            return bbcode;
        }

        parseNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const el = node;

            // 责任链 1：class 匹配
            const classMatch = this.matchByClass(el);
            if (classMatch !== null) {
                return classMatch;
            }

            // 责任链 2：复杂匹配
            const regexMatch = this.matchByOthers(el);
            if (regexMatch !== null) {
                return regexMatch;
            }

            // 责任链 3：标签 + 属性匹配
            const tagMatch = this.matchByTagAndAttr(el);
            if (tagMatch !== null) {
                return tagMatch;
            }

            // 兜底：递归子节点
            return this.parseChildren(el);
        }

        // 责任链1：class、id 匹配
        matchByClass(el) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className || '';

            // “本帖的隐藏内容”文字
            if (cls.includes('f_a')) return '';

            if (cls.includes('pstatus')) {
                const text = el.textContent.trim();
                // 正则匹配：作者名 和 编辑时间
                const match = text.match(/本帖最后由\s*(.+?)\s*于\s*([\d\-:\s]+)\s*编辑/);
                if (match) {
                    const author = match[1].trim(); // 作者
                    const time = match[2].trim();  // 时间
                    // 格式化输出
                    this.tipStr.push(`作者: ${author}，修改时间：${time}`);
                    return `\n作者: ${author}，修改时间：${time}\n`;
                }
                return ''
            }

            // 帖子信息
            if (cls.includes('comiis_modact')) {
                const text = el.textContent.trim();
                if (text.includes('精华'))
                    this.tipStr.push('[精华帖]');
                if (text.includes('高亮'))
                    this.tipStr.push('[高亮帖]');
                return '';
            }

            // 代码块
            if (cls === 'comiis_blockcode comiis_bodybg b_ok f_b') {
                const text = el.textContent.trim();
                return `\n[code]${text}[/code]\n`;
            }

            // 抢楼帖
            if (cls === 'comiis_quote comiis_qianglou bg_h') {
                const text = el.textContent.trim();
                this.tipStr.push('[抢楼帖]')
                return ``;
            }

            // 付费帖（未付费）
            if (cls === 'comiis_quote bg_h') {
                const text = el.textContent.trim();
                this.tipStr.push('你没有付费，解析不全')
                return `你没有付费，解析不全`;
            }

            // 密码帖（没有输入密码）
            if (cls === 'comiis_postpw bg_h') {
                const text = el.textContent.trim();
                if (text.includes('本帖为密码帖 ，请输入密码继续访问!')) {
                    this.tipStr.push('[密码帖]请输入密码后重新解析')
                    return ``;
                }
            }

            return null;
        }

        // 责任链2：复杂匹配，为了解析一个bbcode涉及多个html
        // 按照从小到大的顺序解析
        matchByOthers(el) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className || '';

            // 图片附件
            if (cls === 'comiis_postimg vm') {
                const img = el.querySelector('img')
                if (img) {
                    // 提取纯数字
                    const id = img.id.replace(/\D/g, '');
                    const src = img.src;
                    this.tipStr.push(`图片附件id：${id}`)
                    return `[img]${src}[/img]`
                }
            }

            // 附件
            if (cls === 'comiis_attach bg_e b_ok cl') {
                const title = el.querySelector('.attach_tit .f_ok')?.textContent.trim();
                const time = el.querySelector('.attach_tit .f_d')?.textContent.trim().replace(/\u00A0/g, ' ');
                const info = el.querySelector('.attach_size')?.textContent.trim();
                const href = el.querySelector('a')?.href || '';

                const data = {
                    fileName: title,
                    uploadTime: time,
                    fileInfo: info,
                    downloadLink: href
                };

                this.tipStr.push(`帖子包含附件，信息：${JSON.stringify(data)}`)
                return `\n[attach]附件[/attach]\n`;
            }

            // 引用 [quote] (带 b_dashed 类的特殊格式)
            if (cls === 'comiis_quote bg_h b_dashed f_c') {
                const font = el.querySelector('font');
                const bq = el.querySelector('blockquote');
                if (font?.textContent.startsWith('回复') && bq) {
                    // 删除子节点的：[size=2]回复[/size] + 后面所有空白/不可见字符
                    const content = this.parseChildren(bq).replace(/^\[size=2\]回复\[\/size\]\s*/, '').trim();
                    return `\n[quote]${content}[/quote]\n`;
                }
            }

            // 隐藏（已回复） [hide]
            if (cls === 'comiis_quote bg_h f_c') {
                const text = el.textContent.trim();
                const h2 = el.querySelector('h2');
                if (h2?.textContent.includes('本帖隐藏的内容')) {
                    // const content = this.parseChildren(el).replace(/^本帖隐藏的内容:/, '').trim();// 已由class处理
                    const content = this.parseChildren(el);
                    return `\n[hide]${content}[/hide]\n`;
                }

            }

            // 隐藏（积分不够） [hide=,积分]
            if (cls === 'comiis_quote bg_h f_c') {
                const text = el.textContent.trim();
                const jifen = text.match(/需要积分高于 (\d+) 才可浏览/);// 有此文字为规则
                if (jifen) {
                    // 这个地方很特殊，不是包裹情况，没必要获取text、解析子元素
                    if (text.includes('您当前积分为')) {
                        // 积分不够
                        return `\n[hide=,${jifen[1]}]你的积分不够，无法浏览[/hide]\n`
                    } else {
                        // 积分足够，或者是发帖人、管理员
                        return ''
                    }
                }
            }

            // 隐藏（未回复） [hide]
            if (cls === 'comiis_quote bg_h f_c') {
                const text = el.textContent.trim();
                if (text.length < 30 && text.includes('如果您要查看本帖隐藏内容')) {
                    this.tipStr.push('你没有回复，解析不全')
                    return `\n[hide]你没有回复，无法查看[/hide]\n`;
                }
            }

            // 免费内容 [free]
            if (cls === 'comiis_quote bg_h f_c') {
                const text = el.textContent.trim();
                const bq = el.querySelector('blockquote');
                if (bq) {
                    return `\n[free]${this.parseChildren(bq)}[/free]\n`;
                }
            }

            // 消息被屏蔽
            if (cls === 'comiis_quote bg_h f_c') {
                const text = el.textContent.trim();
                const em = el.querySelector('em');
                if (em) {
                    this.tipStr.push('该帖被屏蔽')
                    return `\n${text}\n`;
                }
            }

            // 其他，例如：仅作者可见
            // 实际不是free标签，只是它的样式最像
            if (cls === 'comiis_quote bg_h f_c') {
                const text = el.textContent.trim();
                return `\n[free]${text}[free]\n`;
            }

            // 登录查看资源提示
            if (cls === 'comiis_p10 bg_e f14') {
                const h3 = el.querySelector('h3.f_c');
                const aLogin = el.querySelector('a[href*="action=login"]');
                if (h3 && aLogin) {
                    this.tipStr.push(`提示：你没有登录`)
                    return ''
                }
            }

            return null;
        }

        // 责任链3：标签+属性
        matchByTagAndAttr(el) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className || '';

            if (tag === 'script') {
                const scriptContent = el.textContent || '';

                // 解析哔哩哔哩视频 [media]
                if (scriptContent.includes('flv_') && scriptContent.includes('player.bilibili.com')) {
                    // 正则提取 bvid
                    const bvMatch = scriptContent.match(/bvid=([^&'"]+)/i);
                    if (bvMatch && bvMatch[1]) {
                        // 直接返回 media 标签，不再向下解析
                        return `[media=x,500,375]https://b23.tv/BV${bvMatch[1]}[/media]`;
                    }
                }

                // 解析音频播放器 [audio]
                if (scriptContent.includes('detectPlayer')) {
                    const reg = /detectPlayer\([^,]+,[^,]+,\s*["']([^"']+)["']/gi
                    const match = reg.exec(scriptContent)
                    if (match && match[1]) {
                        return `[audio]${match[1]}[/audio]`
                    }
                }

                if (scriptContent.includes('AC_FL_RunContent')) {
                    this.tipStr.push('帖子含有flash，请去支持flash的浏览器中查看')
                    return ''
                }

                // 其他script标签
                return '';
            }

            // 解析音频播放器 [audio]，已在script中编写，此处过滤：“如果无法播放，请点击此处在新窗口打开”
            if (cls.includes('media')) return '';

            if (tag === 'strong' || tag === 'b') return `[b]${this.parseChildren(el)}[/b]`;
            if (tag === 'i') return `[i]${this.parseChildren(el)}[/i]`;
            if (tag === 'u') return `[u]${this.parseChildren(el)}[/u]`;
            if (tag === 'strike') return `[s]${this.parseChildren(el)}[/s]`;

            if (tag === 'a') {
                const href = el.getAttribute('href') || '';
                const content = this.parseChildren(el); // 递归解析子元素
                const text = el.textContent.trim();
                if (text.startsWith('@')) return `${text} `;
                if (href.startsWith('mailto:')) return `[email=${href.replace('mailto:', '')}]${content}[/email]`;
                if (href.includes('wpa.qq.com')) {
                    const m = href.match(/uin=(\d+)/);
                    return m ? `[qq]${m[1]}[/qq]` : '';
                }
                return `[url=${href}]${content}[/url]`;
            }

            if (tag === 'font') {
                let res = this.parseChildren(el);
                const color = el.getAttribute('color');
                const size = el.getAttribute('size');
                const face = el.getAttribute('face');
                const bg = el.style.backgroundColor;
                if (color) res = `[color=${color}]${res}[/color]`;
                if (size) res = `[size=${size}]${res}[/size]`;
                if (face) res = `[font=${face}]${res}[/font]`;
                if (bg) res = `[background=${bg}]${res}[/background]`;
                return res;
            }

            if (tag === 'div' && el.hasAttribute('align')) {
                return `[align=${el.getAttribute('align')}]${this.parseChildren(el)}[/align]`;
            }

            if (tag === 'ul') {
                // 读取 type 和 class
                const type = el.getAttribute('type') || '';
                const cls = el.className || '';

                // 列表类型规则（优先级：class > type）
                let listType = '';
                if (cls.includes('litype_1')) {
                    listType = '1';    // 数字有序列表
                } else if (cls.includes('litype_2')) {
                    listType = 'a';    // 字母有序列表
                } else if (type) {
                    listType = type;   // 兼容 type 属性
                }

                // 拼接列表项（递归解析）
                let li = '';
                // 只遍历直接子元素 li，不包含嵌套内部的 li，避免list中同一标签被识别两次
                // 例如：list套code，code也包含li，错误的解析code
                Array.from(el.children).forEach(item => {
                    if (item.tagName.toLowerCase() === 'li') {
                        li += `[*]${this.parseChildren(item)}\n`;
                    }
                });

                // 输出最终 BBCode
                return listType
                    ? `[list=${listType}]\n${li}[/list]`
                    : `[list]\n${li}[/list]`;
            }

            if (tag === 'img') {
                const src = el.getAttribute('src');
                if (!src) return '';
                if (src.includes('static/image/smiley/')) {
                    return this.smileyMap.get(src) || '';
                }
                const w = el.getAttribute('width');
                const h = el.getAttribute('height');
                if (w && h) return `[img=${w},${h}]${src}[/img]`;
                return `[img]${src}[/img]`;
            }

            if (tag === 'span' && el.classList.contains('comiis_postimg')) {
                const img = el.querySelector('img');
                if (img) return `[img]${img.src}[/img]`;
            }

            if (tag === 'table') return `[table]${this.parseChildren(el)}[/table]`;
            if (tag === 'tr') return `[tr]${this.parseChildren(el)}[/tr]`;
            if (tag === 'td') return `[td]${this.parseChildren(el)}[/td]`;

            if (tag === 'hr') return `[hr]`;
            if (tag === 'embed' || tag === 'object') return '';
            if (tag === 'br') return '\n';

            return null;
        }

        // 递归子节点
        parseChildren(el) {
            const tag = el.tagName?.toLowerCase();
            if (this.noRecurseTags.has(tag) || el.classList.contains('comiis_blockcode')) { // 阻止递归code标签
                return el.textContent.trim();
            }

            let out = '';
            el.childNodes.forEach(child => {
                out += this.parseNode(child);
            });
            return out;
        }

        formatBBCode(text) {
            // 去重
            const uniqueArr = [...new Set(this.tipStr)];
            console.log(uniqueArr.join('\n'))

            return text
                .replace(/\n{2,}/g, '\n')
                .replace(/[ \t]+/g, ' ')
                .trim()
        }

    }

    const instance = new Html2BBCode();
    window.Html2BBCode = {
        convert: (input) => instance.convert(input)
    };
})();

// 使用方法
// 传入 DOM
// console.log(Html2BBCode.convert(document.querySelector('.comiis_messages')))

// 传入 HTML 字符串（自动转DOM）
// const html = '<div class="comiis_quote bg_h f_c">...</div>';
// console.log(Html2BBCode.convert(html));
