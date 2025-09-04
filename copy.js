// 提取处理单个元素的逻辑为独立函数
function processElement(div) {
    try {
        // 查找后代中class为"comiis_postli_top bg_f"的div下的h2元素
        const h2Element = div.querySelector('div.comiis_postli_top.bg_f h2');

        if (h2Element) {
            // 检查是否已经添加过span，避免重复添加
            if (!h2Element.querySelector('span[data-action="reference"]')) {
                // 创建要添加的span元素
                const span = document.createElement('span');
                span.dataset.action = "reference"; // 添加标识，用于检查重复
                span.textContent = ' [借鉴一下]';
                span.style.cursor = 'pointer';
                span.style.color = '#0066cc';
                span.style.marginLeft = '8px';

                // 为span添加点击事件
                span.addEventListener('click', () => {
                    // 查找对应div中的内容元素
                    const contentElement = div.querySelector('div.comiis_messages.comiis_aimg_show.cl');

                    if (contentElement) {
                        // 输出innerHTML到控制台
                        previewDia(htmlToBbcode(contentElement.innerHTML));
                    } else {
                        console.log('未找到class为"comiis_messages comiis_aimg_show cl"的元素');
                    }
                });

                // 将span添加到h2元素的末尾
                h2Element.appendChild(span);
            }
        }

        // 查找class为"comiis_postli_times bg_f"的元素
        const timesElement = div.querySelector('div.comiis_postli_times.bg_f');
        if (timesElement) {
            const idMatch = div.id.match(/\d+/);
            if (idMatch) {
                const id = idMatch[0];
                // 在其后代中查找class为"bottom_zhan y"的div
                const bottomZhanSpan = timesElement.querySelector('span.bottom_zhan.y');
                if (bottomZhanSpan) {
                    // 检查是否已经添加过share span，避免重复添加
                    if (!timesElement.querySelector('span[data-action="share"]')) {
                        // 创建share span标签
                        const shareSpan = document.createElement('span');
                        shareSpan.dataset.action = "share"; // 添加标识，用于检查重复
                        shareSpan.className = 'y';
                        shareSpan.textContent = 'share';
                        shareSpan.style.marginLeft = '8px';

                        // 为share span添加点击事件
                        shareSpan.addEventListener('click', () => {
                            // 利用页面已有tid变量拼接链接
                            const link = `https://bbs.binmt.cc/forum.php?mod=redirect&goto=findpost&ptid=${window.tid}&pid=${id}`;
                            // 复制链接到剪贴板
                            previewDia(link);
                        });

                        // 将share span添加到bottomZhanSpan的后面
                        bottomZhanSpan.parentNode.insertBefore(shareSpan, bottomZhanSpan.nextSibling);
                    }
                }
            }
        }
    } catch (error) {
        console.error('处理元素时发生错误:', error);
    }
}

// 处理初始存在的元素
const targetSelector = 'div.comiis_postli.comiis_list_readimgs.nfqsqi';
document.querySelectorAll(targetSelector).forEach(processElement);

// 设置MutationObserver监听新添加的元素
function setupMutationObserver() {
    // 选择观察的目标节点
    const targetNode = document.body;
    
    // 配置观察选项
    const config = {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    };
    
    // 创建观察器实例
    const observer = new MutationObserver((mutationsList) => {
        // 遍历所有变化
        for (let mutation of mutationsList) {
            // 只处理添加子节点的变化
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 检查每个新增节点及其子节点是否符合选择器
                mutation.addedNodes.forEach(node => {
                    // 检查节点是否是元素节点
                    if (node.nodeType === 1) {
                        // 如果新增节点本身就是目标节点，直接处理
                        if (node.matches(targetSelector)) {
                            processElement(node);
                        } else {
                            // 否则检查新增节点的后代是否有目标节点
                            node.querySelectorAll(targetSelector).forEach(processElement);
                        }
                    }
                });
            }
        }
    });
    
    // 开始观察目标节点
    observer.observe(targetNode, config);
    
    // 返回观察器实例，以便需要时可以停止观察
    return observer;
}

// 启动观察器
const observer = setupMutationObserver();

// 如果需要停止观察，可以调用：
// observer.disconnect();


function htmlToBbcode(html) {
    let bbcode = html;
    const codeBlocks = []; // 存储提取的代码块内容
    let codeIndex = 0; // 代码块索引

    // -------------------------- 1. 提取代码块并替换为占位符
    bbcode = bbcode.replace(
        /<div class="comiis_blockcode[^>]*><div class="bg_f b_l"><ol>([\s\S]*?)<\/ol><\/div><\/div>/gi,
        (match, olContent) => {
            // 处理代码块内容
            let codeContent = olContent
                .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '$1\n')
                .replace(/^\s*\n/gm, ''); // 清理空行

            // 解析代码内实体
            const codeEntities = {
                '&nbsp;': ' ',
                '&lt;': '<',
                '&gt;': '>',
                '&amp;': '&'
            };
            Object.entries(codeEntities).forEach(([entity, char]) => {
                codeContent = codeContent.replace(new RegExp(entity, 'gi'), char);
            });

            // 清理代码内的HTML标签（只处理真正的标签）
            codeContent = codeContent.replace(/<br[^>]*>/gi, '\n')
                .replace(/<[a-zA-Z][^>]*>/gi, '')
                .replace(/<\/[a-zA-Z][^>]*>/gi, '');

            // 存储处理后的代码块，返回占位符
            const placeholder = `__CODE_BLOCK_${codeIndex}__`;
            codeBlocks.push(`[code]${codeContent.trim()}[/code]`);
            codeIndex++;
            return placeholder;
        }
    );

    // -------------------------- 2. 处理非代码块部分的标签
    // 处理引用 [quote]
    bbcode = bbcode.replace(
        /<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font[^>]*>回复<\/font> ([\s\S]*?)<\/blockquote><\/div>/gi,
        '[quote]$1[/quote]'
    );

    // 处理隐藏内容 [hide]
    bbcode = bbcode.replace(
        /<div class="comiis_quote bg_h f_c">以下内容需要积分高于 ([\d]+) 才可浏览<\/div>/gi,
        '[hide=,$1][/hide]'
    );
    bbcode = bbcode.replace(
        /<div class="comiis_quote bg_h f_c"><h2[^>]*>本帖隐藏的内容: <\/h2>([\s\S]*?)<\/div>/gi,
        '[hide]$1[/hide]'
    );

    // 处理免费内容 [free]
    bbcode = bbcode.replace(
        /<div class="comiis_quote bg_h f_c"><blockquote>([\s\S]*?)<\/blockquote><\/div>/gi,
        '[free]$1[/free]'
    );

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

    // 处理普通图片 [img]
    bbcode = bbcode.replace(
        /<img[^>]*src="([^"]+)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>/gi,
        (_, src, w, h) => `[img=${w || ''},${h || ''}]${src}[/img]`
    );
    bbcode = bbcode.replace(
        /<img[^>]*src="([^"]+)"[^>]*>/gi,
        '[img]$1[/img]'
    );

    // 处理QQ标签 [qq]
    bbcode = bbcode.replace(
        /<a[^>]*href="http:\/\/wpa\.qq\.com\/msgrd\?[^>]*uin=([^&]+)[^>]*>([\s\S]*?)<\/a>/gi,
        '[qq]$1[/qq]'
    );

    // 处理电子邮件 [email]
    bbcode = bbcode.replace(
        /<a[^>]*href="mailto:([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
        (_, email, text) => {
            const cleanEmail = email.trim();
            const cleanText = text.trim();
            return cleanEmail === cleanText ? `[email]${cleanEmail}[/email]` : `[email=${cleanEmail}]${cleanText}[/email]`;
        }
    );

    // 处理链接 [url]
    bbcode = bbcode.replace(
        /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
        (_, href, text) => {
            const cleanHref = href.trim();
            const cleanText = text.trim();
            return cleanHref === cleanText ? `[url]${cleanHref}[/url]` : `[url=${cleanHref}]${cleanText}[/url]`;
        }
    );

    // 处理文本样式标签
    bbcode = bbcode.replace(/<strong>([\s\S]*?)<\/strong>/gi, '[b]$1[/b]');
    bbcode = bbcode.replace(/<i>([\s\S]*?)<\/i>/gi, '[i]$1[/i]');
    bbcode = bbcode.replace(/<u>([\s\S]*?)<\/u>/gi, '[u]$1[/u]');
    bbcode = bbcode.replace(/<strike>([\s\S]*?)<\/strike>/gi, '[s]$1[/s]');

    // 处理颜色和背景色
    bbcode = bbcode.replace(
        /<font[^>]*color="([^"]+)"[^>]*>([\s\S]*?)<\/font>/gi,
        '[color=$1]$2[/color]'
    );
    bbcode = bbcode.replace(
        /<font[^>]*style="background-color:([^;]+);?"[^>]*>([\s\S]*?)<\/font>/gi,
        '[backcolor=$1]$2[/backcolor]'
    );

    // 处理字号 [size]
    bbcode = bbcode.replace(
        /<font[^>]*size="([^"]+)"[^>]*>([\s\S]*?)<\/font>/gi,
        '[size=$1]$2[/size]'
    );

    // 处理对齐 [align]
    bbcode = bbcode.replace(
        /<div[^>]*align="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi,
        '[align=$1]$2[/align]'
    );

    // 处理媒体标签 [media]
    bbcode = bbcode.replace(
        /<ignore_js_op>[\s\S]*?<iframe[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/ignore_js_op>/gi,
        '[media=x,500,375]$1[/media]'
    );

    // 处理表格标签
    bbcode = bbcode.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, '[td]$1[/td]');
    bbcode = bbcode.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, '[tr]$1[/tr]');
    bbcode = bbcode.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, '[table]$1[/table]');

    // 处理列表标签 [list]
    bbcode = bbcode.replace(
        /<ul[^>]*type="([^"]+)"[^>]*class="([^"]+)"[^>]*>([\s\S]*?)<\/ul>/gi,
        (_, type, cls, content) => {
            const listContent = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '[*]$1');
            return `[list=${type}]${listContent}[/list]`;
        }
    );
    bbcode = bbcode.replace(
        /<ul[^>]*>([\s\S]*?)<\/ul>/gi,
        (_, content) => {
            const listContent = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '[*]$1');
            return `[list]${listContent}[/list]`;
        }
    );

    // 处理水平线 [hr]
    bbcode = bbcode.replace(/<hr[^>]*class="l"[^>]*>/gi, '[hr]');

    // 处理HTML实体
    const htmlEntities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#32;': ' ',
        '&#160;': ' ',
        '&#xa0;': ' '
    };
    Object.entries(htmlEntities).forEach(([entity, char]) => {
        bbcode = bbcode.replace(new RegExp(entity, 'gi'), char);
    });
    bbcode = bbcode.replace(/&#(\d+);/gi, (_, code) => String.fromCharCode(code));
    bbcode = bbcode.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // 处理换行
    bbcode = bbcode.replace(/<br[^>]*>/gi, '\n');

    // 清理非代码块部分的HTML标签（只匹配真正的HTML标签）
    bbcode = bbcode.replace(/<[a-zA-Z][^>]*>/gi, '')
        .replace(/<\/[a-zA-Z][^>]*>/gi, '');

    // -------------------------- 3. 还原代码块（替换占位符）
    codeBlocks.forEach((code, index) => {
        bbcode = bbcode.replace(`__CODE_BLOCK_${index}__`, code);
    });

    // -------------------------- 4. 最终格式整理
    return bbcode
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '');
}

function previewDia(text) {
    // HTML转义函数，将特殊字符转换为实体
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 创建遮罩层
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999';

    // 构建弹窗HTML，使用转义后的文本
    mask.innerHTML = `
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.15);z-index:10000;width:80%;max-height:70%;min-height:200px;box-sizing:border-box;display:flex;flex-direction:column;">
  <span style="position:absolute;top:10px;right:15px;font-size:18px;cursor:pointer;color:#999" id="closeBtn">×</span>
  <label style="display:block;margin:10px 0 8px;font-size:16px;font-weight:bold;color:#333">ubb代码预览：</label>
  <!-- 使用转义后的文本 -->
  <div style="width:100%;overflow-y:auto;min-height:50px;white-space:pre-wrap;word-wrap:break-word;flex:1;" id="previewContent">${escapeHtml(text)}</div>
  <div style="margin-top:10px;text-align:right;">
    <button style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;margin-right:5px" id="cancelBtn">取消</button>
    <button style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer" id="copyBtn">复制</button>
  </div>
</div>
`;

    // 添加到页面
    document.body.appendChild(mask);

    // 获取元素
    const dialog = mask.querySelector('div');
    const closeBtn = mask.querySelector('#closeBtn');
    const cancelBtn = mask.querySelector('#cancelBtn');
    const copyBtn = mask.querySelector('#copyBtn');

    // 关闭函数
    const close = () => mask.remove();

    // 绑定关闭事件
    [mask, closeBtn, cancelBtn].forEach(el => el.addEventListener('click', close));

    // 阻止对话框内部点击事件冒泡
    dialog.addEventListener('click', e => e.stopPropagation());

    // 复制功能及alert反馈（保持复制原始文本）
    copyBtn.addEventListener('click', () => {
        let success = false;
        navigator.clipboard.writeText(text)
            .then(() => {
                success = true;
            })
            .catch(err => {
                success = copyText(text)
            })
            .finally(() => {
                if (success) {
                    alert('复制成功！');
                } else {
                    prompt('复制失败，请手动复制:', text);
                }
                close();
            })
    });
}


function copyText(text) {
    // 创建临时文本框
    const textarea = document.createElement('textarea');

    // 隐藏文本框（不影响页面布局）
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.readOnly = true; // 防止编辑

    // 处理文本（替换非换行空格）
    text = text.replace(/\xA0/g, ' ');
    textarea.value = text;

    // 添加到页面并选中内容
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length); // 兼容移动设备

    let success = false;
    try {
        // 执行复制命令
        success = document.execCommand('copy');
    } catch (e) {
        success = false;
    }

    // 清理临时元素
    document.body.removeChild(textarea);
    return success;
}

