// ==UserScript==
// @name         [MT论坛]帖子评论 - 自动下一页
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  滚动仅触发加载，加载成功后判断是否全部加载，精准提取tid；优化地址栏无刷新更新（滑过页码才更新）+ 禁用滚动记忆
// @author       qcxs
// @match        *://bbs.binmt.cc/forum.php?*tid=*
// @match        *://bbs.binmt.cc/*thread-*.html
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const $ = window.jQuery;
    const tid = window.tid || extractTidFromUrl();
    let currentPage = 1;
    let totalPage = 0;
    let isLoading = false;
    let isFailed = false;
    const loadThreshold = 500;
    const DUMP_PAGE_SELECTOR = '#dumppage';
    const POST_LIST_SELECTOR = '.comiis_postlist, #postlist';
    let isAllLoaded = false;
    // 节流函数+已监听元素缓存（核心新增）
    const observedMarkers = new Set();

    // 提取tid（适配两种URL格式）
    function extractTidFromUrl() {
        const url = new URL(window.location.href);
        let tid = '';
        const tidParam = url.searchParams.get('tid');
        if (tidParam) {
            tid = tidParam.trim();
        } else {
            const pathname = url.pathname;
            const threadSegments = pathname.split('-');
            if (threadSegments.length >= 3 && threadSegments[0].endsWith('thread')) {
                tid = threadSegments[1].trim();
            }
        }
        tid = tid.replace(/[^\d]/g, '');
        console.log(`提取tid：${tid || '未找到'}`);
        return tid;
    }

    // 构造跳转URL（统一修改page参数，保留所有原有参数）
    function buildJumpUrl(targetPage) {
        const url = new URL(window.location.href);
        if (url.pathname.includes('thread-')) {
            const segments = url.pathname.split('-');
            if (segments.length >= 3) {
                segments[2] = targetPage;
                url.pathname = segments.join('-');
            }
        } else {
            url.searchParams.set('page', targetPage);
        }
        url.searchParams.delete('inajax');
        return url.toString();
    }

    function getPageInfo() {
        const $select = $(DUMP_PAGE_SELECTOR);
        if (!$select.length) {
            return false;
        }
        totalPage = $select.find('option').length;
        const urlPage = new URL(window.location.href).searchParams.get('page');
        currentPage = urlPage ? parseInt(urlPage.trim()) : parseInt($select.find('option:selected').val()) || 1;
        totalPage = Math.max(totalPage, 1);
        currentPage = Math.max(1, Math.min(currentPage, totalPage));
        console.log(`分页：第${currentPage}/${totalPage}页`);
        return true;
    }

    function addPageMarker(pageNum, isLoadingState = false, isFailedState = false) {
        const $postList = $(POST_LIST_SELECTOR).first();
        if (!$postList.length) return;

        let markerText = '';
        if (isLoadingState) {
            markerText = `<div style="text-align:center; margin:10px 0;">第${pageNum}页/共${totalPage}页 加载中...</div>`;
        } else if (isFailedState) {
            markerText = `<div class="retry-marker" style="text-align:center; margin:10px 0; color:red;">
            第${pageNum}页/共${totalPage}页 加载失败 <a href="javascript:;" style="color:#007bff; cursor:pointer; margin-left:5px;">点击重试</a>
        </div>`;
        } else {
            markerText = `<div style="text-align:center; margin:10px 0;">
            <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${pageNum}页</span>/共${totalPage}页
        </div>`;
        }

        $postList.append($(markerText));
        if (isFailedState) {
            $('.retry-marker a').click(function () {
                $(this).closest('.retry-marker').remove();
                isFailed = false;
                loadNextPage();
            });
        }
    }

    function loadNextPage() {
        if (isLoading || currentPage >= totalPage || isFailed || isAllLoaded) {
            return;
        }

        isLoading = true;
        const nextPage = currentPage + 1;
        addPageMarker(nextPage, true);
        let requestUrl = `https://bbs.binmt.cc/forum.php?mod=viewthread&tid=${tid}&page=${nextPage}&inajax=1`;

        $.ajax({
            type: 'GET',
            url: requestUrl,
            dataType: requestUrl.includes('inajax=1') ? 'xml' : 'html',
            timeout: 3000
        }).done(function (response) {
            let htmlContent = '';
            if (requestUrl.includes('inajax=1')) {
                htmlContent = $(response).find('root').text() || response.lastChild?.firstChild?.nodeValue || '';
            } else {
                htmlContent = $(response).find(POST_LIST_SELECTOR).html() || '';
            }

            if (!htmlContent) throw new Error('无有效内容');

            const $postList = $(POST_LIST_SELECTOR).first();
            $postList.find(`div:contains("第${nextPage}页/共${totalPage}页 加载中...")`).remove();
            addPageMarker(nextPage);
            $postList.append(htmlContent);

            currentPage = nextPage;
            console.log(`加载成功：第${currentPage}/${totalPage}页`);

            if (currentPage >= totalPage && !isAllLoaded) {
                const $finalMarker = $(`<div style="text-align:center; margin:10px 0;">已加载全部（共${totalPage}页）</div>`);
                $postList.append($finalMarker);
                isAllLoaded = true;
                console.log('已加载全部页面');
            }

            if (window.popup?.init) window.popup.init();

            //监听新增标签，当显示在网页时，代码上一页已阅读完毕
            (function () {
                const $markers = $('.page-jump-link').closest('div'); // 有的是div，有的时li
                if (!$markers.length) return;

                $markers.each(function () {
                    const dom = this;

                    if (!observedMarkers.has(dom)) {
                        observedMarkers.add(dom);

                        //是当前页第一个元素，表示之前没有内容，故无已阅读之说，跳过
                        if ($(dom).is(':first-child')) return;
                        observer.observe(dom);
                    }
                });
            })()

        }).fail(function () {
            console.error(`加载失败：第${nextPage}页`);
            const $postList = $(POST_LIST_SELECTOR).first();
            $postList.find(`div:contains("第${nextPage}页/共${totalPage}页 加载中...")`).remove();
            addPageMarker(nextPage, false, true);
            isFailed = true;
        }).always(function () {
            isLoading = false;
        });
    }

    function initScrollListener() {
        $(window).scroll(function () {
            if (isFailed || isLoading || currentPage >= totalPage || isAllLoaded) {
                return;
            }

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const docHeight = $(document).height();

            if (docHeight - (scrollTop + windowHeight) <= loadThreshold) {
                loadNextPage();
            }
        });
    }

    // 创建观察者实例（核心修改）
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const { target, isIntersecting } = entry;
            const markerText = target.textContent?.trim();
            const pageMatch = markerText.match(/第(\d+)页/);

            if (!pageMatch || !isIntersecting) return;

            // 已阅读完上一页，页码-1
            const pageNum = parseInt(pageMatch[1]) - 1;
            // 过滤无效页码（小于1或大于当前已加载页）
            if (pageNum < 1 || pageNum > currentPage) return;

            const newUrl = buildJumpUrl(pageNum);
            if (window.location.href !== newUrl) {
                console.log('已阅读' + pageNum);
                window.history.replaceState({}, document.title, newUrl);
            }
        });
    }, {
        threshold: 0.8 // 元素显示80%触发
    });

    function initCurrentPageMarker() {
        const $postList = $(POST_LIST_SELECTOR).first();
        if (!$postList.length || currentPage == 1) return;
        const $currentMarker = $(`<div style="text-align:center; margin:0 0 10px 0;">
        <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${currentPage}页</span>/共${totalPage}页
    </div>`);
        $postList.prepend($currentMarker);
    }

    function init() {
        setTimeout(() => {
            if (!tid || !getPageInfo()) {
                console.log('tid缺失，或无下一页。');
                return;
            }

            $(DUMP_PAGE_SELECTOR).closest('.comiis_page').css('display', 'none');
            initCurrentPageMarker();

            // 绑定页码跳转事件
            $(document).off('click', '.page-jump-link').on('click', '.page-jump-link', function () {
                const inputPage = prompt(`请输入要跳转的页码（1-${totalPage}）：`, currentPage);
                if (!inputPage) return;
                const targetPage = parseInt(inputPage.trim());
                if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPage) {
                    alert(`请输入1-${totalPage}之间的有效数字！`);
                    return;
                }
                const targetUrl = buildJumpUrl(targetPage);
                window.location.href = targetUrl;
            });

            if (!isAllLoaded) {
                initScrollListener();
                console.log('滚动监听启动，等待滚动加载');
            } else {
                const $finalMarker = $(`<div style="text-align:center; margin:10px 0;">
                <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${currentPage}页</span>/共${totalPage}页 · 已加载全部
            </div>`);
                $(POST_LIST_SELECTOR).first().append($finalMarker);
            }

        }, 300);
    }

    init();
})();