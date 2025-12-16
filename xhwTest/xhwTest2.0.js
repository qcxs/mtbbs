// ==UserScript==
// @name         [MT论坛]手机版小黑屋 by：青春向上
// @namespace    http://tampermonkey.net/
// @version      2025-12-10
// @description  移动端的小黑屋，在网页侧边栏添加打开按钮
// @author       青春向上
// @match        *://bbs.binmt.cc/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    function xhw() {
        // 配置参数
        const API_URL = 'forum.php?mod=misc&action=showdarkroom&cid=';
        const AVATAR_API = 'uc_server/avatar.php?uid=';
        const SPACE_URL = 'home.php?mod=space&uid=';
        let currentCid = ''; // 接口分页标识
        let totalLoadedPages = 1; // 已加载的总页数
        let isLoading = false;
        let isFiltering = false;
        let isFailed = false;
        let allData = []; // 所有页数据
        let pageDataMap = new Map(); // 页数据映射：pageNum -> {items, cid}

        // 创建遮罩层
        const mask = document.createElement('div');
        mask.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.3); z-index: 9998;
        `;
        document.body.append(mask);

        // 直接构建完整弹窗布局（移除初始加载中）
        mask.innerHTML = `
            <div style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                width: 550px; max-width: 90%; max-height: 80vh; background: #fff;
                border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                z-index: 9999; display: flex; flex-direction: column;
            ">
                <!-- 标题栏 -->
                <div style="padding:8px 16px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="text-align:center; font-weight:bold;font-size:20px; flex-grow:1">小黑屋名单</h3>
                    <span style="font-size:32px; margin-left:16px; cursor:pointer">×</span>
                </div>

                <!-- 过滤框 -->
                <div style="padding: 8px 16px;">
                    <input type="text" placeholder="过滤用户名/UID" style="width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;border-radius:4px;font-size:14px">
                </div>

                <!-- 列表容器 -->
                <div id="xhw-list-container" style="flex-grow:1; overflow-y:auto; padding:16px;"></div>

                <!-- 按钮栏 -->
                <div style="padding:8px 16px; border-top:1px solid #eee; display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="xhw-prev-btn" style="padding:6px 12px;background:white;color:#1890ff;border:1px solid #1890ff;border-radius:4px;font-size:14px;">上一页</button>
                    <button id="xhw-next-btn" style="padding:6px 12px;background:white;color:#1890ff;border:1px solid #1890ff;border-radius:4px;font-size:14px;">下一页</button>
                    <button id="xhw-close-btn" style="padding:6px 12px;background:white;color:#1890ff;border:1px solid #1890ff;border-radius:4px;font-size:14px">关闭</button>
                </div>
            </div>
        `;

        // 获取DOM元素
        const closeIcon = mask.querySelector('span');
        const filterInput = mask.querySelector('input');
        const listContainer = mask.querySelector('#xhw-list-container');
        const prevBtn = mask.querySelector('#xhw-prev-btn');
        const nextBtn = mask.querySelector('#xhw-next-btn');
        const closeBtn = mask.querySelector('#xhw-close-btn');

        // 关闭事件
        closeIcon.addEventListener('click', () => mask.remove());
        closeBtn.addEventListener('click', () => mask.remove());

        // 统一加载状态处理函数
        function updatePageStatus(pageNum, status, cid = '') {
            // 查找或创建页码标识元素
            let pageFlagEl = Array.from(listContainer.querySelectorAll('.xhw-page-flag')).find(el =>
                el.textContent.includes(`第${pageNum}页`)
            );

            if (!pageFlagEl) {
                pageFlagEl = document.createElement('div');
                pageFlagEl.className = 'xhw-page-flag';
                pageFlagEl.style.cssText = `text-align:center; color:#666; font-size:14px;`;
                listContainer.appendChild(pageFlagEl);
            }

            // 根据状态更新内容
            switch (status) {
                case 'loading':
                    pageFlagEl.innerHTML = `第${pageNum}页 加载中...`;
                    break;
                case 'success':
                    pageFlagEl.innerHTML = `第${pageNum}页`;
                    break;
                case 'finish':
                    pageFlagEl.innerHTML = `第${pageNum}页：已全部加载完毕。`;
                    break;
                case 'error':
                    pageFlagEl.innerHTML = `
                        第${pageNum}页 加载失败
                        <button class="xhw-retry-btn" data-page="${pageNum}" data-cid="${cid}" style="margin-left:8px;padding:2px 8px;background:#ff4d4f;color:white;border:none;border-radius:4px;font-size:12px">重试</button>
                    `;
                    isFailed = true;
                    // 绑定重试事件
                    const retryBtn = pageFlagEl.querySelector('.xhw-retry-btn');
                    retryBtn?.addEventListener('click', (e) => {
                        const targetPage = e.target.dataset.page;
                        const targetCid = e.target.dataset.cid;
                        isFailed = false;
                        loadPage(targetPage, targetCid);
                    });
                    break;
            }

            return pageFlagEl;
        }

        // 核心：加载指定页数据
        async function loadPage(pageNum, cid = '') {
            if (isLoading) return;
            isLoading = true;

            // 更新为加载中状态
            updatePageStatus(pageNum, 'loading');

            try {
                const response = await fetch(`${API_URL}${cid}&ajaxdata=json`);
                if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);

                let text = await response.text();
                // 清理文本增强JSON解析兼容性
                text = text.replace(/^\uFEFF/, '')
                    .replace(/&nbsp;|&quot;|&amp;|&lt;|&gt;|&#039;/g, match => ({
                        '&nbsp;': ' ', '&quot;': '"', '&amp;': '&',
                        '&lt;': '<', '&gt;': '>', '&#039;': "'"
                    }[match]))
                    .replace(/\/\*.*?\*\//g, '')
                    .replace(/[\t\n\r]/g, '');

                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    const fixedText = text.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                    data = JSON.parse(fixedText);
                }

                // 解析数据
                const messageParts = data.message.split('|');
                // 0 代表全部加载完
                const isFinished = messageParts[0] == '0';
                if (isFinished) {
                    updatePageStatus(pageNum, 'finish');
                    listContainer.removeEventListener('scroll', scrollEvent, { passive: true });
                }
                const nextCid = messageParts[1] || '';
                const items = Object.values(data.data).map(item => ({
                    uid: item.uid,
                    status: item.action,
                    expireTime: item.groupexpiry,
                    nickname: item.username,
                    handlerUid: item.operatorid,
                    handlerNickname: item.operator,
                    handlerRemark: item.reason,
                    dateline: item.dateline.replace(/&nbsp;/g, ' '),
                    cid: item.cid
                })).sort((a, b) => b.cid - a.cid);

                // 存储页数据
                pageDataMap.set(pageNum, {
                    items: items,
                    cid: nextCid
                });
                allData = [...allData, ...items];
                currentCid = nextCid;
                totalLoadedPages = Math.max(totalLoadedPages, pageNum);

                // 更新为加载成功状态
                updatePageStatus(pageNum, 'success');

                // 渲染当前页数据
                const pageContentEl = document.createElement('div');
                pageContentEl.style.cssText = `margin-bottom: 16px;`;
                pageContentEl.innerHTML = items.map(item => getListItemHtml(item)).join('');

                // 插入到页码标识之后
                const pageFlagEl = Array.from(listContainer.querySelectorAll('.xhw-page-flag')).find(el =>
                    el.textContent.includes(`第${pageNum}页`)
                );
                if (pageFlagEl) {
                    pageFlagEl.after(pageContentEl);
                }

            } catch (error) {
                console.error('加载失败:', error);
                // 更新为加载失败状态
                updatePageStatus(pageNum, 'error', cid);
            } finally {
                isLoading = false;
            }
        }

        // 渲染列表项HTML
        function getListItemHtml(item) {
            return `
            <div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:12px">
                <div style="display:flex;gap:12px">
                    <a href="${SPACE_URL}${item.uid}" target="_blank">
                        <img src="${AVATAR_API}${item.uid}&size=middle" 
                             onerror="this.src='${AVATAR_API}&size=middle'"
                             style="width:40px;height:40px;border-radius:50%;object-fit:cover">
                    </a>
                    <div>
                        <div style="display:flex;justify-content:space-between">
                            <a href="${SPACE_URL}${item.uid}" target="_blank" style="font-weight:bold">${item.nickname}</a>
                            <span style="font-size:12px;color:#666">UID: ${item.uid}</span>
                        </div>
                        <div style="font-size:12px;color:#666;margin:4px 0">${item.dateline}</div>
                        <div style="display:flex;gap:8px;margin-top:6px">
                            <span style="padding:2px 8px;background:${item.expireTime === '永不过期' ? '#ff4d4f' : '#faad14'};color:white;border-radius:4px;font-size:12px">${item.status}</span>
                            <span style="padding:2px 8px;background:#f5f5f5;color:#666;border-radius:4px;font-size:12px">到期: ${item.expireTime}</span>
                        </div>
                    </div>
                </div>
                <div style="background:#f5f5f5;border-radius:6px;padding:8px;margin-top:12px;display:flex;align-items:center;gap:8px">
                    <a href="${SPACE_URL}${item.handlerUid}" target="_blank">
                        <img src="${AVATAR_API}${item.handlerUid}&size=middle" 
                             onerror="this.src='${AVATAR_API}&size=middle'"
                             style="width:30px;height:30px;border-radius:50%;object-fit:cover">
                    </a>
                    <div style="font-size:12px">
                        <a href="${SPACE_URL}${item.handlerUid}" target="_blank">${item.handlerNickname}</a><br>
                        <span style='font-weight: 500;'>${item.handlerRemark}</span>
                    </div>
                </div>
            </div>
            `;
        }

        // 获取当前可视区域内的页码
        function getCurrentVisiblePage() {
            const pageFlags = listContainer.querySelectorAll('.xhw-page-flag');
            let currentPage = 1;
            let minDistance = Infinity;

            pageFlags.forEach(flag => {
                const rect = flag.getBoundingClientRect();
                const containerRect = listContainer.getBoundingClientRect();
                // 计算元素中心到容器中心的距离
                const flagCenter = rect.top + rect.height / 2;
                const containerCenter = containerRect.top + containerRect.height / 2;
                const distance = Math.abs(flagCenter - containerCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    // 提取页码
                    const pageMatch = flag.textContent.match(/第(\d+)页/);
                    if (pageMatch) {
                        currentPage = parseInt(pageMatch[1]);
                    }
                }
            });

            return currentPage;
        }

        // 查找指定方向的最近页码元素
        function findNearestPageElement(direction) {
            const currentPage = getCurrentVisiblePage();
            const targetPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;

            // 查找目标页码元素
            const targetElement = Array.from(listContainer.querySelectorAll('.xhw-page-flag')).find(el =>
                el.textContent.includes(`第${targetPage}页`)
            );

            return { element: targetElement, pageNum: targetPage };
        }

        // 上一页事件
        prevBtn.addEventListener('click', () => {
            if (isFiltering || isLoading) return;

            const { element, pageNum } = findNearestPageElement('prev');
            if (element && pageNum >= 1) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        // 下一页事件
        nextBtn.addEventListener('click', () => {
            if (isFiltering || isLoading) return;

            const { element, pageNum } = findNearestPageElement('next');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // 找不到下一页元素，滚动到底部触发加载
                listContainer.scrollTop = listContainer.scrollHeight;
            }
        });

        // 过滤功能
        filterInput.addEventListener('input', (e) => {
            const filter = e.target.value.toLowerCase();
            isFiltering = !!filter;

            if (filter) {
                const filtered = allData.filter(item =>
                    item.uid.toString().includes(filter) || item.nickname.toLowerCase().includes(filter)
                );
                listContainer.innerHTML = filtered.length ?
                    filtered.map(item => getListItemHtml(item)).join('') :
                    '<div style="text-align:center;padding:30px;color:#999">没有匹配记录</div>';
            } else {
                // 恢复原始分页内容
                listContainer.innerHTML = '';
                isFailed = false;
                pageDataMap.forEach((pageInfo, pageNum) => {
                    // 重建页码标识
                    const pageFlagEl = document.createElement('div');
                    pageFlagEl.className = 'xhw-page-flag';
                    pageFlagEl.style.cssText = `text-align:center; color:#666; font-size:14px;`;
                    pageFlagEl.innerHTML = `第${pageNum}页`;

                    // 重建页内容
                    const pageContentEl = document.createElement('div');
                    pageContentEl.style.cssText = `margin-bottom: 16px;`;
                    pageContentEl.innerHTML = pageInfo.items.map(item => getListItemHtml(item)).join('');

                    listContainer.appendChild(pageFlagEl);
                    listContainer.appendChild(pageContentEl);
                });
            }
        });

        // 修复滚动加载监听器（使用passive优化性能）
        listContainer.addEventListener('scroll', scrollEvent, { passive: true });

        function scrollEvent() {
            if (isLoading || isFiltering || !currentCid || isFailed) return;

            const { scrollTop, clientHeight, scrollHeight } = listContainer;
            // 距离底部200px时加载下一页（调整阈值提高触发率）
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                const nextPage = totalLoadedPages + 1;
                loadPage(nextPage, currentCid);
            }
        }

        // 初始加载第1页
        loadPage(1);
    }

    // 侧边栏添加小黑屋按钮
    const ul = document.querySelector('ul.comiis_left_Touch');
    if (ul) {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="javascript:;" class="comiis_left_Touch">
                <i class="comiis_font" style="color:#ff4d4f;"></i>
                小黑屋
            </a>
        `;
        li.addEventListener('click', xhw);
        ul.appendChild(li);
    }

})();