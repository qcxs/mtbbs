// ==UserScript==
// @name         [MT论坛]消息提醒预览 by：青春向上
// @namespace    https://github.com/qcxs/mtbbs
// @version      2026-05-01
// @description  显示消息预览，短消息快速查看，避免“不看担心错过消息，看了发现是水回复”
// @author       青春向上
// @match        https://bbs.binmt.cc/home.php?mod=space&do=notice&view=mypost*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // 配置项
    const noticeSelector = '.comiis_notice_list>ul';
    const itemSelector = `${noticeSelector}>li`;
    const selectContent = 'div.comiis_messages.comiis_aimg_show.cl';
    const MAX_CACHE_COUNT = 50; // 最大缓存数量（超过自动删除最老的）
    const MAX_LENGTH = 100; // 最大显示字数
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

        const showContent = truncateText(content, MAX_LENGTH);
        insertContentToLi(li, showContent);
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

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = root;
            const contentElement = tempDiv.querySelector(selectContent);
            tempDiv.remove();

            const content = contentElement?.textContent.trim() || '';
            if (!content) throw new Error('内容为空');
            return content;

        } catch (e) {
            return `[获取失败：${e.message}]`;
        }
    }

    /**
     * 文本截断
     */
    function truncateText(text, maxLen) {
        if (!text) return '';
        return text.length <= maxLen ? text : '...' + text.slice(text.length - maxLen, text.length);
    }

    /**
     * 插入预览内容
     */
    function insertContentToLi(li, content) {
        const span = document.createElement('span');
        span.textContent = `${content}`;
        li.appendChild(span);
    }

    // ====================== 全新统一缓存管理（单key + 数量限制）======================
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