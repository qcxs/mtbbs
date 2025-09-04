// ==UserScript==
// @name         [mt论坛]图片上传增强
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  为mt论坛网页端添加剪切板与拖拽图片上传功能。
// @author       qcxs
// @match        https://bbs.binmt.cc/forum.php?mod=post*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 全局变量
    let pastedImages = [];
    let modal = null;
    let previewImagesContainer = null;
    let editorDoc = null;
    let currentImageIndex = 0; // 当前选中的图片索引
    let largeImageContainer = null; // 大图预览容器
    let isModalVisible = false; // 弹窗显示状态

    // 初始化核心功能
    function initImageHandler() {
        // 检查文件输入框
        if (!document.querySelector('#imgSpanButtonPlaceholder input[type="file"]')) {
            //alert('未找到文件输入框，功能无法使用');
            return;
        }

        // 获取iframe并初始化编辑器文档
        let iframe = document.getElementById('e_iframe');
        if (!iframe) {
            console.error('未找到编辑器iframe');
            return;
        }

        // 处理iframe加载
        const handleIframeLoad = () => {
            editorDoc = iframe.contentDocument || iframe.contentWindow.document;
            editorDoc.designMode = 'on'; // 确保编辑模式
            bindIframeEvents(editorDoc);
        };

        iframe.addEventListener('load', handleIframeLoad);
        if (iframe.contentDocument) {
            handleIframeLoad();
        }

        // 创建DOM元素
        createElements();
        // 绑定事件
        bindEvents();
        // 初始化拖拽
        setupDragDrop(iframe);
        // 初始化全局粘贴监听
        setupPasteListener(iframe);
        // 绑定全局键盘事件（仅保留回车上传）
        bindGlobalKeyboardEvents();
    }

    // 为iframe文档绑定必要事件
    function bindIframeEvents(doc) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            doc.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
    }

    // 创建必要DOM
    function createElements() {
        // 上传按钮
        const uploadBtn = document.createElement('button');
        uploadBtn.id = 'customUploadBtn';
        uploadBtn.textContent = '上传图片';
        uploadBtn.style.cssText = `position:fixed;right:20px;top:50%;transform:translateY(-50%);padding:8px 16px;background:#3B82F6;color:white;border:none;border-radius:4px;cursor:pointer;z-index:9999;box-shadow:0 2px 5px rgba(0,0,0,0.2)`;
        document.body.appendChild(uploadBtn);

        // 弹窗容器
        modal = document.createElement('div');
        modal.id = 'uploadModal';
        modal.style.cssText = `display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:10000`;

        // 弹窗内容布局
        modal.innerHTML = `
        <div style="background:white;padding:20px;border-radius:8px;width:90%;max-width:1000px;box-shadow:0 5px 15px rgba(0,0,0,0.3);display:flex;flex-direction:column;max-height:80vh">
            <div style="margin-bottom:15px">
                <h3 style="margin:0 0 10px 0;color:#333">上传图片</h3>
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div style="font-size:14px;color:#666">提示：可粘贴(Ctrl+V)或拖拽图片，点击遮罩层隐藏弹窗</div>
                    <div id="imageCount" style="font-size:14px;color:#666">共 <span id="countValue">0</span> 张图片待上传</div>
                </div>
            </div>

            <div style="display:flex;flex:1;gap:20px;overflow:hidden">
                <!-- 左侧缩略图列表（仅竖直滚动） -->
                <div style="width:200px;display:flex;flex-direction:column;flex-shrink:0">
                    <div style="margin-bottom:10px;font-weight:bold">已添加图片：</div>
                    <div id="previewImages" style="flex:1;display:flex;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden;padding:10px;border:1px solid #eee;border-radius:4px;">
                        <!-- 缩略图会动态添加到这里 -->
                    </div>
                </div>

                <!-- 右侧大图预览 -->
                <div id="largeImageContainer" style="flex:1;display:flex;align-items:center;justify-content:center;border:1px solid #eee;border-radius:4px;padding:20px;min-height:300px">
                    <div style="color:#999;text-align:center">
                        <div>请选择一张图片进行预览</div>
                    </div>
                </div>
            </div>

            <div style="text-align:right;margin-top:20px">
                <button id="cancelBtn" style="padding:6px 12px;background:#64748B;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px">取消并清空</button>
                <button id="uploadBtnModal" style="padding:6px 12px;background:#10B981;color:white;border:none;border-radius:4px;cursor:pointer">尝试上传</button>
            </div>
        </div>
    `;
        document.body.appendChild(modal);
        previewImagesContainer = modal.querySelector('#previewImages');
        largeImageContainer = modal.querySelector('#largeImageContainer');
    }

    // 检查图片重复
    function isImageDuplicate(newImage) {
        return pastedImages.some(img => img.name === newImage.name && img.size === newImage.size);
    }

    // 更新预览
    function updatePreview() {
        if (!previewImagesContainer) return;
        previewImagesContainer.innerHTML = '';

        // 更新图片计数
        document.getElementById('countValue').textContent = pastedImages.length;

        if (pastedImages.length === 0) {
            largeImageContainer.innerHTML = `
            <div style="color:#999;text-align:center">
                <div>请选择一张图片进行预览</div>
            </div>
        `;
            currentImageIndex = 0;
            return;
        }

        // 确保当前索引有效
        if (currentImageIndex >= pastedImages.length) {
            currentImageIndex = pastedImages.length - 1;
        }

        pastedImages.forEach((image, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                const isSelected = index === currentImageIndex;
                imgContainer.style.cssText = `position:relative;width:100%;height:80px;${isSelected ? 'border:2px solid #3B82F6;' : 'border:1px solid transparent;'}`;
                imgContainer.innerHTML = `
                <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;cursor:pointer" alt="${image.name}">
                <div style="position:absolute;bottom:0;left:0;right:0;padding:2px 5px;background:rgba(0,0,0,0.6);color:white;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${image.name}</div>
                <button style="position:absolute;top:-5px;right:-5px;background:red;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;z-index:10">×</button>
                ${isSelected ? '<div style="position:absolute;top:5px;left:5px;background:#3B82F6;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px">✓</div>' : ''}
            `;

                // 事件绑定
                const img = imgContainer.querySelector('img');
                const delBtn = imgContainer.querySelector('button');

                // 点击缩略图更新大图预览
                img.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateLargeImagePreview(e.target.result, image.name);
                    // 更新所有缩略图的选中状态
                    Array.from(previewImagesContainer.children).forEach((child, i) => {
                        child.style.border = i === index ? '2px solid #3B82F6' : '1px solid transparent';
                        const checkMark = child.querySelector('div:last-child');
                        if (checkMark) checkMark.style.display = i === index ? 'flex' : 'none';
                    });
                });

                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pastedImages.splice(index, 1);
                    if (index === currentImageIndex) {
                        currentImageIndex = Math.min(currentImageIndex, pastedImages.length - 1);
                        // 如果还有图片，更新大图预览
                        if (pastedImages.length > 0) {
                            const firstReader = new FileReader();
                            firstReader.onload = (event) => {
                                updateLargeImagePreview(event.target.result, pastedImages[currentImageIndex].name);
                            };
                            firstReader.readAsDataURL(pastedImages[currentImageIndex]);
                        } else {
                            largeImageContainer.innerHTML = `
                            <div style="color:#999;text-align:center">
                                <div>请选择一张图片进行预览</div>
                            </div>
                        `;
                        }
                    } else if (index < currentImageIndex) {
                        currentImageIndex--;
                    }
                    updatePreview();
                });

                previewImagesContainer.appendChild(imgContainer);

                // 如果是当前选中的图片，更新大图预览
                if (isSelected) {
                    updateLargeImagePreview(e.target.result, image.name);
                }
            };
            reader.readAsDataURL(image);
        });
    }

    // 更新大图预览
    function updateLargeImagePreview(src, name) {
        largeImageContainer.innerHTML = `
        <div style="text-align:center;">
            <div style="margin-bottom:10px;font-weight:bold;word-break:break-all;">${name}</div>
            <img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;max-height:500px">
        </div>
    `;
    }

    // 插入文本到编辑器
    function insertTextToEditor(html, text) {
        if (!editorDoc) return;
        try {
            if (html.trim()) editorDoc.execCommand('insertHTML', false, html);
            else if (text.trim()) editorDoc.execCommand('insertText', false, text);
        } catch (e) {
            const range = editorDoc.getSelection().getRangeAt(0);
            range.deleteContents();
            if (html.trim()) {
                const div = editorDoc.createElement('div');
                div.innerHTML = html;
                range.insertNode(div);
            } else {
                range.insertNode(editorDoc.createTextNode(text));
            }
            range.collapse(false);
        }
    }

    // 添加图片到预览
    function addImages(images) {
        let added = false;
        modal.style.display = 'flex';
        isModalVisible = true;
        images.forEach(blob => {
            let fileName = blob.name || 'unknown-image.png';
            if (!fileName.includes('.')) fileName += `.${blob.type.split('/')[1] || 'png'}`;
            const newImage = new File([blob], fileName, { type: blob.type });
            if (!isImageDuplicate(newImage)) {
                pastedImages.push(newImage);
                added = true;
            }
        });
        if (added) {
            currentImageIndex = pastedImages.length - 1;
            updatePreview();
        }
    }

    // 处理粘贴事件（全局）
    function handlePaste(e) {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const plainText = clipboardData.getData('text/plain') || '';
        const htmlContent = clipboardData.getData('text/html') || '';
        const hasText = plainText.trim() || htmlContent.trim();

        const items = clipboardData.items;
        const imageBlobs = [];
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const blob = items[i].getAsFile();
                    blob && imageBlobs.push(blob);
                }
            }
        }

        if (imageBlobs.length) {
            e.preventDefault();
            addImages(imageBlobs);
            hasText && insertTextToEditor(htmlContent, plainText);
        }
    }

    // 处理拖拽
    function setupDragDrop(iframe) {
        const handleDrag = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.type === 'dragover' || e.type === 'dragenter') {
                document.body.classList.add('drag-over');
                document.body.style.border = '2px dashed #3B82F6';
                document.body.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            } else {
                document.body.classList.remove('drag-over');
                document.body.style.border = '';
                document.body.style.backgroundColor = '';
            }
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrag(e);

            const files = e.dataTransfer.files;
            if (files.length) {
                const images = Array.from(files).filter(f => f.type.startsWith('image/'));
                if (images.length) {
                    addImages(images);
                }
            }
        };

        ['dragenter', 'dragover', 'dragleave'].forEach(type => {
            document.addEventListener(type, handleDrag);
        });
        document.addEventListener('drop', handleDrop);

        const bindIframeDragEvents = (doc) => {
            ['dragenter', 'dragover', 'dragleave'].forEach(type => {
                doc.removeEventListener(type, handleDrag);
                doc.addEventListener(type, handleDrag);
            });

            doc.removeEventListener('drop', handleDrop);
            doc.addEventListener('drop', handleDrop);
        };

        if (iframe.contentDocument) {
            bindIframeDragEvents(iframe.contentDocument);
        }

        iframe.addEventListener('load', () => {
            bindIframeDragEvents(iframe.contentDocument);
        });
    }

    // 全局粘贴监听（包括iframe）
    function setupPasteListener(iframe) {
        document.addEventListener('paste', handlePaste);

        const bindIframePasteEvent = (doc) => {
            doc.removeEventListener('paste', handlePaste);
            doc.addEventListener('paste', handlePaste);
        };

        if (iframe.contentDocument) {
            bindIframePasteEvent(iframe.contentDocument);
        }

        iframe.addEventListener('load', () => {
            bindIframePasteEvent(iframe.contentDocument);
        });
    }

    // 绑定全局键盘事件（仅保留回车上传）
    function bindGlobalKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!isModalVisible) return;

            const uploadButton = modal.querySelector('#uploadBtnModal');
            // 仅保留回车键触发上传
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                uploadButton.click();
                return;
            }
        });
    }

    // 绑定按钮事件
    function bindEvents() {
        // 打开弹窗
        document.getElementById('customUploadBtn').addEventListener('click', () => {
            modal.style.display = 'flex';
            isModalVisible = true;
        });

        // 关闭弹窗
        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            modal.style.display = 'none';
            isModalVisible = false;
            pastedImages = [];
            currentImageIndex = 0;
            updatePreview();
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                isModalVisible = false;
            }
        });

        // 上传图片
        const uploadButton = modal.querySelector('#uploadBtnModal');
        uploadButton.addEventListener('click', () => {
            if (pastedImages.length === 0) {
                alert('请先添加图片');
                return;
            }
            const fileInput = document.querySelector('#imgSpanButtonPlaceholder input[type="file"]');
            const dataTransfer = new DataTransfer();
            pastedImages.forEach(img => dataTransfer.items.add(img));
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            modal.style.display = 'none';
            isModalVisible = false;
            pastedImages = [];
            currentImageIndex = 0;
            updatePreview();
        });
    }

    // 立即初始化
    initImageHandler();

})();