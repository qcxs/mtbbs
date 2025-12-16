// ==UserScript==
// @name         [MT论坛]个人空间-自动下一页
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  功能：滚动加载下一页、页码跳转、加载失败重试、无更多内容提示；优化地址栏无刷新更新（滑过页码才更新）+ 禁用滚动记忆
// @author       qcxs
// @match        *://bbs.binmt.cc/home.php?*do=thread*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const $ = window.jQuery;
    let currentPage = 1;
    let isLoading = false;
    let isFailed = false;
    let hasNextPage = true;
    const loadThreshold = 1500;
    const POST_LIST_SELECTOR = '.comiis_forumlist.comiis_xznlist';
    const NEXT_PAGE_SELECTOR = '.comiis_page a:contains("下一页")';
    // 节流函数+已监听元素缓存（核心新增）
    const observedMarkers = new Set();

    /**
     * 解析AJAX响应内容（提取CDATA中的帖子列表）
     * @param {string} response - 响应数据
     * @returns {string} 帖子列表HTML（仅ul下的li内容）
     */
    function parseResponse(response) {
        let htmlContent = '';
        const cdataMatch = /<!\[CDATA\[(.*?)\]\]>/s.exec(response);
        if (cdataMatch && cdataMatch[1]) {
            htmlContent = cdataMatch[1];
        } else if (response.find) {
            htmlContent = response.find(POST_LIST_SELECTOR).html() || '';
        }

        const $temp = $(`<div>${htmlContent}</div>`);
        const ulContent = $temp.find('ul').html() || '';
        const hasNextInResponse = $temp.find('a:contains("下一页")').length > 0;
        hasNextPage = !!ulContent && hasNextInResponse;
        return ulContent;
    }

    /**
     * 构造页码跳转URL（仅保留page参数，移除inajax）
     * @param {number} targetPage - 目标页码
     * @returns {string} 完整跳转URL
     */
    function buildJumpUrl(targetPage) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', targetPage);
        url.searchParams.delete('inajax');
        return url.toString();
    }

    /**
     * 初始化当前页码（从URL参数提取，默认第1页）
     */
    function initCurrentPage() {
        const urlPage = new URL(window.location.href).searchParams.get('page');
        currentPage = urlPage ? parseInt(urlPage.trim()) : 1;
        currentPage = Math.max(1, currentPage);
        console.log(`当前页码：第${currentPage}页`);
    }

    /**
     * 添加分页状态标记（加载中/加载失败/正常页码）
     * @param {number} pageNum - 页码
     * @param {boolean} isLoadingState - 是否加载中状态
     * @param {boolean} isFailedState - 是否加载失败状态
     */
    function addPageMarker(pageNum, isLoadingState = false, isFailedState = false) {
        const $postList = $(POST_LIST_SELECTOR).find('ul').first();
        if (!$postList.length) return;

        let markerText = '';
        if (isLoadingState) {
            markerText = `<li style="text-align:center; margin:10px 0; list-style:none; padding:5px 0;">加载第${pageNum}页中...</li>`;
        } else if (isFailedState) {
            markerText = `<li class="retry-marker" style="text-align:center; margin:10px 0; color:red; list-style:none; padding:5px 0;">
                第${pageNum}页加载失败 <a href="javascript:;" style="color:#007bff; cursor:pointer; margin-left:5px;">点击重试</a>
            </li>`;
        } else {
            markerText = `<li style="text-align:center; margin:10px 0; list-style:none; padding:5px 0;">
                <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${pageNum}页</span>
            </li>`;
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

    /**
     * 显示无更多内容标记
     */
    function showNoMoreMarker() {
        const $postList = $(POST_LIST_SELECTOR).find('ul').first();
        const $finalMarker = $(`<li style="text-align:center; margin:10px 0; list-style:none; padding:5px 0; color:#666;">
            已加载全部内容
        </li>`);
        if (!$postList.find('li:contains("已加载全部内容")').length) {
            $postList.append($finalMarker);
        }
    }

    /**
     * 加载下一页数据
     */
    function loadNextPage() {
        if (isLoading || !hasNextPage || isFailed) return;

        isLoading = true;
        const nextPage = currentPage + 1;
        addPageMarker(nextPage, true);
        const requestUrl = buildJumpUrl(nextPage) + "&inajax=1";

        $.ajax({
            type: 'GET',
            url: requestUrl,
            dataType: 'html',
            timeout: 3000
        }).done(function (response) {
            const htmlContent = parseResponse(response);
            const $postList = $(POST_LIST_SELECTOR).find('ul').first();
            $postList.find(`li:contains("加载第${nextPage}页中...")`).remove();

            if (htmlContent) {
                addPageMarker(nextPage);
                $postList.append(htmlContent);
                currentPage = nextPage;
                console.log(`加载成功：第${currentPage}页`);

                // 为新增元素初始化点赞按钮，函数存在则调用，不存在则不执行
                window.comiis_recommend_addkey?.();
                // 为新增元素初始化关注按钮
                window.comiis_user_gz_key?.();

                if (!hasNextPage) {
                    showNoMoreMarker();
                    console.log('已无更多页面');
                }

                //监听新增标签，当显示在网页时，代码上一页已阅读完毕
                (function () {
                    const $markers = $('.page-jump-link').closest('li'); // 有的是div，有的时li
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

            } else {
                hasNextPage = false;
                showNoMoreMarker();
                console.log('已无更多页面（无有效内容）');
            }
        }).fail(function () {
            console.error(`加载失败：第${nextPage}页`);
            const $postList = $(POST_LIST_SELECTOR).find('ul').first();
            $postList.find(`li:contains("加载第${nextPage}页中...")`).remove();
            addPageMarker(nextPage, false, true);
            isFailed = true;
        }).always(function () {
            isLoading = false;
        });
    }

    /**
     * 初始化滚动监听（滚动到阈值触发加载）
     */
    function initScrollListener() {
        $(window).scroll(function () {
            if (isFailed || isLoading || !hasNextPage) return;

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
        entries.forEach(entry => {
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

    /**
     * 初始化当前页标记（非第1页时在列表顶部显示）
     */
    function initCurrentPageMarker() {
        const $postList = $(POST_LIST_SELECTOR).find('ul').first();
        if (!$postList.length || currentPage === 1) return;

        const $currentMarker = $(`<li style="text-align:center; margin:0 0 10px 0; list-style:none; padding:5px 0;">
            <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${currentPage}页</span>
        </li>`);
        $postList.prepend($currentMarker);
    }

    /**
     * 脚本初始化入口
     */
    function init() {
        setTimeout(() => {
            if (!$(POST_LIST_SELECTOR).length) {
                console.log('未找到帖子列表容器，脚本终止');
                return;
            }

            $('.comiis_page.bg_f').css('display', 'none');
            initCurrentPage();
            initCurrentPageMarker();
            hasNextPage = $(NEXT_PAGE_SELECTOR).length > 0;

            // 绑定页码跳转事件
            $(document).off('click', '.page-jump-link').on('click', '.page-jump-link', function () {
                const inputPage = prompt(`请输入要跳转的页码（当前第${currentPage}页）：`, currentPage);
                if (!inputPage) return;

                const targetPage = parseInt(inputPage.trim());
                if (isNaN(targetPage) || targetPage < 1) {
                    alert('请输入大于0的有效数字！');
                    return;
                }

                window.location.href = buildJumpUrl(targetPage);
            });

            // 启动滚动监听
            if (hasNextPage) {
                initScrollListener();
                console.log('滚动监听已启动，等待滚动加载下一页');
            } else {
                const $finalMarker = $(`<li style="text-align:center; margin:10px 0; list-style:none; padding:5px 0; color:#666;">
                    <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${currentPage}页</span> · 已加载全部内容
                </li>`);
                $(POST_LIST_SELECTOR).find('ul').first().append($finalMarker);
            }

            // 定义独立函数，方便后续解除拦截（如需）
            function handleCaptureClick(e) {
                // 1. 判断点击元素是否有「class为forumlist_li的li父元素」（包括自身）
                const forumlistDiv = e.target.closest('div.mmlist_li_box');
                if (!forumlistDiv) {
                    return; // 无目标父元素，不拦截，执行原点击行为
                }

                // 2. 找到该div下所有a标签，遍历匹配链接
                const targetLinks = forumlistDiv.querySelectorAll('a');
                let matchedUrl = null;
                // 正则表达式：匹配 thread-数字-任意字符.html 格式（支持 thread-xxxx-1-1.html 等变体）
                const threadReg = /thread-\d+.*\.html$/i;

                for (const link of targetLinks) {
                    const href = link.getAttribute('href') || '';
                    // 3. 正则匹配目标链接格式
                    if (threadReg.test(href)) {
                        matchedUrl = href;
                        break; // 找到第一个匹配链接即可
                    }
                }

                // 4. 有匹配链接：新标签打开，拦截原行为；无匹配：不拦截
                if (matchedUrl) {
                    e.preventDefault(); // 阻止原跳转/默认行为
                    e.stopPropagation(); // 阻止事件传播（避免其他脚本触发）
                    e.stopImmediatePropagation(); // 阻止同阶段其他监听者
                    window.open(matchedUrl, '_blank'); // 新标签打开页面
                }
            }

            // 捕获阶段绑定全局click事件（关键：第三个参数true）
            document.addEventListener('click', handleCaptureClick, true);
        }, 300);
    }

    // 启动脚本
    init();
})();