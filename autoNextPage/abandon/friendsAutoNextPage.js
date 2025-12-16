// ==UserScript==
// @name         [MT论坛]我的好友-自动下一页
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  个人空间列表自动滚动加载、页码跳转、滑过页码更新URL；分页标记改为li格式，监听加载中隐藏触发重新初始化
// @author       qcxs
// @match        *://bbs.binmt.cc/home.php?*do=friend*
// @match        *://bbs.binmt.cc/home.php?*do=following*
// @match        *://bbs.binmt.cc/home.php?*do=follower*
// @match        *://bbs.binmt.cc/home.php?*view=visitor*
// @match        *://bbs.binmt.cc/home.php?*view=trace*
// @match        *://bbs.binmt.cc/home.php?*ac=friend*
// @match        *://bbs.binmt.cc/home.php?*view=blacklist*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const $ = window.jQuery;
    let currentPage = 1;
    let totalPage = 0;
    let isLoading = false;
    let isFailed = false;
    let isAllLoaded = false;
    const loadThreshold = 1500;
    // 核心选择器（适配HTML结构）
    let ROOT_CONTAINER = '.comiis_friend_boxs'; // 根容器
    let CONTENT_CONTAINER = '.comiis_friend_boxs .bg_f.b_b:has(.comiis_userlist01)'; // 内容容器
    let USER_LIST_WRAPPER = '.comiis_userlist01'; // 列表ul容器
    const DUMP_PAGE_SELECTOR = '#dumppage'; // 分页选择器
    // 节流+防重复监听（统一思路）
    const observedMarkers = new Set();

    /**
     * 初始化当前页码（从URL提取，默认1）
     */
    function initCurrentPage() {
        const url = new URL(window.location.href);
        const urlPage = url.searchParams.get('page')
        currentPage = urlPage ? parseInt(urlPage.trim()) : 1;
        currentPage = Math.max(1, currentPage);
        console.log(`当前页码：第${currentPage}页`);
    }

    /**
     * 获取分页信息（总页数）
     */
    function getPageInfo() {
        const $select = $(DUMP_PAGE_SELECTOR);
        if (!$select.length) {
            console.log('未找到分页选择器');
            return false;
        }
        totalPage = $select.find('option').length;
        totalPage = Math.max(totalPage, 1);
        console.log(`分页信息：第${currentPage}/${totalPage}页`);
        return true;
    }

    /**
     * 构造跳转URL（仅修改page参数，保留其他原有参数）
     */
    function buildJumpUrl(targetPage) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', targetPage);
        url.searchParams.delete('inajax'); // 移除AJAX标记
        return url.toString();
    }

    /**
     * 添加分页标记（li格式，插入到列表ul中）
     */
    function addPageMarker(pageNum, isLoadingState = false, isFailedState = false) {
        const $userList = $(CONTENT_CONTAINER).find(USER_LIST_WRAPPER);
        if (!$userList.length) return;

        let markerText = '';
        // li格式+统一样式
        if (isLoadingState) {
            markerText = `<li class="b_t" style="text-align:center; padding:10px 0; list-style:none; font-size:14px;">第${pageNum}页/共${totalPage}页 加载中...</li>`;
        } else if (isFailedState) {
            markerText = `<li class="b_t retry-marker" style="text-align:center; padding:10px 0; color:red; list-style:none; font-size:14px;">
                第${pageNum}页/共${totalPage}页 加载失败 <a href="javascript:;" style="color:#007bff; cursor:pointer; margin-left:5px;">点击重试</a>
            </li>`;
        } else {
            markerText = `<li class="b_t" style="text-align:center; padding:10px 0; list-style:none; font-size:14px;">
                <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${pageNum}页</span>/共${totalPage}页
            </li>`;
        }

        $userList.append(markerText);

        // 绑定重试事件
        if (isFailedState) {
            $('.retry-marker a').click(function () {
                $(this).closest('.retry-marker').remove();
                isFailed = false;
                loadNextPage();
            });
        }
    }

    /**
     * 解析AJAX响应内容（提取列表li）
     */
    function parseResponse(response) {
        let htmlContent = '';
        const cdataMatch = /<!\[CDATA\[(.*?)\]\]>/s.exec(response);
        if (cdataMatch && cdataMatch[1]) {
            htmlContent = cdataMatch[1];
        } else {
            htmlContent = response;
        }

        const $temp = $(`<div>${htmlContent}</div>`);
        const $userList = $temp.find(USER_LIST_WRAPPER);
        return $userList.html() || '';
    }

    /**
     * 加载下一页列表
     */
    function loadNextPage() {
        if (isLoading || currentPage >= totalPage || isFailed || isAllLoaded) return;

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
            const $userList = $(CONTENT_CONTAINER).find(USER_LIST_WRAPPER);

            $userList.find(`li:contains("第${nextPage}页/共${totalPage}页 加载中...")`).remove();

            if (htmlContent) {
                addPageMarker(nextPage);
                $userList.append(htmlContent);
                currentPage = nextPage;
                console.log(`加载成功：第${currentPage}/${totalPage}页`);

                if (currentPage >= totalPage && !isAllLoaded) {
                    const $finalMarker = $(`<li class="b_t" style="text-align:center; padding:10px 0; color:#666; list-style:none; font-size:14px;">
                        已加载全部（共${totalPage}页）
                    </li>`);
                    $userList.append($finalMarker);
                    isAllLoaded = true;
                }

                if (window.popup?.init) window.popup.init();

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
                throw new Error('无有效数据');
            }


        }).fail(function () {
            console.error(`加载失败：第${nextPage}页`);
            const $userList = $(CONTENT_CONTAINER).find(USER_LIST_WRAPPER);
            $userList.find(`li:contains("第${nextPage}页/共${totalPage}页 加载中...")`).remove();
            addPageMarker(nextPage, false, true);
            isFailed = true;
        }).always(function () {
            isLoading = false;
        });
    }

    /**
     * 滚动监听（触发加载下一页）
     */
    function initScrollListener() {
        $(window).off('scroll.loadNextPage');
        $(window).on('scroll.loadNextPage', function () {
            if (isFailed || isLoading || currentPage >= totalPage || isAllLoaded) return;

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const docHeight = $(document).height();

            if (docHeight - (scrollTop + windowHeight) <= loadThreshold) {
                loadNextPage();
            }
        });
    }


    // 创建观察者实例
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const { target, isIntersecting } = entry;
            const markerText = target.textContent?.trim();
            const pageMatch = markerText.match(/第(\d+)页/);

            if (!pageMatch || !isIntersecting) return;

            const pageNum = parseInt(pageMatch[1]) - 1;
            if (pageNum < 1 || pageNum > currentPage) return;

            const newUrl = buildJumpUrl(pageNum);
            if (window.location.href !== newUrl) {
                console.log('已阅读' + pageNum);
                window.history.replaceState({}, document.title, newUrl);
            }
        });
    }, { threshold: 0.8 });


    /**
     * 初始化顶部当前页标记（li格式）
     */
    function initCurrentPageMarker() {
        const $userList = $(CONTENT_CONTAINER).find(USER_LIST_WRAPPER);
        if (!$userList.length || currentPage === 1) return;

        const $currentMarker = $(`<li class="b_t" style="text-align:center; padding:10px 0; list-style:none; font-size:14px;">
            <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${currentPage}页</span>/共${totalPage}页
        </li>`);
        $userList.prepend($currentMarker);
    }


    /**
     * 核心初始化流程
     */
    function initProcess() {

        setTimeout(() => {
            // 未找到关键容器，终止初始化
            if (!$(ROOT_CONTAINER).length || !$(CONTENT_CONTAINER).length || !$(USER_LIST_WRAPPER).length) {
                console.log('未找到核心容器，初始化终止');
                return;
            }

            // 无分页信息时，仅隐藏原分页控件，不执行后续逻辑
            if (!getPageInfo()) {
                $(DUMP_PAGE_SELECTOR).closest('.comiis_page').css('display', 'none');
                return;
            }

            // 隐藏原分页控件
            $(DUMP_PAGE_SELECTOR).closest('.comiis_page').css('display', 'none');

            // 初始化基础配置
            initCurrentPage();
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

                window.location.href = buildJumpUrl(targetPage);
            });


            // 启动滚动加载
            if (!isAllLoaded) {
                initScrollListener();
                console.log('滚动加载监听已启动');
            } else {
                const $finalMarker = $(`<li class="b_t" style="text-align:center; padding:10px 0; color:#666; list-style:none; font-size:14px;">
                    <span class="page-jump-link" style="color:#507daf; text-decoration:underline; cursor:pointer;">第${currentPage}页</span>/共${totalPage}页 · 已加载全部
                    </li>`);
                $(CONTENT_CONTAINER).find(USER_LIST_WRAPPER).append($finalMarker);
            }
        }, 300);
    }

    //初始化脚本
    initProcess();

    //切换列表时，直接刷新页面（重新执行脚本）
    $(function () {
        // 绑定所有标签点击事件
        $('#comiis_sub .swiper-slide a').on('click', function (e) {
            const $this = $(this);
            const $parentLi = $this.parent('.swiper-slide');

            // 1. 点击已激活的标签，不处理
            if ($parentLi.hasClass('swiper-slide-active')) {
                e.preventDefault();
                return;
            }

            // 2. 非激活标签：获取目标URL并刷新页面
            const targetUrl = $this.attr('href');
            if (targetUrl) {
                e.preventDefault(); // 阻止默认跳转（避免重复跳转）
                window.location.href = targetUrl; // 直接跳转到目标URL（会刷新页面）
            }
        });
    });

})();