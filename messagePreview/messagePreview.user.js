// ==UserScript==
// @name         [MT论坛]消息提醒预览
// @namespace    https://github.com/qcxs/mtbbs
// @version      2026-05-14
// @description  显示消息预览，短消息快速查看，避免“不看担心错过消息，看了发现是水回复”
// @author       青春向上
// @match        https://bbs.binmt.cc/home.php?mod=space&do=notice&view=mypost*
// @require      https://cdn.jsdelivr.net/gh/qcxs/mtbbs@master/require/Html2BBCode.js
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // 配置项
    const noticeSelector = '.comiis_notice_list>ul';
    const itemSelector = `${noticeSelector}>li`;
    const selectContent = 'div.comiis_messages';
    const MAX_CACHE_COUNT = 50; // 最大缓存数量（超过自动删除最老的）
    const MAX_LENGTH = 100; // 最大显示字数，超过此长度，优先预览
    const PROCESSED_MARK = 'mt-preview-processed'; // 已处理标记
    const CACHE_STORAGE_KEY = 'mt_bbs_preview_cache'; // 统一缓存键

    // 立即执行一次初始化
    processAllNotices();

    // 监听 UL 内部子节点变化（监听 li 新增/删除）
    const ulElement = document.querySelector(noticeSelector);
    if (ulElement) {
        const observer = new MutationObserver((mutations) => {
            processAllNotices();
        });

        observer.observe(ulElement, {
            childList: true,
            subtree: false
        });
    }

    /**
     * 处理所有通知（自动跳过已处理的）
     */
    function processAllNotices() {
        const items = document.querySelectorAll(itemSelector);
        items.forEach(li => {
            if (li.hasAttribute(PROCESSED_MARK)) return;
            processNoticeItem(li);
        });
    }

    /**
     * 处理单条通知
     * @param {HTMLElement} li
     */
    async function processNoticeItem(li) {
        li.setAttribute(PROCESSED_MARK, 'true');

        const viewLink = li.querySelector('a.lit[href*="goto=findpost"]');
        if (!viewLink) return;

        const { tid, pid } = getTidPidFromUrl(viewLink.href);
        if (!tid || !pid) return;

        const cacheKey = `${tid}_${pid}`;
        let content = getCache(cacheKey);

        if (!content) {
            content = await fetchReplyContent(tid, pid);
            if (content && !content.includes('失败')) {
                setCache(cacheKey, content);
            }
        }

        insertContentToLi(li, content);
    }

    /**
     * 从链接提取 tid、pid
     */
    function getTidPidFromUrl(url) {
        const params = new URLSearchParams(url);
        return {
            tid: params.get('ptid'),
            pid: params.get('pid')
        };
    }

    /**
     * 获取回复内容
     */
    async function fetchReplyContent(tid, pid) {
        try {
            const response = await fetch(
                `https://bbs.binmt.cc/forum.php?mod=viewthread&tid=${tid}&viewpid=${pid}&mobile=2&inajax=1`,
                { signal: AbortSignal.timeout(5000) }
            );

            if (!response.ok) throw new Error('网络请求失败');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            if (xmlDoc.querySelector('parsererror')) throw new Error('XML解析失败');
            const root = xmlDoc.lastChild?.firstChild?.nodeValue;
            if (!root) throw new Error('数据格式错误');

            // 判断是不是回复，避免执行script
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = root;
            const contentElement = tempDiv.querySelector(selectContent);
            tempDiv.remove();

            const content = contentElement?.innerHTML || '';
            if (!content) throw new Error('内容为空');

            return content;

        } catch (e) {
            return `[获取失败：${e.message}]`;
        }
    }

    // 插入预览内容
    function insertContentToLi(li, html) {
        if (window.Html2BBCode == null) {
            alert('核心Html2BBCode未加载，请查看require链接是否正确')
            return;
        }
        const bbcode = Html2BBCode.convert(html);

        // 默认：显示 bbcode，隐藏 iframe
        // BBCode
        const span = document.createElement('span');
        span.textContent = `${bbcode}`;
        li.appendChild(span);

        // Html
        const iframe = document.createElement('iframe');
        // 占满父元素 + 无边框
        iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: none; 
    `;
        li.appendChild(iframe);
        // 渲染iframe
        Html2BBCode.renderIframe(iframe, html);

        // 切换显示按钮
        const spanButton = document.createElement('span');
        spanButton.textContent = `预览`;
        spanButton.style.cssText = `
        float: right;
        color: #53bcf5 !important;
        padding-right: 20px;
        cursor: pointer;
    `;

        // 核心：切换逻辑
        let isPreview = false; // 标记当前是否是预览模式

        function toggleView() {
            isPreview = !isPreview; // 取反

            if (isPreview) {
                span.style.display = 'none';   // 隐藏 BBCode
                iframe.style.display = 'block'; // 显示预览
                spanButton.textContent = 'bbcode';
            } else {
                span.style.display = 'block';  // 显示 BBCode
                iframe.style.display = 'none'; // 隐藏预览
                spanButton.textContent = '预览';
            }
        }

        // 绑定点击
        spanButton.onclick = toggleView;
        span.onclick = toggleView;

        // 如果长度>MAX_LENGTH，自动切换到预览
        if (bbcode.length > MAX_LENGTH) {
            toggleView();
        }

        li.querySelector('h2').appendChild(spanButton);
    }




    /**
     * 读取统一缓存数据
     */
    function getCacheData() {
        try {
            const data = localStorage.getItem(CACHE_STORAGE_KEY);
            return data ? JSON.parse(data) : { list: [] };
        } catch {
            return { list: [] };
        }
    }

    /**
     * 保存缓存数据
     */
    function saveCacheData(data) {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * 获取单条缓存
     */
    function getCache(key) {
        const cache = getCacheData();
        const item = cache.list.find(i => i.key === key);
        return item ? item.content : null;
    }

    /**
     * 设置单条缓存（超过最大数量删除最老的）
     */
    function setCache(key, content) {
        const cache = getCacheData();

        // 已存在则更新时间
        const existIndex = cache.list.findIndex(i => i.key === key);
        if (existIndex > -1) {
            cache.list.splice(existIndex, 1);
        }

        // 加入最新数据
        cache.list.unshift({
            key,
            content,
            time: Date.now()
        });

        // 超过最大数量，删除最老的
        if (cache.list.length > MAX_CACHE_COUNT) {
            cache.list.pop();
        }

        saveCacheData(cache);
    }

})();