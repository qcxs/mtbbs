/**
 * HTML 转 BBCode 工具类（无需new，自动挂载window）
 * 责任链：class → 标签属性 → 正则 → textContent
 * 支持嵌套、不递归标签、表情、attachimg、code、quote、table等
 * 支持自动识别传入 DOM 或 HTML 字符串
 */
(function () {
    'use strict';

    class Html2BBCode {
        constructor() {
            this.noRecurseTags = new Set(['code']);
            this.smileyMap = new Map();
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

            // 责任链 2：标签 + 属性匹配
            const tagMatch = this.matchByTagAndAttr(el);
            if (tagMatch !== null) {
                return tagMatch;
            }

            // 责任链 3：正则匹配（返回 BBCode + 继续解析子元素）
            const regexMatch = this.matchByRegex(el);
            if (regexMatch !== null) {
                return regexMatch;
            }

            // 兜底：递归子节点
            return this.parseChildren(el);
        }

        // 责任链1：class 匹配
        matchByClass(el) {
            const cls = el.className || '';

            if (cls.includes('pstatus') || cls.includes('comiis_modact')) {
                return el.textContent;
            }

            if (cls.includes('comiis_blockcode')) {
                const text = el.textContent.trim();
                return `\n[code]${text}[/code]\n`;
            }

            if (cls.includes('comiis_attach')) {
                return '\n[attach]附件[/attach]\n';
            }

            return null;
        }

        // 责任链2：标签+属性
        matchByTagAndAttr(el) {
            const tag = el.tagName.toLowerCase();

            if (tag === 'script') return '';
            if (tag === 'strong' || tag === 'b') return `[b]${this.parseChildren(el)}[/b]`;
            if (tag === 'i') return `[i]${this.parseChildren(el)}[/i]`;
            if (tag === 'u') return `[u]${this.parseChildren(el)}[/u]`;
            if (tag === 'strike') return `[s]${this.parseChildren(el)}[/s]`;

            if (tag === 'a') {
                const href = el.getAttribute('href') || '';
                const content = this.parseChildren(el); // 递归解析子元素（关键修复）
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
                el.querySelectorAll('li').forEach(item => {
                    li += `[*]${this.parseChildren(item)}\n`;
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

            if (tag === 'iframe' && el.src.includes('bilibili')) {
                const bv = el.src.match(/bvid=([^&]+)/i);
                if (bv) return `[media=x,500,375]https://b23.tv/BV${bv[1]}[/media]`;
            }

            // 解析音频播放器 [audio]
            if (tag === 'ignore_js_op') {
                // 查找内部是否包含 .media 容器
                const mediaHref = el.querySelector('div.media a');
                if (mediaHref) {
                    // 提取里面的音频/视频真实URL
                    const href = mediaHref.href;
                    // 返回你需要的 BBCode
                    return `[audio]${href}[/audio]`;
                }
            }

            if (tag === 'hr') return `[hr]`;
            if (tag === 'embed' || tag === 'object') return '';
            if (tag === 'br') return '\n';

            return null;
        }

        // 责任链3：正则匹配（不破坏DOM，可继续递归解析）
        matchByRegex(el) {
            if (el.tagName.toLowerCase() !== 'div') return null;
            const cls = el.className || '';

            // 1. 引用 [quote]
            if (cls.includes('comiis_quote') && cls.includes('bg_h') && cls.includes('b_dashed') && cls.includes('f_c')) {
                const font = el.querySelector('font');
                const bq = el.querySelector('blockquote');
                if (font?.textContent.startsWith('回复') && bq) {
                    const content = this.parseChildren(bq).replace(/^回复/, '').trim();
                    return `\n[quote]${content}[/quote]\n`;
                }
            }

            // 2. 积分隐藏 [hide=,积分]
            if (cls.includes('comiis_quote') && cls.includes('bg_h') && cls.includes('f_c')) {
                const text = el.textContent.trim();
                const m = text.match(/以下内容需要积分高于 (\d+) 才可浏览/);
                if (m) {
                    return `\n[hide=,${m[1]}][/hide]\n`;
                }
            }

            // 3.1 本帖隐藏 [hide]
            if (cls.includes('comiis_quote') && cls.includes('bg_h') && cls.includes('f_c')) {
                const h2 = el.querySelector('h2');
                if (h2?.textContent.includes('本帖隐藏的内容')) {
                    const content = this.parseChildren(el).replace(/^本帖隐藏的内容:/, '').trim();
                    return `\n[hide]${content}[/hide]\n`;
                }
            }

            // 3.2 回复可见隐藏 [hide]
            if (cls.includes('comiis_quote') && cls.includes('bg_h') && cls.includes('f_c')) {
                const text = el.textContent.trim();
                const a = el.querySelector('a[href*="action=reply"]');
                if (text.includes('如果您要查看本帖隐藏内容') && a) {
                    return `\n[hide]回复可见[/hide]\n`;
                }
            }

            // 4. 免费内容 [free]
            if (cls.includes('comiis_quote') && cls.includes('bg_h') && cls.includes('f_c')) {
                const bq = el.querySelector('blockquote');
                if (bq) {
                    return `\n[free]${this.parseChildren(bq)}[/free]\n`;
                }
            }

            return null;
        }

        // 递归子节点
        parseChildren(el) {
            const tag = el.tagName?.toLowerCase();
            if (this.noRecurseTags.has(tag)) {
                return el.textContent.trim();
            }

            let out = '';
            el.childNodes.forEach(child => {
                out += this.parseNode(child);
            });
            return out;
        }

        formatBBCode(text) {
            return text
                .replace(/\n{2,}/g, '\n')
                .replace(/[ \t]+/g, ' ')
                .trim()
                .replace(/\[size=2\]回复\[\/size\] ?/g, ''); // quote的回复2字特殊处理
        }
    }

    const instance = new Html2BBCode();
    window.Html2BBCode = {
        convert: (input) => instance.convert(input)
    };
})();

// 使用方法
// 方式1：传入 DOM
// console.log(Html2BBCode.convert(document.querySelector('.comiis_messages')))

// 方式2：传入 HTML 字符串（自动转DOM）
// const html = '<div class="comiis_quote bg_h f_c">...</div>';
// console.log(Html2BBCode.convert(html));