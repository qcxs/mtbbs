// ==UserScript==
// @name         [MT论坛]自动下一页
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  滚动仅触发加载，加载成功后判断是否全部加载，精准提取tid
// @author       qcxs
// @match        *://bbs.binmt.cc/forum.php?mod=viewthread&tid=*
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
    let isAllLoaded = false; // 标记是否已显示全部加载提示

    // 提取tid（适配两种URL格式）
    function extractTidFromUrl() {
        const url = new URL(window.location.href);
        let tid = '';

        // 情况一：从URL参数中获取tid（优先，不用正则）
        const tidParam = url.searchParams.get('tid');
        if (tidParam) {
            tid = tidParam.trim();
        } else {
            // 情况二：从thread-xxx-格式URL中匹配（仅参数不存在时使用）
            const pathname = url.pathname;
            const threadSegments = pathname.split('-');
            // 匹配 thread-xxx-xx-xx.html 格式，取第二个段（索引1）作为tid
            if (threadSegments.length >= 3 && threadSegments[0].endsWith('thread')) {
                tid = threadSegments[1].trim();
            }
        }

        // 确保tid是纯数字（过滤非数字字符，增强容错）
        tid = tid.replace(/[^\d]/g, '');
        console.log(`提取tid：${tid || '未找到'}`);
        return tid;
    }

    function getPageInfo() {
        const $select = $(DUMP_PAGE_SELECTOR);
        if (!$select.length) {
            // console.log('无分页选择器，可能没有评论');
            return false;
        }
        totalPage = $select.find('option').length;
        currentPage = parseInt($select.find('option:selected').val()) || 1;
        // 数据校验
        totalPage = Math.max(totalPage, 1);
        currentPage = Math.max(1, Math.min(currentPage, totalPage));
        console.log(`分页：第${currentPage}/${totalPage}页`);
        return true;
    }

    function hideOriginPager() {
        $(DUMP_PAGE_SELECTOR).closest('.comiis_page').css('display', 'none');
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
            markerText = `<div style="text-align:center; margin:10px 0;">第${pageNum}页/共${totalPage}页</div>`;
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
        // 滚动仅执行加载，不处理全部加载提示（移到加载成功后）
        if (isLoading || currentPage >= totalPage || isFailed || isAllLoaded) {
            return;
        }

        isLoading = true;
        const nextPage = currentPage + 1;
        addPageMarker(nextPage, true); // 显示加载中提示

        // 构造请求URL
        let requestUrl = `https://bbs.binmt.cc/forum.php?mod=viewthread&tid=${tid}&page=${nextPage}&inajax=1`;

        $.ajax({
            type: 'GET',
            url: requestUrl,
            dataType: requestUrl.includes('inajax=1') ? 'xml' : 'html',
            timeout: 3000
        }).done(function (response) {
            let htmlContent = '';
            // 解析响应内容
            if (requestUrl.includes('inajax=1')) {
                htmlContent = $(response).find('root').text() || response.lastChild?.firstChild?.nodeValue || '';
            } else {
                htmlContent = $(response).find(POST_LIST_SELECTOR).html() || '';
            }

            if (!htmlContent) throw new Error('无有效内容');

            const $postList = $(POST_LIST_SELECTOR).first();
            // 删除加载中标识，添加正常分页标识
            $postList.find(`div:contains("第${nextPage}页/共${totalPage}页 加载中...")`).remove();
            addPageMarker(nextPage);
            $postList.append(htmlContent);

            // 更新当前页
            currentPage = nextPage;
            console.log(`加载成功：第${currentPage}/${totalPage}页`);

            // 加载成功后判断是否全部加载（核心调整）
            if (currentPage >= totalPage && !isAllLoaded) {
                const $finalMarker = $(`<div style="text-align:center; margin:10px 0;">已加载全部（共${totalPage}页）</div>`);
                $postList.append($finalMarker);
                isAllLoaded = true; // 标记已显示，避免重复添加
                console.log('已加载全部页面');
            }

            // 初始化新加载内容组件
            if (window.popup?.init) window.popup.init();
        }).fail(function () {
            console.error(`加载失败：第${nextPage}页`);
            const $postList = $(POST_LIST_SELECTOR).first();
            // 删除加载中标识，添加失败标识
            $postList.find(`div:contains("第${nextPage}页/共${totalPage}页 加载中...")`).remove();
            addPageMarker(nextPage, false, true);
            isFailed = true;
        }).always(function () {
            isLoading = false;
        });
    }

    function initScrollListener() {
        $(window).scroll(function () {
            // 滚动仅触发加载，失败时不响应
            if (isFailed || isLoading || currentPage >= totalPage || isAllLoaded) {
                return;
            }

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const docHeight = $(document).height();

            // 满足滚动阈值则加载下一页
            if (docHeight - (scrollTop + windowHeight) <= loadThreshold) {
                loadNextPage();
            }
        });
    }

    function initCurrentPageMarker() {
        const $postList = $(POST_LIST_SELECTOR).first();
        //第一页不显示
        if (!$postList.length || currentPage == 1) return;
        const $currentMarker = $(`<div style="text-align:center; margin:0 0 10px 0;">第${currentPage}页/共${totalPage}页</div>`);
        $postList.prepend($currentMarker);
    }

    function init() {
        setTimeout(() => {
            // 无tid或无分页选择器，脚本终止
            if (!tid || !getPageInfo()) {
                console.log('tid缺失，或无下一页。');
                return;
            }

            hideOriginPager();
            initCurrentPageMarker();

            // 初始页就是最后一页，直接显示全部加载
            if (currentPage >= totalPage && !isAllLoaded) {
                const $finalMarker = $(`<div style="text-align:center; margin:10px 0;">已加载全部（共${totalPage}页）</div>`);
                $(POST_LIST_SELECTOR).first().append($finalMarker);
                isAllLoaded = true;
                console.log('初始页为最后一页，已显示全部加载');
                return;
            }

            initScrollListener();
            console.log('滚动监听启动，等待滚动加载');
        }, 300);
    }

    init();
})();