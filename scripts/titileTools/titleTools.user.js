// ==UserScript==
// @name         titleTools
// @name:zh-CN   [MT论坛]标题增强
// @namespace    https://github.com/qcxs/mtbbs
// @version      2026-04-30
// @description  在标题上显示是否存在新消息，点击标题有消息则打开消息页面，无则弹出菜单。
// @author       青春向上
// @match        *://bbs.binmt.cc/*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(async function () {
    'use strict';

    // 配置常量
    const FETCH_INTERVAL = 3 * 60 * 1000; // 3分钟
    const STORAGE_KEY = 'mt_bbs_notification_cache';

    // 全局菜单配置，功能项，无url
    const menuItems = [
        { key: '消息' },
        { key: '侧滑栏' },
        { key: '图床', url: 'https://img.binmt.cc' },
        { key: '签到', url: 'https://bbs.binmt.cc/k_misign-sign.html' },
        { key: '我的帖子', url: 'https://bbs.binmt.cc/home.php?mod=space&do=thread&view=me' },
        { key: '我的关注', url: 'https://bbs.binmt.cc/home.php?mod=follow&do=following' },
        { key: '留言板', url: 'https://bbs.binmt.cc/home.php?mod=space&uid=88062&do=wall&view=me&from=space' },
        { key: '导读', url: 'https://bbs.binmt.cc/forum.php?mod=guide&view=newthread&index=1' },
        { key: '积分详情', url: 'https://bbs.binmt.cc/home.php?mod=spacecp&ac=credit&op=log' },
        { key: '搜索', url: 'https://bbs.binmt.cc/search.php?mod=forum' },
        { key: '精华帖', url: 'https://bbs.binmt.cc/forum.php?mod=guide&view=digest&index=1' },
    ];
    // 菜单功能映射
    function handleMenuClick(key) {
        const item = menuItems.find(m => m.key === key);
        if (!item) return;

        if (item.url) {
            window.open(item.url, '_blank');
        } else {
            switch (key) {
                case '消息':
                    openMessagePage();
                    break;
                case '侧滑栏':
                    window.comiis_leftnv();
                    break;
                default:
                    alert(`未定义功能：${key}`);
            }
        }
    }

    // 选择弹窗
    function selectDia(options, callback) {
        const container = document.createElement('div');
        const style = document.createElement('style');
        style.textContent = `
        .select-dialog-hover:hover {
            background: #e6f3ff !important;
        }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
        <div class="mask" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;" onclick="this.parentElement.remove()">
            <div class="dialog" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;border:1px solid #ccc;border-radius:4px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);padding:0;z-index:1000;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #eee;">
                    <span>MT论坛菜单</span>
                    <button style="background:none;border:none;font-size:16px;cursor:pointer;padding:0;line-height:1;" onclick="this.closest('.mask').parentElement.remove()">×</button>
                </div>
                <div style="max-height:50vh;overflow-y:auto;padding:8px 0;scrollbar-width:thin;">
                    <ul style="list-style:none;margin:0;padding:0;">
                        ${options.map((opt, i) => `
                            <li class="select-dialog-hover" style="padding:8px 16px;cursor:pointer;display:flex;align-items:center;${opt.css || ''}" data-value="${opt.value}">
                                <label>${opt.name}</label>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
        `;

        // 阻止弹窗内部点击冒泡
        container.querySelector('.dialog').addEventListener('click', e => e.stopPropagation());

        // 点击列表项立即执行
        container.querySelectorAll('li[data-value]').forEach(li => {
            li.addEventListener('click', () => {
                const value = li.getAttribute('data-value');
                callback(value);
                container.remove();
                document.head.removeChild(style);
            });
        });

        document.body.appendChild(container);
    }

    // 消息功能核心实现
    async function openMessagePage() {
        const defaultUrl = 'https://bbs.binmt.cc/home.php?mod=space&do=notice';
        try {
            const response = await fetch(
                'https://bbs.binmt.cc/home.php?mod=space&do=notice&inajax=1',
                { signal: AbortSignal.timeout(1000) }
            );

            if (!response.ok) throw new Error('请求失败');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const noticeBadges = doc.querySelectorAll('.notice_r');
            if (!noticeBadges.length) {
                window.open(defaultUrl, '_blank');
                return;
            }

            const list = [];
            noticeBadges.forEach(badge => {
                const link = badge.closest('a.kmdbt');
                if (!link) return;

                const clone = link.cloneNode(true);
                clone.querySelectorAll('i,span').forEach(el => el.remove());
                const name = clone.textContent.trim();
                const count = parseInt(badge.textContent.trim() || 0, 10);
                const url = link.href.replace(/&amp;/g, '&');
                list.push({ name, count, url });
            });

            if (!list.length) {
                window.open(defaultUrl, '_blank');
                return;
            }

            const max = list.sort((a, b) => b.count - a.count)[0];
            window.open(max.url, '_blank');

        } catch (e) {
            window.open(defaultUrl, '_blank');
        }
    }

   	// 初始化标题点击事件
	function initTitleMenu() {
		const h2 = document.querySelector('#comiis_head h2');
		if (!h2) return;

		if (!h2.querySelector('.mt-badge-text')) {
			h2.innerHTML = `<span class="mt-badge-text">${h2.innerHTML}</span>`;
		}

		h2.style.cursor = 'pointer';
		h2.addEventListener('click', (e) => {
			// 点到a标签
			if (e.target.closest('a')) {
				e.preventDefault();
				// 不阻止冒泡、不穿透，手动触发h2逻辑
			}

			e.stopPropagation();
			const hasBadge = !!document.querySelector('#comiis_head h2 .mt-notification-badge');
			if (hasBadge) {
				openMessagePage()
                // 清楚红点
                updateMTBadge(0)
			} else {
				const options = menuItems.map(item => ({
					name: item.key,
					value: item.key
				}));
				selectDia(options, (selectedKey) => {
					handleMenuClick(selectedKey);
				});
			}
		});
	}

    // 更新小红点
    function updateMTBadge(count = 0) {
        const oldBadge = document.querySelector('.mt-notification-badge');
        if (oldBadge) oldBadge.remove();

        const target = document.querySelector('.mt-badge-text');
        if (!target) return;
        if (count <= 0) return;

        const badge = document.createElement('span');
        badge.className = 'mt-notification-badge';
        badge.textContent = count;
        Object.assign(badge.style, {
            position: 'absolute',
            top: '-6px',
            right: '-12px',
            minWidth: '16px',
            height: '16px',
            background: '#f43333',
            color: '#fff',
            borderRadius: '50%',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
            fontWeight: 'bold',
            zIndex: 999
        });

        target.style.position = 'relative';
        target.appendChild(badge);
    };

    // 缓存操作
    function getCache() {
        try {
            const cache = localStorage.getItem(STORAGE_KEY);
            return cache ? JSON.parse(cache) : null;
        } catch (e) { return null; }
    }

    function setCache(count) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                count: count,
                time: Date.now()
            }));
        } catch (e) { }
    }

    // 获取通知数
    async function fetchNotificationCount() {
        const cache = getCache();
        if (cache && Date.now() - cache.time < FETCH_INTERVAL) {
            updateMTBadge(cache.count);
            return cache.count;
        }

        let count = 0;
        try {
            const response = await fetch('https://bbs.binmt.cc/home.php?mod=space&do=profile');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            if (html.includes('登录')) throw new Error('需要登录');
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const notificationElement = doc.querySelector('.sidenv_num.bg_del.f_f');
            count = notificationElement ? parseInt(notificationElement.textContent.trim(), 10) : 0;
            count = isNaN(count) ? 0 : count;
        } catch (error) {
            console.error('获取通知失败:', error);
            count = 0;
        } finally {
            setCache(count);
            updateMTBadge(count);
        }
        return count;
    }

    // 页面加载完成后执行
    initTitleMenu();
    fetchNotificationCount();
    setInterval(fetchNotificationCount, FETCH_INTERVAL);

})();