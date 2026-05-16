// ==UserScript==
// @name         [MT论坛]消息提醒预览
// @namespace    https://github.com/qcxs/mtbbs
// @version      2026-05-16
// @description  消息预览：避免查看回复频繁跳转网页，帖子回复查看：查看当前用户对某帖的回复
// @author       青春向上
// @match        *://bbs.binmt.cc/home.php?mod=space&do=notice&view=mypost*
// @match        *://bbs.binmt.cc/home.php?*type=reply*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @run-at       document-idline
// ==/UserScript==

(async function () {
    'use strict';

    // 全局配置 
    const CONFIG = {
        PROCESSED_MARK: 'mt-preview-processed',        // 已处理标记
        // 消息提醒
        notice: {
            noticeSelector: '.comiis_notice_list>ul',       // 消息列表外层容器选择器
            selectContent: 'div.comiis_messages',          // 消息内容DOM选择器
            validCheck: 'a.lit[href*="goto=findpost"]',      // li校验选择器
            MAX_CACHE_COUNT: 100,                          // 本地缓存最大保存条数
            CACHE_STORAGE_KEY: 'mt_bbs_preview_cache',     // localStorage 缓存键名
            REQUEST_DELAY: 100                             // 消息请求队列间隔时间（毫秒）
        },
        // 帖子回复查看
        postReply: {
            threadSelector: '.comiis_forumlist>ul',        // 帖子列表选择器
            threadASelector: '.mmlist_li_box a',           // 帖子标题链接选择器
            validCheck: '.mmlist_li_box a',                 // li校验选择器
            loadedMark: 'replyLoaded'                     // 加载状态标记（dataset驼峰命名）
        }
    };

    // 页面判断 
    const urlObj = new URL(window.location.href);
    const searchParams = urlObj.searchParams;
    const phpFile = urlObj.pathname.split('/').pop();
    let pageType = '未知页面'

    // 页面分流执行
    if (phpFile === 'home.php' && searchParams.get('mod') === 'space' && searchParams.get('do') === 'notice') {
        await initNoticePreview();
        pageType = '【消息提醒页】'
    } else if (phpFile === 'home.php' && searchParams.get('mod') === 'space' && searchParams.get('do') === 'thread' && searchParams.get('type') === 'reply') {
        initPostReply();
        pageType = '【帖子回复页】'
    }
    console.log('当前页面类型：', pageType);

    // 通用工具函数
    async function fetchReplyRoot(url, timeout = 3000) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
            if (!res.ok) return '';
            const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
            return xml.querySelector('root')?.textContent || '';
        } catch {
            return '';
        }
    }

    /**
     * 通用列表动态监听
     * @param containerSel 外层容器选择器
     * @param itemSel 要监听新增的子项选择器
     * @param callback 新增元素回调
     */
    function initCommonListObserver(containerSel, itemSel, validCheck, callback) {

        const container = document.querySelector(containerSel);
        if (!container) {
            console.log('监听失败，没有帖子！')
            return;
        }

        // 先初始化已有元素
        document.querySelectorAll(itemSel).forEach(el => {
            if (validCheck(el))
                callback(el)
        });

        // 统一监听逻辑
        const observer = new MutationObserver(muts => {
            muts.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    // 过滤：仅元素节点 + 匹配目标选择器
                    if (node.nodeType === 1 && node.matches(itemSel)) {
                        if (validCheck(node)) callback(node);
                    }
                });
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: false
        });
    }


    // 功能一：消息预览
    async function initNoticePreview() {
        const cfg = CONFIG.notice;

        // 只有发送fetch请求后，才写入list至localstorage，其余情况在内存中执行
        let cacheList = [];
        try {
            const data = localStorage.getItem(cfg.CACHE_STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // 必须是数组才使用，否则清空重建
                if (Array.isArray(parsed)) {
                    cacheList = parsed;
                } else {
                    throw new Error('缓存格式有误，自动重置！')
                }
            }
        } catch (e) {
            console.log('发生错误：',e)
            // 旧版/损坏缓存：清空缓存
            localStorage.removeItem(cfg.CACHE_STORAGE_KEY);
            cacheList = [];
        }

        const requestQueue = [];
        let isQueueRunning = false;

        initCommonListObserver(cfg.noticeSelector, `${cfg.noticeSelector}>li`,
            li => !li.hasAttribute(cfg.PROCESSED_MARK) && li.querySelector(cfg.validCheck),
            li => {
                if (!li.hasAttribute(CONFIG.PROCESSED_MARK)) {
                    processNoticeItem(li);
                }
            });

        function processNoticeItem(li) {
            li.setAttribute(CONFIG.PROCESSED_MARK, 'true');
            const viewLink = li.querySelector(cfg.validCheck);
            if (!viewLink) return;

            const { tid, pid } = getTidPidFromUrl(viewLink.href);
            if (!tid || !pid) return;
            const cacheKey = `${tid}_${pid}`;
            const cacheData = cacheList.find(item => item.key === cacheKey);

            if (cacheData) {
                insertContentToLi(li, cacheData.content, cacheData.replyHref);
            } else {
                requestQueue.push({ li, tid, pid, cacheKey });
                if (!isQueueRunning) runQueue();
            }
        }

        // 请求队列，避免短时间内大量请求，容易封ip
        async function runQueue() {
            if (requestQueue.length === 0) { isQueueRunning = false; return; }
            isQueueRunning = true;
            const task = requestQueue.shift();

            try {
                const url = `https://bbs.binmt.cc/forum.php?mod=viewthread&tid=${task.tid}&viewpid=${task.pid}&mobile=2&inajax=1`;
                const rootHtml = await fetchReplyRoot(url);
                const result = parseContentAndReplyHref(rootHtml);
                insertContentToLi(task.li, result.content, result.replyHref);

                if (result.content && !result.content.includes('失败') && !result.content.includes('[空内容]')) {
                    cacheList = cacheList.filter(item => item.key !== task.cacheKey);
                    cacheList.unshift({ key: task.cacheKey, ...result, time: Date.now() });
                    if (cacheList.length > cfg.MAX_CACHE_COUNT) cacheList = cacheList.slice(0, cfg.MAX_CACHE_COUNT);
                    localStorage.setItem(cfg.CACHE_STORAGE_KEY, JSON.stringify(cacheList));
                }
            } catch (e) {
                insertContentToLi(task.li, '[加载失败]', '');
            } finally {
                setTimeout(runQueue, cfg.REQUEST_DELAY);
            }
        }

        function getTidPidFromUrl(url) {
            const p = new URLSearchParams(url);
            return { tid: p.get('ptid'), pid: p.get('pid') };
        }

        // 解析回复内容、回复评论链接
        function parseContentAndReplyHref(rootHtml) {
            try {
                if (!rootHtml) return { content: '[获取失败]', replyHref: '' };
                const div = document.createElement('div');
                div.innerHTML = rootHtml;
                const content = div.querySelector(cfg.selectContent)?.innerHTML?.trim() || '[空内容]';
                const replyHref = div.querySelector('a[href*="action=reply"]')?.href || '';
                div.remove();
                return { content, replyHref };
            } catch { return { content: '[解析失败]', replyHref: '' }; }
        }

        // 插入预览内容
        function insertContentToLi(li, html, replyHref) {
            const box = document.createElement('div');
            box.style.width = '100%';
            li.appendChild(box);
            const root = box.attachShadow({ mode: 'open' });
            root.innerHTML = `
                <style>.comiis_postli img[smilieid]{max-height:22px;margin:1px;vertical-align:top;}</style>
                <link rel="stylesheet" href="https://cdn-bbs.mt2.cn/template/comiis_app/comiis/css/comiis.css">
                <link rel="stylesheet" href="https://bbs.binmt.cc/source/plugin/comiis_app/cache/comiis_1_style.css">
                <div class="comiis_postli"><div class="comiis_messages"><div class="comiis_a">${html}</div></div></div>`;

            if (replyHref) {
                const btn = document.createElement('span');
                btn.textContent = '回复';
                btn.style.cssText = 'float:right;color:#53bcf5;margin-right:20px;cursor:pointer';
                btn.onclick = e => { e.stopPropagation(); window.open(replyHref, '_blank'); };
                li.querySelector('h2')?.appendChild(btn);
            }
        }
    }

    // 功能二：帖子回复页 - 点击查看楼主回复
    function initPostReply() {
        const cfg = CONFIG.postReply;

        // 初始化+动态新增li自动加按钮
        initCommonListObserver(cfg.threadSelector, `${cfg.threadSelector}>li`,
            li => !li.hasAttribute(cfg.PROCESSED_MARK) && li.querySelector(cfg.validCheck),
            li => { createCheckReplyButton(li); });

        // 为单个 li 创建按钮
        function createCheckReplyButton(li) {
            li.setAttribute(CONFIG.PROCESSED_MARK, 'true');

            // 为每个帖子添加按钮
            const btn = document.createElement('span');
            btn.textContent = '查看回复';
            btn.style.cssText = `
                display: block;
                width: 100%;
                text-align: center;
                padding: 6px 0;
                color:#53bcf5;
                background: #f7f8fa;
                border-radius: 4px;
                font-size: 14px;
            `;

            // 点击加载
            btn.onclick = async () => {
                // 防重复请求核心 
                if (li.dataset[cfg.loadedMark]) return;
                li.dataset[cfg.loadedMark] = "true";

                // 清除旧数据 
                li.dataset.replyLoaded = '';
                btn.textContent = '加载中...';
                li.querySelectorAll('div[id^="pid"]').forEach(el => el.remove());

                try {
                    // 提取当前帖子信息
                    const threadA = li.querySelector(cfg.threadASelector);
                    if (!threadA) throw new Error('获取帖子信息失败');

                    const tid = threadA.href.match(/thread-(\d+)-/)?.[1];
                    const authorid = searchParams.get('uid') || window.discuz_uid; // 别人uid、自己uid
                    if (!tid || !authorid) throw new Error('tid/uid 获取失败');

                    // 请求数据
                    const apiUrl = `https://bbs.binmt.cc/forum.php?mod=viewthread&tid=${tid}&page=1&authorid=${authorid}&inajax=1`;
                    const rootHtml = await fetchReplyRoot(apiUrl);
                    const pidElements = parseAllPidElements(rootHtml);

                    // 插入新数据
                    if (pidElements.length) {
                        pidElements.forEach(el => li.appendChild(el));
                        btn.textContent = `刷新回复 (${pidElements.length}条)`; // 成功 → 刷新
                    } else {
                        btn.textContent = '无回复';
                    }

                } catch (err) {
                    // 失败 → 重试
                    btn.textContent = '重试';
                    console.warn('加载异常', err);
                } finally {
                    li.dataset[cfg.loadedMark] = "";
                }
            };
            li.appendChild(btn);
        }

        function parseAllPidElements(rootHtml) {
            if (!rootHtml) throw new Error('获取回复数据失败');
            const div = document.createElement('div');
            div.innerHTML = rootHtml;
            return Array.from(div.querySelectorAll('div[id^="pid"]'));
        }
    }
})();