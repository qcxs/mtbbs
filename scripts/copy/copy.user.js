// ==UserScript==
// @name         copy
// @name:zh-CN   [MT论坛]“借鉴一下”
// @namespace    https://github.com/qcxs/mtbbs
// @version      2026-06-15
// @description  利用HTML转BBCode工具类解析论坛内容，支持复制、借鉴、分享。
// @author       青春向上
// @match        *://bbs.binmt.cc/forum.php?*tid=*
// @match        *://bbs.binmt.cc/*thread-*.html*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/qcxs/mtbbs@master/require/Html2BBCode.js
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    let isLoading = false;
    const tid = getTidByUrl();
    if (!tid) return;
    const url = new URL(location.href);
    // 协议 + 域名 + 端口（完整根地址）
    const origin = url.origin;

    const selectContent = 'div.comiis_messages.comiis_aimg_show.cl';

    function getTidByUrl() {
        const url = new URL(window.location.href);
        const regex = /thread-(\d+)-/;
        const match = url.pathname.match(regex);
        return url.searchParams.get('tid') || (match ? match[1] : null);
    }

    // 复制代码块
    (function () {
        const style = document.createElement('style');
        style.textContent = `
        .comiis_blockcode { position: relative !important; pointer-events: auto !important; }
        .comiis_blockcode::before {
            content: "复制";
            position: absolute !important; right: 10px !important; top: 1em !important;
            transform: translateY(-50%) !important; color: #42b983 !important;
            font-size: 14px !important; font-weight: bold !important; pointer-events: auto !important;
        }
    `;
        document.head.appendChild(style);

        document.addEventListener('click', (e) => {
            const codeBlock = e.target.closest('.comiis_blockcode');
            if (!codeBlock) return;
            const codeText = codeBlock.textContent.trim();
            previewDia(codeText);
        });
    })();

    // 处理元素：添加借鉴、share按钮
    function processElement(div) {
        try {
            const h2Element = div.querySelector('div.comiis_postli_top.bg_f h2');
            // 不包含h2的元素不是评论，跳过
            if (!h2Element) return;
            const pid = div.id.match(/\d+/)[0];

            if (!h2Element.querySelector('span[data-action="reference"]')) {
                const span = document.createElement('span');
                span.dataset.action = "reference";
                span.textContent = ' [借鉴一下]';
                span.style.cursor = 'pointer';
                span.style.color = '#0066cc';
                span.style.marginLeft = '8px';
                span.style.position = 'relative';
                span.style.zIndex = '1';

                span.addEventListener('click', async () => {
                    const contentElement = div.querySelector(selectContent);
                    if (contentElement) {
                        if (!isLoading) {
                            const contentHtml = await getLatest(pid, contentElement.innerHTML);
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = contentHtml;
                            if (Html2BBCode == null) {
                                alert('核心Html2BBCode未加载，请查看require链接是否正确')
                                return;
                            }
                            const bbcode = Html2BBCode.convert(tempDiv);
                            previewDia(bbcode, null, 'ubb代码预览：');
                        }
                    }
                });
                h2Element.appendChild(span);
            }

            const timesElement = div.querySelector('div.comiis_postli_times.bg_f');
            if (timesElement) {
                const bottomZhanSpan = timesElement.querySelector('span.bottom_zhan.y');
                if (bottomZhanSpan && !timesElement.querySelector('span[data-action="share"]')) {
                    const shareSpan = document.createElement('span');
                    shareSpan.dataset.action = "share";
                    shareSpan.className = 'y';
                    shareSpan.textContent = 'share';
                    shareSpan.style.marginLeft = '8px';
                    shareSpan.addEventListener('click', () => {
                        const link = `${origin}/forum.php?mod=redirect&goto=findpost&ptid=${tid}&pid=${pid}`;
                        previewDia(link);
                    });
                    bottomZhanSpan.parentNode.insertBefore(shareSpan, bottomZhanSpan.nextSibling);
                }
            }
        } catch (error) {
            console.error('处理元素错误:', error);
        }
    }

    // 目标元素
    const targetSelector = document.querySelector('.comiis_postlist.kqide');
    // 1、为网页已有内容添加按钮
    Array.from(targetSelector.children).forEach(el => {
        processElement(el);
    });
    // 2、为网页新增内容添加按钮
    const observer = new MutationObserver(mutations => {
        const processedElements = new WeakSet();
        // 遍历新增节点
        mutations.forEach(mut => {
            mut.addedNodes.forEach(el => {
                if (el.nodeType !== 1) return; // 只取元素节点
                if (!processedElements.has(el)) {
                    processElement(el);
                    processedElements.add(el);
                }
            })
        })
    });
    // 监听自动下一页新增的评论：只监听子节点
    observer.observe(targetSelector, { childList: true });

    // 异步获取最新内容
    async function getLatest(pid, html) {
        isLoading = true;
        try {
            const response = await fetch(`${origin}/forum.php?mod=viewthread&tid=${tid}&viewpid=${pid}&mobile=2&inajax=1`, {
                method: 'GET',
                timeout: 3000
            });
            if (!response.ok) throw new Error('请求失败');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            if (xmlDoc.querySelector('parsererror')) throw new Error('XML解析失败');
            const root = xmlDoc.lastChild?.firstChild?.nodeValue;
            if (!root) throw new Error('数据为空');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = root;
            const content = tempDiv.querySelector(selectContent)?.innerHTML || '';
            tempDiv.remove();
            return content || html;
        } catch (e) {
            console.log(e.message);
            return html;
        } finally {
            isLoading = false;
        }
    }

    // 预览弹窗
    function previewDia(text, callback, title) {
        if (typeof text === 'object') text = JSON.stringify(text)
        function escapeHtml(unsafe) {
            return unsafe ? unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : '';
        }

        const mask = document.createElement('div');
        mask.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10002';
        mask.onclick = () => mask.remove();
        const isInputMode = typeof callback === 'function';

        mask.innerHTML = `
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.15);z-index:10000;width:80%;max-height:70%;min-height:200px;box-sizing:border-box;display:flex;flex-direction:column;">
  <span style="position:absolute;top:10px;right:15px;font-size:18px;cursor:pointer;color:#999" onclick="this.closest('div').parentNode.remove()">×</span>
  <label style="display:block;margin:10px 0 8px;font-size:16px;font-weight:bold;color:#333">${title ? title : '预览：'}</label>
  <div id="contentArea" style="overflow-y:auto;min-height:80px;white-space:pre-wrap;word-wrap:break-word;flex:1;${isInputMode ? 'user-modify: read-write; -webkit-user-modify: read-write; outline: none; cursor: text;' : ''}">${escapeHtml(text)}</div>
  <div style="margin-top:10px;text-align:right;">
    <button style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;margin-right:5px" onclick="this.closest('div').parentNode.parentNode.remove()">取消</button>
    <button id="actionBtn" style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer">${isInputMode ? '确定' : '复制'}</button>
  </div>
</div>
`;
        document.body.appendChild(mask);

        const contentArea = mask.querySelector('#contentArea');
        const actionBtn = mask.querySelector('#actionBtn');
        mask.querySelector('div').addEventListener('click', e => e.stopPropagation());

        actionBtn.addEventListener('click', () => {
            if (isInputMode) {
                callback(contentArea.textContent);
            } else {
                copyText(text);
            }
            mask.remove();
        });
    }

    // 复制文本
    function copyText(text) {
        const textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.readOnly = true;
        textarea.value = text.replace(/\xA0/g, ' ');
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (e) { }
        document.body.removeChild(textarea);
        return success;
    }

})();