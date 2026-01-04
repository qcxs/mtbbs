// ==UserScript==
// @name         [MT论坛]自动下一页 by：青春向上
// @namespace    https://github.com/qcxs/mtbbs
// @version      2025-11-22
// @description  集众多页面为一体，统一使用page参数控制分页。滚动加载下一页，手动加载上一页，页码跳转，地址栏无刷新更新。已适配：社区、导读、搜索、个人空间帖子/回复/留言、帖子评论、我的好友、积分明细、消息提醒。
// @author       青春向上
// @match        *://bbs.binmt.cc/forum-*.html*
// @match        *://bbs.binmt.cc/forum.php?*fid=*
// @match        *://bbs.binmt.cc/forum.php?*mod=guide*
// @match        *://bbs.binmt.cc/search.php?*searchid=*
// @match        *://bbs.binmt.cc/home.php?*do=thread*
// @match        *://bbs.binmt.cc/forum.php?*tid=*
// @match        *://bbs.binmt.cc/*thread-*.html*
// @match        *://bbs.binmt.cc/home.php?*do=friend*
// @match        *://bbs.binmt.cc/home.php?*do=favorite*
// @match        *://bbs.binmt.cc/home.php?*do=following*
// @match        *://bbs.binmt.cc/home.php?*do=follower*
// @match        *://bbs.binmt.cc/home.php?*do=wall*
// @match        *://bbs.binmt.cc/home.php?*do=notice*
// @match        *://bbs.binmt.cc/home.php?*view=visitor*
// @match        *://bbs.binmt.cc/home.php?*view=trace*
// @match        *://bbs.binmt.cc/home.php?*ac=friend*
// @match        *://bbs.binmt.cc/home.php?*ac=credit*
// @match        *://bbs.binmt.cc/home.php?*view=blacklist*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';
    const ENUM = {
        //帖子列表
        postListSelector: '.comiis_forumlist>ul',
        //评论列表
        commentListSelector: '.comiis_postlist',
        //好友列表
        friendsListSelector: '.comiis_userlist01',
        //留言列表
        leaveMessageListSelector: '.comiis_plli',
        //积分明细
        integralListSelector: '.comiis_credits_log>ul',
        //通知列表
        noticeSelector: '.comiis_notice_list>ul',
        //我的收藏
        favoriteSelector: '.comiis_mysclist>ul',
        //当无法从页码选择器中获取总页码时，取最大，会自动根据响应数据判断是否还有下一页
        unknownPage: 999,
        //距离页面底部多少时，加载下一页，单位：像素
        loadThreshold: 1500,
        //请求超时时间，3秒
        requestTimeout: 3000,
    }
    const $ = window.jQuery;
    //页面没有jQuery，停止执行
    if (!$) return;

    //模式，内容css选择器
    const { mode, listSelector } = initFromUrl();
    //当前页，总页数
    let { currentPage, totalPage } = getPageInfo()
    let isLoading = false;
    let isFailed = false;

    // 节流函数+已监听元素缓存
    const observedMarkers = new Set(); // 防重复监听

    // 从url中分析页面
    function initFromUrl() {
        let listSelector = '';
        const url = new URL(window.location.href);
        const splitSegments = url.pathname.split('-');
        let mode = '';
        if (url.searchParams.get('fid') || splitSegments.length === 3 && splitSegments[0].endsWith('forum')) {
            // 情况1：社区，eg：forum-2-1.html
            mode = 'forum'
            listSelector = ENUM.postListSelector
        } else if (url.searchParams.get('mod') === 'guide') {
            // 情况2：导读
            mode = 'guide';
            listSelector = ENUM.postListSelector
        } else if (url.pathname === '/search.php') {
            // 情况3：搜索
            mode = 'search';
            listSelector = ENUM.postListSelector
        } else if (url.searchParams.get('do') === 'thread') {
            // 情况4：个人空间
            mode = 'home';
            listSelector = ENUM.postListSelector
        } else if (url.searchParams.get('tid') || splitSegments.length === 4 && splitSegments[0].endsWith('thread')) {
            // 情况5：帖子评论，eg：thread-156601-1-1.html
            mode = 'thread';
            listSelector = ENUM.commentListSelector;
        } else if (url.searchParams.get('do') === 'friend' || url.searchParams.get('do') === 'following' || url.searchParams.get('do') === 'follower' ||
            url.searchParams.get('view') === 'visitor' || url.searchParams.get('view') === 'trace' || url.searchParams.get('view') === 'blacklist' ||
            url.searchParams.get('ac') === 'friend') {
            // 情况6：我的好友
            mode = 'friends';
            listSelector = ENUM.friendsListSelector
        } else if (url.searchParams.get('do') === 'wall') {
            // 情况7：个人空间-留言
            mode = 'leaveMessage';
            listSelector = ENUM.leaveMessageListSelector
        } else if (url.searchParams.get('ac') === 'credit') {
            // 情况8：积分明细
            mode = 'integral';
            listSelector = ENUM.integralListSelector
        } else if (url.searchParams.get('do') === 'notice') {
            // 情况9：消息提醒
            mode = 'notice';
            listSelector = ENUM.noticeSelector
        } else if (url.searchParams.get('do') === 'favorite') {
            // 情况10：我的收藏
            mode = 'favorite';
            listSelector = ENUM.favoriteSelector
        }
        console.log(`模式：${mode || '未找到'}`);
        return { mode, listSelector };
    }

    function initBylistSelector() {
        if (listSelector == ENUM.postListSelector) {
            // 捕获阶段绑定全局click事件（关键：第三个参数true）
            document.addEventListener('click', function handleCaptureClick(e) {
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
            }, true);
            console.log('新标签中打开网页')
        } else if (listSelector == ENUM.friendsListSelector || listSelector == ENUM.integralListSelector || listSelector == ENUM.noticeSelector || listSelector == ENUM.favoriteSelector) {
            //易出bug，限制在这些网页中
            //阻止原局部刷新网页，避免编写初始化脚本
            $(document).on('click', 'a', function (e) {
                //如果点击的是内容容器，则跳过
                if (e.target.closest(listSelector)) return true;
                // 目标链接判断：可自定义条件（示例：href 不包含 "javascript:" 且需要正常跳转的链接）
                var href = $(this).attr('href');
                if (href && href.indexOf('javascript:') === -1 && href.indexOf('#') === -1) {
                    // 1. 阻止原事件冒泡（避免原代码的事件触发）
                    e.stopImmediatePropagation();
                    // 2. 强制触发默认跳转（等同于正常点击链接）
                    window.location.href = href;
                    // 3. 阻止后续行为
                    e.preventDefault();
                    return false;
                }
            });
            console.log('阻止默认局部刷新')
        }

    }

    // 解析响应内容
    function parseResponse(root) {
        const htmlDom = $(root);
        //将其解析为网页
        const $temp = $(`<div>${root}</div>`);
        //评论列表特殊，其余可通过选取返回的元素拼接
        if (listSelector === ENUM.commentListSelector) {
            return htmlDom || '';
        } else {
            return $temp.find(listSelector).html() || '';
        }
    }

    // 构造跳转URL（统一修改page参数，保留所有原有参数）
    function buildJumpUrl(targetPage, inajax) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', targetPage);
        if (inajax) {
            url.searchParams.set('inajax', '1');
        } else {
            url.searchParams.delete('inajax');
        }
        return url.toString();
    }

    // 获取分页信息
    function getPageInfo() {
        const $select = $('#dumppage');
        //将unknownPage定义为无总页数
        const totalPage = $select.length ? $select.find('option').length : ENUM.unknownPage;
        // 从URL参数获取当前page，优先级高于下拉框
        const urlPage = new URL(window.location.href).searchParams.get('page');
        //如果url中包含当前页，取其。否则取页码选择器，都没有则为第一页
        let currentPage = parseInt(urlPage?.trim()) || ($select.length ? parseInt($select.find('option:selected').val()) : 1);
        //冗余设计，避免page属性异常（非整数、小于1）
        if (currentPage < 1) {
            currentPage = 1;
        } else if (!Number.isInteger(currentPage)) {
            currentPage = Math.floor(currentPage);
        }
        //打印日志
        console.log(`分页：第${currentPage}/${totalPage}页`);
        return { currentPage, totalPage };
    }

    // 添加分页标记（调整为li容器，适配帖子列表结构）
    function addPageMarker({ pageNum = currentPage, isLoadingState, errorObject, loadAll }) {
        const $postList = $(listSelector).first();
        //只有当前页码为第一页时，不插入标签
        if (!$postList.length || (currentPage == 1 && currentPage == pageNum)) return;
        // 移除加载中标记
        $postList.find(`li:contains("加载中...")`).remove();
        //有总页数则显示，否则不显示
        const totalPageText = totalPage != ENUM.unknownPage ? `/共${totalPage}页` : '';
        let prepend = pageNum <= currentPage;
        let marker = null;
        if (isLoadingState) {
            //加载中标记
            marker = $(`<li style="text-align:center; padding: 0; margin:10px 0;"> <span class="page-jump-link" style="color:#507daf;">第${pageNum}页</span>
            ${totalPageText} 加载中...</li>`)
        } else if (errorObject) {
            //加载失败标记
            marker = $(`<li class="retry-marker" style="text-align:center; padding: 0; margin:10px 0; color:red;">
             <span class="page-jump-link" style="color:#507daf;">第${pageNum}页</span>${totalPageText} 加载失败 
             <span class="retry-button" style="color:#007bff; margin-left:5px;">点击重试</span>
             <p style="color:red; margin-left:5px;"></p>
        </li>`)
            // 将 errorObject 转换为 JSON 字符串并截断
            const errorMessage = typeof (errorObject == 'string') ? errorObject : JSON.stringify(errorObject);
            const truncatedErrorMessage = errorMessage.length > 200 ? + `${errorMessage.substring(0, 200)}......` : errorMessage;
            // 使用 .text() 将JSON字符串安全地插入到p标签中，避免因内容包含html而被错误解析
            marker.find('p').text(truncatedErrorMessage);
            // 绑定重试事件
            $(marker).on('click', '.retry-button', function () {
                isFailed = false;
                loadPage(pageNum);
                $(this).closest('.retry-marker').remove();
                console.log(`尝试重新加载第${pageNum}页`)
            });
        } else if (loadAll) {
            //全部加载标记
            marker = $(`<li style="text-align:center; padding: 0; margin:10px 0; color:#666;">
                    已全部 <span class="page-jump-link" style="color:#507daf;">共${pageNum}页</span> 
                    加载 <a href="${buildJumpUrl(1)}" style="color:#507daf;">回到第1页</a>
                </li>`)
            prepend = false;
        } else {
            //请求成功标记
            marker = $(`<li style="text-align:center; padding: 0; margin:10px 0;">
            <span class="page-jump-link" style="color:#507daf;">第${pageNum}页</span>${totalPageText}
            ${(prepend && pageNum != 1) ? `<span class="loadPreNext" style="color:#507daf;">上一页</span>` : ''}
        </li>`)
            // “上一页”点击事件
            $(marker).on('click', '.loadPreNext', function () {
                if (isFailed) {
                    alert('下一页加载发生错误，重试后才允许加载上一页。')
                    return;
                }
                loadPage(pageNum - 1);
                $(this).remove();
                console.log(`尝试加载第${pageNum - 1}页`)
            });
        }

        // 是否为前插
        if (prepend) {
            $postList.prepend(marker);
        } else {
            $postList.append(marker);
        }

    }

    // 全部加载完成事件
    // 三种情况调用：页面加载时最后一页、请求了最后一页、请求结果表明没有最后一页
    function allLoaded(pageNum = totalPage) {
        addPageMarker({ pageNum, loadAll: true })
        //解绑滚动监听
        $(window).off("scroll", handleScroll);
        console.log("所有页已全部加载，解除滚动监听。")
    }

    // 加载下一页（统一使用page参数请求）
    function loadPage(page) {
        if (isLoading || (page > totalPage || page < 1) || isFailed) return;

        addPageMarker({ pageNum: page, isLoadingState: true }); // 显示加载中标记
        //格外添加inajax属性，返回root标签结果
        const requestUrl = buildJumpUrl(page, true);

        isLoading = true;
        $.ajax({
            type: 'GET',
            url: requestUrl,
            //返回数据自动按照xml进行解析，此时可直接获取root标签的内容
            dataType: 'xml',
            timeout: ENUM.requestTimeout
        }).then(function (response) {
            // jquery版本过低，无法使用catch处理异常。使用 try...catch 包裹所有业务逻辑
            try {
                const root = response.lastChild.firstChild.nodeValue
                if (typeof (root) == "undefined" || root == null) throw new Error('数据格式错误！');

                const htmlContent = parseResponse(root);

                const $postList = $(listSelector).first();

                // 导读无下一页时，会显示无主题。
                // 个人空间无下一页时，解析返回为空或不包含下一页。但最后一页也不包含下一页，却仍有内容
                // 但如果解析为空，也可能是解析失败
                if (root.includes('本版块或指定的范围内尚无主题') || (!htmlContent && totalPage == ENUM.unknownPage)) {
                    //下一页无数据，直接判定已全部加载
                    allLoaded(currentPage)
                    return;
                } else if (!htmlContent) throw new Error('数据解析失败！')

                // 合并新页面帖子内容
                if (page < currentPage) {
                    $postList.prepend(htmlContent);
                    addPageMarker({ pageNum: page });
                } else {
                    addPageMarker({ pageNum: page });
                    $postList.append(htmlContent);
                    // 更新当前页
                    currentPage = page;
                }

                console.log(`加载成功：第${currentPage}/${totalPage}页`);

                // 为新增元素初始化点赞按钮，函数存在则调用，不存在则不执行
                window.comiis_recommend_addkey?.();
                // 为新增元素初始化关注按钮
                window.comiis_user_gz_key?.();
                //为新增元素初始化评论按钮
                if (window.popup?.init) window.popup.init();

                // 监听新增标签，当显示在网页时，代码上一页已阅读完毕
                (function () {
                    const $markers = $('.page-jump-link').closest('li'); // 有的是div，有的时li
                    if (!$markers.length) return;

                    $markers.each(function () {
                        const dom = this;
                        if (!observedMarkers.has(dom)) {
                            //是当前页第一个元素，表示之前没有内容，故无已阅读之说，跳过
                            if ($(dom).is(':first-child')) return;
                            observedMarkers.add(dom);
                            observer.observe(dom);
                        }
                    });
                })()

                if (page >= totalPage || !root.includes('下一页') && totalPage == ENUM.unknownPage) allLoaded(page);

            } catch (error) {
                return $.Deferred().reject(error);
            }
        }).then(null, function (e) {
            // 既能处理 AJAX 错误，也能处理上面手动 reject 的业务错误
            try {
                console.error(`加载失败：第${page}页`, e);
                addPageMarker({ pageNum: page, errorObject: e }); // 显示失败重试标记
                isFailed = true;
            } catch (error) {
                //当服务器返回的数据中包含script标签，此时jquery会尝试解析它，又有可能发生错误
                //如果此时发生错误，always不会执行
                console.log('处理异常时又发生异常', error)
            }
        }).always(function () {
            isLoading = false;
        });
    }

    //滚动事件
    function handleScroll() {
        if (isFailed || isLoading || currentPage >= totalPage) return;

        const scrollTop = $(window).scrollTop();
        const windowHeight = $(window).height();
        const docHeight = $(document).height();

        // 滚动到阈值触发加载，预加载下一页
        if (docHeight - (scrollTop + windowHeight) <= ENUM.loadThreshold) {
            loadPage(currentPage + 1);
        }
    }

    // 创建观察者实例
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const { target, isIntersecting } = entry;
            const jump = target.querySelector('.page-jump-link')
            if (jump == null) return;
            const markerText = jump.textContent?.trim();
            const pageMatch = markerText.match(/第(\d+)页/);
            if (!pageMatch || !isIntersecting) return;

            //已阅读完上一页
            const pageNum = parseInt(pageMatch[1]) - 1;

            const newUrl = buildJumpUrl(pageNum);
            if (window.location.href !== newUrl) {
                console.log('已阅读' + pageNum)
                window.history.replaceState({}, document.title, newUrl);
            }
            // 持续监听，当用户返回上一页时，可以更新为上一页，故不解除绑定
            // observer.unobserve(target); 
        });
    }, {
        threshold: 0.8 // 显示80%触发，兼顾体验与准确性
    });

    // 初始化当前页标记（页面顶部显示当前页码）
    function initCurrentPage() {

        //前插标识
        addPageMarker({ pageNum: currentPage })

        // 隐藏原分页选择器
        $('.comiis_page').css('display', 'none');

        // 启动滚动加载监听（预加载下一页）
        $(window).scroll(handleScroll);

        console.log('滚动加载监听已启动，等待滚动加载下一页');

        //检测是否全部加载
        if (currentPage >= totalPage) allLoaded(totalPage);

        // 绑定页码跳转事件（事件委托，支持动态生成的标记）
        $(document).off('click', '.page-jump-link').on('click', '.page-jump-link', function () {
            const inputPage = prompt(`请输入要跳转的页码（1-${totalPage}）：`, currentPage);
            if (!inputPage) return; // 取消输入

            const targetPage = parseInt(inputPage.trim());
            // 校验输入合法性
            if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPage) {
                alert(`请输入1-${totalPage}之间的有效数字！`);
                return;
            }

            // 跳转至目标页码
            window.location.href = buildJumpUrl(targetPage);
        });

    }

    // 脚本初始化入口
    function init() {

        //根据不同网页进行不同格外操作
        initBylistSelector()

        if (!$('.comiis_page').length) {
            console.log('无下一页，脚本终止')
            return;
        }

        if (!mode || !listSelector) {
            console.log('未适配的网页，脚本终止');
            return;
        }

        // 为当前页进行初始化
        initCurrentPage();
    }

    // 启动脚本
    init();
})();