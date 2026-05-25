// ==UserScript==
// @name         [MT论坛]移动端图片恢复
// @namespace    https://github.com/qcxs/mtbbs
// @version      1.0
// @description  为MT论坛移动端添加图片恢复功能
// @author       青春向上
// @match        *://bbs.binmt.cc/forum.php?*mod=post*
// @match        *://bbs.binmt.cc/forum.php?*action=reply*
// @match        *://bbs.binmt.cc/forum.php?*action=newthread*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        PC_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        API_URL: 'https://bbs.binmt.cc/forum.php?mod=ajax&action=imagelist'
    };

    let RESTORE_IMAGES = [];
    let TID = 0;
    let FID = 0;
    let FORM_HASH = '';
    let existingAids = new Set();
    let noticeElement = null;

    // 初始化入口函数
    function init() {
        extractParams();
        collectExistingImages();
        checkMobileMode();
        registerMenu();
    }

    // 提取URL参数和表单信息
    function extractParams() {
        const urlParams = new URLSearchParams(window.location.search);
        TID = urlParams.get('tid') || 0;
        FID = urlParams.get('fid') || 0;
        FORM_HASH = document.getElementById('formhash')?.value || '';
    }

    // 收集已存在的图片ID，用于去重
    function collectExistingImages() {
        const spans = document.querySelectorAll('span[aid]');
        spans.forEach(function(span) {
            const aid = span.getAttribute('aid');
            if (aid) existingAids.add(aid);
        });
    }

    // 检测当前模式，手机端执行恢复逻辑
    function checkMobileMode() {
        if (document.querySelector('.comiis_post_imglist') || document.querySelector('.comiis_upbox')) {
            checkUnusedImages();
        }
    }

    // 使用PC UA请求获取未使用的图片列表
    function checkUnusedImages() {
        if (!TID || !FID) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: CONFIG.API_URL + '&fid=' + FID + '&tid=' + TID,
            headers: { 'User-Agent': CONFIG.PC_USER_AGENT },
            onload: function(response) {
                if (response.status === 200) {
                    parseImages(response.responseText);
                }
            }
        });
    }

    // 解析PC端返回的图片列表HTML，提取图片信息
    function parseImages(responseText) {
        const cdataMatch = responseText.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
        const html = cdataMatch ? cdataMatch[1] : responseText;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const imgElements = tempDiv.querySelectorAll('img[id^="image_"]');
        RESTORE_IMAGES = [];

        imgElements.forEach(function(img) {
            const aid = img.id.replace('image_', '');
            if (existingAids.has(aid)) return;
            RESTORE_IMAGES.push({ aid: aid, src: img.src, title: img.title || '' });
        });

        if (RESTORE_IMAGES.length > 0) {
            showRestoreNotice();
        }
    }

    // 创建并显示恢复提示条
    function showRestoreNotice() {
        const upbox = document.querySelector('.comiis_upbox');
        if (!upbox) return;

        if (noticeElement) {
            noticeElement.style.display = 'flex';
            noticeElement.querySelector('strong').textContent = RESTORE_IMAGES.length;
            return;
        }

        noticeElement = document.createElement('div');
        noticeElement.id = 'mobile_restore_notice';
        noticeElement.style.cssText = 'background:#fff3cd;border:1px solid #ffeeba;padding:10px 15px;margin-bottom:10px;border-radius:4px;display:flex;align-items:center;gap:10px;';

        const textSpan = document.createElement('span');
        textSpan.style.cssText = 'color:#856404;font-size:14px;';
        textSpan.innerHTML = '您有 <strong style="color:#d39e00;">' + RESTORE_IMAGES.length + '</strong> 个未使用的图片';

        const useSpan = document.createElement('span');
        useSpan.style.cssText = 'color:#007bff;font-size:14px;padding:3px 8px;border-radius:3px;cursor:pointer;';
        useSpan.textContent = '使用';
        useSpan.addEventListener('click', useAllRestoreImages);

        const closeSpan = document.createElement('span');
        closeSpan.style.cssText = 'color:#666;font-size:18px;cursor:pointer;margin-left:auto;font-weight:bold;';
        closeSpan.textContent = '×';
        closeSpan.addEventListener('click', deleteRestoreNotice);

        noticeElement.appendChild(textSpan);
        noticeElement.appendChild(useSpan);
        noticeElement.appendChild(closeSpan);

        const parentUl = upbox.parentElement;
        parentUl.insertBefore(noticeElement, upbox);
    }

    // 使用所有可恢复图片
    function useAllRestoreImages() {
        const imglist = document.querySelector('.comiis_post_imglist') || document.getElementById('imglist');
        if (!imglist) return;

        RESTORE_IMAGES.forEach(function(img) {
            const li = document.createElement('li');
            li.innerHTML = '<span aid="' + img.aid + '" class="del"><a href="javascript:;"><i class="comiis_font f_g">&#xe648;</i></a></span>' +
                '<span class="charu f_f">插入</span>' +
                '<span class="p_img"><a href="javascript:;" onclick="comiis_addsmilies(\'[attachimg]' + img.aid + '[/attachimg]\')">' +
                '<img style="height:54px;width:54px;" id="aimg_' + img.aid + '" title="' + img.title + '" src="' + img.src + '" class="vm b_ok">' +
                '</a></span>' +
                '<input type="hidden" name="attachnew[' + img.aid + '][description]">';

            const upBtn = imglist.querySelector('.up_btn');
            upBtn ? imglist.insertBefore(li, upBtn) : imglist.appendChild(li);

            li.querySelector('.del a').addEventListener('click', function() {
                deleteRestoreImage(img.aid);
            });

            li.querySelector('.charu').addEventListener('click', function() {
                comiis_addsmilies('[attachimg]' + img.aid + '[/attachimg]');
            });
        });

        deleteRestoreNotice();
    }

    // 删除单张图片
    function deleteRestoreImage(aid) {
        if (!FORM_HASH || !TID) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://bbs.binmt.cc/forum.php?mod=ajax&action=deleteattach&inajax=yes&formhash=' + FORM_HASH + '&tid=' + TID + '&aids[]=' + aid,
            onload: function() {
                document.querySelector('li span[aid="' + aid + '"]')?.parentElement?.remove();
            }
        });
    }

    // 删除提示条
    function deleteRestoreNotice() {
        if (noticeElement) {
            noticeElement.remove();
            noticeElement = null;
        }
        RESTORE_IMAGES = [];
    }

    // 重新检测图片（从油猴菜单调用）
    function showRestoreNoticeFromMenu() {
        existingAids.clear();
        collectExistingImages();
        checkUnusedImages();
    }

    // 注册油猴菜单命令
    function registerMenu() {
        GM_registerMenuCommand('重新检测图片', showRestoreNoticeFromMenu);
    }

    init();

})();