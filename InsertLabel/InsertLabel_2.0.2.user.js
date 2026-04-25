// ==UserScript==
// @name         [MT论坛]发帖辅助工具 by：青春向上
// @namespace    https://github.com/qcxs/mtbbs
// @version      2025-12-07
// @description  寻找网页中textarea，为其添加菜单，核心功能插入标签和预览，另配有辅助工具。
// @author       青春向上
// @match        *://bbs.binmt.cc/forum.php?*tid=*
// @match        *://bbs.binmt.cc/*thread-*.html*
// @match        *://bbs.binmt.cc/forum.php?*mod=post*
// @icon         https://bbs.binmt.cc/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // 仅适配发帖页面
    const textarea = document.querySelector('textarea');
    if (!textarea) {
        console.log('未找到textarea元素');
        return;
    }
    // 定义存储在localStorage中的键名
    const QUICK_INPUT = 'QuickInput';
    const MEUN_ITEMS = 'MenuItems';
    const CONNECT_CACHE = 'Connect_Cache';
    const DEFAULT = []

    const localStorageTool = {
        //初始化key为target的localStorage
        initlocalStorage(target) {
            localStorage.setItem(target, JSON.stringify(DEFAULT[target]));
            return this.getBylocalStorage(target);
        },
        // 获取key为target的localStorage的值并转为变量
        getBylocalStorage(target) {
            try {
                // 为空重置数据
                return JSON.parse(localStorage.getItem(target) || this.initlocalStorage(target));
            } catch (error) {
                // 损坏重置数据
                return this.initlocalStorage(target);
            }
        }
    }

    DEFAULT[QUICK_INPUT] = [
        { name: "添加", value: "add" },
        { name: "删除", value: "delete" }
    ]
    DEFAULT[MEUN_ITEMS] = [
        { name: '↶', isShow: true },
        { name: '↷', isShow: true },
        { name: '选择', isShow: true },
        { name: '预览', isShow: true },
        { name: '插图', isShow: true },
        { name: 'B', isShow: true },
        { name: 'S', isShow: true },
        { name: '𝐼', isShow: true },
        { name: 'U', isShow: true },
        { name: 'url', isShow: true },
        { name: 'hr', isShow: true },
        { name: 'code', isShow: true },
        { name: 'color', isShow: true },
        { name: 'size', isShow: true },
        { name: 'img', isShow: true },
        { name: 'hide', isShow: true },
        { name: '更多', isShow: true },
        //默认隐藏，点击更多显示
        { name: '常用语', isShow: false },
        { name: '彩虹字体', isShow: false },
        { name: 'align', isShow: false },
        { name: 'email', isShow: false },
        { name: 'quote', isShow: false },
        { name: 'media', isShow: false },
        { name: 'QQ', isShow: false },
        { name: 'backcolor', isShow: false },
        { name: 'Eruda', isShow: false },
        { name: '移除标签', isShow: false },
        { name: '阻止离开', isShow: false },
        { name: '原布局', isShow: false },
        { name: '帖子缓存', isShow: false },
    ]

    let isRemoveTouchStart = false;
    let ErudaVisible = false;


    // 创建菜单容器
    const menu = document.createElement('div');
    menu.style.cssText = `
            display: flex;
            overflow-y: hidden;
            padding: 4px;
            background: #fff;
            border: 1px solid #ddd;
            gap: 4px;
            `;


    // 菜单选项配置（isShow控制是否显示）

    // 使用localStorage菜单，覆盖旧版
    let menuItems = localStorageTool.getBylocalStorage(MEUN_ITEMS);
    if (menuItems.length !== DEFAULT[MEUN_ITEMS].length) {
        menuItems = localStorageTool.initlocalStorage(MEUN_ITEMS)
    }

    // 渲染菜单
    menu.innerHTML = '';
    menuItems.filter(item => item.isShow).forEach(item => {
        const btn = document.createElement('a');
        btn.textContent = item.name;
        btn.style.cssText = `
                padding: 2px 8px;
                font-size: 12px;
                border: 1px solid #ccc;
                border-radius: 2px;
                background: #f5f5f5;
                white-space: nowrap;
                `;
        btn.addEventListener('click', () => handleAction(item.name));
        menu.appendChild(btn);
    });

    // 将菜单插入到textarea后面
    textarea.parentNode.insertBefore(menu, textarea.nextSibling);

    // 添加间距样式
    menu.style.marginTop = '4px';

    // 使用Switch处理菜单操作
    function handleAction(name) {
        //首次点击按钮时，禁用侧边栏
        if (!isRemoveTouchStart) {
            try {
                window.$('html').off('touchstart');
                // 打开侧边栏 comiis_leftnv()
                console.log('移除滑动打开侧边栏')
            } catch (error) {
                console.log('可能没有侧边栏', error)
            }
            // 每30秒，将textarea中内容保存在缓存中
            setInterval(() => {
                const textarea = document.querySelector('textarea');
                if (textarea.value.length > 200) {
                    localStorage.setItem(CONNECT_CACHE, textarea.value)
                    console.log('缓存帖子内容。')
                }
            }, 30000)

            isRemoveTouchStart = true;
        }
        // 获取选中文本信息
        const textarea = document.querySelector('textarea');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        // 使用switch处理不同操作
        switch (name) {
            case '↶': {
                document.execCommand('undo', false, null);
            }
                break;
            case '↷': {
                document.execCommand('redo', false, null);
            }
                break;
            case '常用语':
                selectDia(localStorageTool.getBylocalStorage(QUICK_INPUT), (value) => {
                    if (value === 'add') {
                        inputDia([
                            { placeholder: '请输入备注：' },
                            { placeholder: '请输入内容：' },
                        ], (name, value) => {
                            if (name.trim() && value.trim()) {
                                // 向前面添加
                                const arr = localStorageTool.getBylocalStorage(QUICK_INPUT);
                                arr.unshift({ name, value });
                                localStorage.setItem(QUICK_INPUT, JSON.stringify(arr));
                            }
                        });
                    } else if (value === 'delete') {
                        selectDia(localStorageTool.getBylocalStorage(QUICK_INPUT), (value) => {
                            // 删除（不能删除"添加"和"删除"）
                            if (value === "add" || value === "delete") return false;

                            const arr = localStorageTool.getBylocalStorage(QUICK_INPUT);
                            const newArr = arr.filter(item => item.value !== value);
                            if (newArr.length < arr.length) {
                                localStorage.setItem(QUICK_INPUT, JSON.stringify(newArr));
                            }
                        }, "请选择要删除的常用语：");
                    } else {
                        insertTextAndScroll(`${selectedText}${value}`);
                    }
                }, "请选择常用语/操作：");
                break;
            case '预览':
                showPreviewPopup(replaceText(textarea.value));
                break;
            case '选择':
                selectIncludingBrackets();
                break;
            case '彩虹字体':
                rainbowTextGenerator(`${selectedText}`, (code) => {
                    insertTextAndScroll(`${code}`);
                });
                break;
            case '插图':
                pictureManagementTool()
                break;
            case 'B':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[b]${text}[/b]`);
                    })
                    return;
                }
                insertTextAndScroll(`[b]${selectedText}[/b]`);
                break;
            case '𝐼':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[i]${text}[/i]`);
                    })
                    return;
                }
                insertTextAndScroll(`[i]${selectedText}[/i]`);
                break;
            case 'U':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[u]${text}[/u]`);
                    })
                    return;
                }
                insertTextAndScroll(`[u]${selectedText}[/u]`);
                break;
            case 'S':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[s]${text}[/s]`);
                    })
                    return;
                }
                insertTextAndScroll(`[s]${selectedText}[/s]`);
                break;
            case 'size':
                selectDia([
                    { name: '1号文字', value: `[size=1]${selectedText}[/size]`, css: "font-size: 8px;" },
                    { name: '2号文字', value: `[size=2]${selectedText}[/size]`, css: "font-size: 10px;" },
                    { name: '3号文字', value: `[size=3]${selectedText}[/size]`, css: "font-size: 12px;" },
                    { name: '4号文字', value: `[size=4]${selectedText}[/size]`, css: "font-size: 14px;" },
                    { name: '5号文字', value: `[size=5]${selectedText}[/size]`, css: "font-size: 18px;" },
                    { name: '6号文字', value: `[size=6]${selectedText}[/size]`, css: "font-size: 24px;" },
                    { name: '7号文字', value: `[size=7]${selectedText}[/size]`, css: "font-size: 35px;" },
                    { name: '8号文字', value: `[size=8]${selectedText}[/size]`, css: "font-size: 35px;" },
                    { name: '9号文字', value: `[size=9]${selectedText}[/size]`, css: "font-size: 35px;" }
                ], (value) => {
                    insertTextAndScroll(`${value}`);
                }, "请选择字号：");
                break;
            case 'color':
            case 'backcolor':
                const text = name === 'color' ? 'color' : 'backcolor';
                const textText = name === 'color' ? 'color' : 'background';
                selectDia([
                    //选项名、插入内容、预览样式(css)
                    { name: '取色器', value: `取色器` },
                    { name: `black`, value: `[${text}=black]${selectedText}[/${text}]`, css: `${textText}: black;` },
                    { name: `white`, value: `[${text}=white]${selectedText}[/${text}]`, css: `${textText}: white;` },
                    { name: `red`, value: `[${text}=red]${selectedText}[/${text}]`, css: `${textText}: red;` },
                    { name: `green`, value: `[${text}=green]${selectedText}[/${text}]`, css: `${textText}: green;` },
                    { name: `blue`, value: `[${text}=blue]${selectedText}[/${text}]`, css: `${textText}: blue;` },
                    { name: `yellow`, value: `[${text}=yellow]${selectedText}[/${text}]`, css: `${textText}: yellow;` },
                    { name: `purple`, value: `[${text}=purple]${selectedText}[/${text}]`, css: `${textText}: purple;` },
                    { name: `orange`, value: `[${text}=orange]${selectedText}[/${text}]`, css: `${textText}: orange;` },
                    { name: `pink`, value: `[${text}=pink]${selectedText}[/${text}]`, css: `${textText}: pink;` },
                    { name: `gray`, value: `[${text}=gray]${selectedText}[/${text}]`, css: `${textText}: gray;` },
                    { name: `brown`, value: `[${text}=brown]${selectedText}[/${text}]`, css: `${textText}: brown;` },
                    { name: `cyan`, value: `[${text}=cyan]${selectedText}[/${text}]`, css: `${textText}: cyan;` },
                    { name: `magenta`, value: `[${text}=magenta]${selectedText}[/${text}]`, css: `${textText}: magenta;` },
                    { name: `olive`, value: `[${text}=olive]${selectedText}[/${text}]`, css: `${textText}: olive;` },
                    { name: `teal`, value: `[${text}=teal]${selectedText}[/${text}]`, css: `${textText}: teal;` },
                    { name: `navy`, value: `[${text}=navy]${selectedText}[/${text}]`, css: `${textText}: navy;` },
                    { name: `maroon`, value: `[${text}=maroon]${selectedText}[/${text}]`, css: `${textText}: maroon;` },
                    { name: `silver`, value: `[${text}=silver]${selectedText}[/${text}]`, css: `${textText}: silver;` },
                    { name: `gold`, value: `[${text}=gold]${selectedText}[/${text}]`, css: `${textText}: gold;` }
                ], (value) => {
                    if (value === '取色器') {
                        // 调用取色器选择颜色并处理
                        showColorPicker((hex) => {
                            insertTextAndScroll(`[${text}=${hex}]${selectedText}[/${text}]`);
                        });
                    } else {
                        insertTextAndScroll(`${value}`);
                    }
                }, "请选择颜色：");
                break;
            case 'url':
                if (!selectedText.trim()) {
                    inputDia([
                        { placeholder: '请输入文字：' },
                        { placeholder: '请输入链接：' },
                    ], (text, url) => {
                        if (!url.trim()) {
                            insertTextAndScroll(`[url]${text}[/url]`);
                        } else {
                            insertTextAndScroll(`[url=${url}]${text}[/url]`);
                        }
                    })
                    return;
                }
                insertTextAndScroll(`[url]${selectedText}[/url]`);
                break;
            case 'email':
                if (!selectedText.trim()) {
                    inputDia([
                        { placeholder: '请输入文字：' },
                        { placeholder: '请输入邮箱：' },
                    ], (text, email) => {
                        if (!email.trim()) {
                            insertTextAndScroll(`[email]${text}[/email]`);
                        } else {
                            insertTextAndScroll(`[email=${email}]${text}[/email]`);
                        }
                    })
                    return;
                }
                insertTextAndScroll(`[email=${selectedText}]${selectedText}[/email]`);
                break;
            case 'img':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入图片链接：' }], (img) => {
                        insertTextAndScroll(`[img]${img}[/img]`);
                    })
                    return;
                }
                insertTextAndScroll(`[img]${selectedText}[/img]`);
                break;
            case 'hr':
                insertTextAndScroll(`[hr]${selectedText}`);
                break;
            case 'align':
                selectDia([
                    { name: '左对齐', value: `[align=left]${selectedText}[/align]`, css: "justify-content: flex-start;" },
                    { name: '居中', value: `[align=center]${selectedText}[/align]`, css: "justify-content: center;" },
                    { name: '右对齐', value: `[align=right]${selectedText}[/align]`, css: "justify-content: flex-end;" },
                ], (value) => {
                    insertTextAndScroll(`${value}`);
                }, "请选择对齐方式：");
                break;
            case 'code':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入code：' }], (code) => {
                        insertTextAndScroll(`[code]${code}[/code]`);
                    })
                    return;
                }
                insertTextAndScroll(`[code]${selectedText}[/code]`);
                break;
            case 'quote':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入引用：' }], (img) => {
                        insertTextAndScroll(`[quote]${img}[/quote]`);
                    })
                    return;
                }
                insertTextAndScroll(`[quote]${selectedText}[/quote]`);
                break;
            case 'hide':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入隐藏内容：' }], (img) => {
                        insertTextAndScroll(`[hide]${img}[/hide]`);
                    })
                    return;
                }
                insertTextAndScroll(`[hide]${selectedText}[/hide]`);
                break;
            case 'media':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入视频链接：' }], (img) => {
                        insertTextAndScroll(`[media=x,500,375]${img}[/media]`);
                    })
                    return;
                }
                insertTextAndScroll(`[media=x,500,375]${selectedText}[/media]`);
                break;
            case 'QQ':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入QQ号：' }], (img) => {
                        insertTextAndScroll(`[qq]${img}[/qq]`);
                    })
                    return;
                }
                insertTextAndScroll(`[qq]${selectedText}[/qq]`);
                break;
            case '更多':
                const newArr = menuItems
                    .filter(item => !item.isShow)
                    .map(item => ({ name: item.name, value: item.name }));
                selectDia(newArr, (name) => {
                    handleAction(name)
                }, '隐藏菜单内容：')
                break;
            case '移除标签': {
                inputDia([
                    { placeholder: '例如：输入color移除所有彩色字体', value: "" },
                ], (lable) => {
                    // 转义name中的特殊字符，避免正则表达式语法错误
                    const escapedName = lable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\[(?:\\/)?${escapedName}(?:=.*?)?\\]`, 'gi');

                    // 替换匹配的内容为空字符串
                    textarea.value = textarea.value.replace(regex, '');
                })
            }
                break;
            case '阻止离开': {
                window.addEventListener('beforeunload', function (e) {
                    e.preventDefault();
                    e.returnValue = ''; // 这行在某些浏览器中是必需的
                    return '您有未保存的内容，确定要离开吗？';
                });
            }
                break;
            case '原布局': {
                const imgList = document.querySelector('#imglist');
                imgList.style.display = imgList.style.display == 'block' ? 'none' : 'block'
            }
                break;
            case '帖子缓存': {
                const cache = localStorage.getItem(CONNECT_CACHE) || '无缓存'
                inputDia([{ placeholder: '缓存内容：(预览)', value: cache }], () => {
                    insertTextAndScroll(cache);
                })
            }
                break;

            case 'Eruda': {
                // 如果已加载过 eruda，直接切换显示状态
                if (window.eruda) {
                    ErudaVisible = !ErudaVisible; // 取反状态
                    ErudaVisible ? eruda.init() : eruda.destroy(); // 显示/隐藏
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/eruda'; // 使用原始src（保留参数）
                script.type = 'text/javascript';

                // 加载成功回调
                script.onload = function () {
                    eruda.init(); // 初始化
                    ErudaVisible = true;
                };

                // 添加到页面
                document.head.appendChild(script);
            }
                break;
            // case '阻止离开': {

            // }
            // break;

            default:
                alert('未知操作');
                return;
        }
    }


    // 插入文本并滚动至光标位置，且选中插入的文字
    function insertTextAndScroll(text) {
        // 论坛字符上限，插入大量字符也会卡死，取消插入。
        if (text.length > 20000) {
            alert('你插入的字符数已超过20000，已取消本次插入！')
            return;
        }
        const el = document.querySelector('textarea');
        if (!el || !text) return; // 增加容错

        el.focus(); // 聚焦元素
        const startPos = el.selectionStart; // 记录插入前的光标起始位置
        const endPos = el.selectionEnd;     // 记录插入前的光标结束位置（处理原有选中内容）

        // 执行插入文本命令
        const isSuccess = document.execCommand('insertText', false, text);

        // 若execCommand失败，手动处理文本插入和选区
        if (!isSuccess) {
            const currentValue = el.value;
            // 替换原有选中内容为新文本
            const newValue = currentValue.substring(0, startPos) + text + currentValue.substring(endPos);
            el.value = newValue;
        }
        // 调整选区为插入的文本
        el.selectionStart = startPos;
        el.selectionEnd = startPos + text.length;

        // textarea内部滚动（简易版：按行号粗略滚动）
        if (el.tagName === 'TEXTAREA') {
            const caretPos = el.selectionEnd; // 用选区结束位置计算行号
            const rowCount = el.value.slice(0, caretPos).split('\n').length; // 光标行号
            // 动态获取行高（更精准）
            const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
            el.scrollTop = rowCount * lineHeight - el.clientHeight / 2; // 居中行
        }
    }

    // 选择弹窗
    function selectDia(options, callback, title = "请选择") {
        // 生成唯一ID
        const dialogId = `select-dialog-${Date.now()}`;
        // 创建容器并拼接DOM结构
        const container = document.createElement('div');
        // 动态添加选中样式的CSS（避免全局样式污染）
        const style = document.createElement('style');
        style.textContent = `
        .select-dialog-selected {
            background: #e6f3ff !important; /* 选中样式，!important确保优先级 */
        }
    `;
        document.head.appendChild(style);

        container.innerHTML = `
    <div class="mask" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;" onclick="this.parentElement.remove()">
        <div class="dialog" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;border:1px solid #ccc;border-radius:4px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);padding:0;z-index:1000;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #eee;">
                <span>${title}</span>
                <button style="background:none;border:none;font-size:16px;cursor:pointer;padding:0;line-height:1;" onclick="this.closest('.mask').parentElement.remove()">×</button>
            </div>
            <div style="max-height:50vh;overflow-y:auto;padding:8px 0;scrollbar-width:thin;">
                <ul style="list-style:none;margin:0;padding:0;">
                    ${options.map((opt, i) => `
                        <li style="padding:8px 16px;cursor:pointer;display:flex;align-items:center;${opt.css || ''}" class="${i === 0 ? 'select-dialog-selected' : ''}"
                            onclick="this.parentElement.querySelectorAll('li').forEach(li=>li.classList.remove('select-dialog-selected'));this.classList.add('select-dialog-selected');this.querySelector('input').checked=true;">
                            <input type="radio" name="${dialogId}" id="${dialogId}-${i}" value="${opt.value || i}" style="margin-right:8px;" ${i === 0 ? 'checked' : ''}>
                            <label for="${dialogId}-${i}">${opt.name}</label>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 16px;border-top:1px solid #eee;">
                <button style="padding:6px 16px;border-radius:4px;cursor:pointer;background:#fff;border:1px solid #ccc;" onclick="this.closest('.mask').parentElement.remove()">取消</button>
                <button class="confirm-btn" style="padding:6px 16px;border-radius:4px;cursor:pointer;background:#409eff;color:#fff;border:none;">确定</button>
            </div>
        </div>
    </div>
    `;
        // 阻止弹窗内部点击冒泡到遮罩层
        container.querySelector('.dialog').addEventListener('click', e => e.stopPropagation());
        // 确定按钮点击事件
        const confirmBtn = container.querySelector('.confirm-btn');
        confirmBtn.addEventListener('click', () => {
            const selectedRadio = container.querySelector(`input[name="${dialogId}"]:checked`);
            if (selectedRadio && typeof callback === 'function') {
                callback(selectedRadio.value);
            }
            container.remove();
            document.head.removeChild(style); // 移除动态添加的样式，避免内存泄漏
        });
        // 添加到页面
        document.body.appendChild(container);
    }

    // 动态输入框，可以定义输入个数
    function inputDia(inputConfigs, callback) {
        // 创建遮罩层
        const mask = document.createElement('div');
        mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;overflow:auto';

        // 构建对话框核心HTML（添加标题区域，调整flex布局）
        mask.innerHTML = `
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:15px;border-radius:8px;z-index:10000;width:80%;max-width:500px;max-height:80vh;display:flex;flex-direction:column;">
  <div style="margin-bottom:10px;flex-shrink:0;">动态输入框</div>
  <div id="inputContainer" style="flex:1;overflow-y:auto;margin-bottom:15px;"></div>
  <div style="text-align:right;flex-shrink:0;">
    <button class="CacheBtn" style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;margin-right:8px">取消</button>
    <button class="OKBtn" style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer">确定</button>
  </div>
</div>
    `;

        // 生成可编辑div（添加outline:none移除焦点高亮）
        const inputContainer = mask.querySelector('#inputContainer');
        inputConfigs.forEach(config => {
            const div = document.createElement('div');
            div.innerHTML = `<label style="display:block;margin-bottom:4px;">${config.placeholder || '请输入'}</label>`;
            const editDiv = document.createElement('div');
            editDiv.contentEditable = true;
            editDiv.style.cssText = 'min-height:80px;padding:10px;border:1px solid #ccc;margin-top:8px;outline:none;';
            editDiv.textContent = config.value || '';
            div.appendChild(editDiv);
            inputContainer.appendChild(div);
        });

        // 遮罩层点击关闭
        mask.addEventListener('click', e => e.target === mask && mask.remove());
        // 取消点击事件
        mask.querySelector('.CacheBtn').addEventListener('click', e => mask.remove());

        // 确定按钮事件 → 已修复换行丢失问题
        mask.querySelector('.OKBtn').addEventListener('click', e => {
            const container = mask.querySelector('#inputContainer');
            // ✅ 修复：使用 innerText 保留换行符
            const values = Array.from(container.querySelectorAll('[contenteditable]')).map(el => el.innerText);
            callback(...values);
            mask.remove();
        });

        document.body.appendChild(mask);
    }

    // 取色器
    function showColorPicker(callback) {
        // 生成唯一ID避免冲突
        const pickerId = `color-picker-${Date.now()}`;

        // 创建主容器并通过innerHTML一次性构建所有结构
        const container = document.createElement('div');
        container.innerHTML = `
        <!-- 半透明背景层 -->
        <div id="${pickerId}-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; box-sizing: border-box; overflow-y: auto;">
            <!-- 弹窗容器 -->
            <div id="${pickerId}-container" style="background: #fff; border-radius: 12px; padding: 20px; width: 100%; max-width: 500px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); position: relative;">
                <!-- 关闭按钮 -->
                <button class="close-btn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>

                <!-- 标题 -->
                <h3 style="margin: 0 0 20px 0; color: #333; font-family: Arial, sans-serif; text-align: center;">选择颜色</h3>

                <!-- 取色器主体 -->
                <div class="color-picker" style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- 颜色选择区域 -->
                    <div class="color-selection" style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                        <div style="display: flex; gap: 15px; align-items: center; width: 100%; justify-content: center;">
                            <!-- 色相滑块 -->
                            <div class="hue-slider" style="width: 30px; height: 240px; border-radius: 15px; position: relative; background: linear-gradient(to top, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%));">
                                <div class="hue-handle" style="width: 40px; height: 12px; border-radius: 6px; background: white; border: 2px solid #333; position: absolute; left: -5px; cursor: pointer; top: 0;"></div>
                            </div>

                            <!-- 颜色面板 -->
                            <div style="position: relative; width: calc(100% - 60px); max-width: 240px;">
                                <canvas class="color-panel" width="240" height="240" style="border: 1px solid #ccc; border-radius: 8px; width: 100%;"></canvas>
                                <div class="color-handle" style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px black; position: absolute; cursor: pointer; top: 0; left: 0;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 控制区域 -->
                    <div class="controls" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                        <!-- Hex输入 -->
                        <div class="hex" style="display: flex; align-items: center; gap: 10px;">
                            <label style="font-family: Arial, sans-serif; color: #555; width: 40px;">Hex:</label>
                            <input type="text" id="${pickerId}-hex" value="#0532ff" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; flex-grow: 1; font-size: 16px;">
                        </div>

                        <!-- RGB滑块 -->
                        <div class="rgb-row" style="display: flex; align-items: center; gap: 10px;">
                            <label style="font-family: Arial, sans-serif; color: #555; width: 40px;">R:</label>
                            <input type="range" id="${pickerId}-r" min="0" max="255" value="5" style="flex-grow: 1;">
                            <span id="${pickerId}-r-value" style="width: 40px; text-align: right;">5</span>
                        </div>
                        <div class="rgb-row" style="display: flex; align-items: center; gap: 10px;">
                            <label style="font-family: Arial, sans-serif; color: #555; width: 40px;">G:</label>
                            <input type="range" id="${pickerId}-g" min="0" max="255" value="50" style="flex-grow: 1;">
                            <span id="${pickerId}-g-value" style="width: 40px; text-align: right;">50</span>
                        </div>
                        <div class="rgb-row" style="display: flex; align-items: center; gap: 10px;">
                            <label style="font-family: Arial, sans-serif; color: #555; width: 40px;">B:</label>
                            <input type="range" id="${pickerId}-b" min="0" max="255" value="255" style="flex-grow: 1;">
                            <span id="${pickerId}-b-value" style="width: 40px; text-align: right;">255</span>
                        </div>
                    </div>

                    <!-- 底部按钮 -->
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="cancel-btn" style="flex: 1; padding: 12px; background: #f0f0f0; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">取消</button>
                        <button class="confirm-btn" style="flex: 1; padding: 12px; background: #0532ff; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">确定</button>
                    </div>
                </div>
            </div>
        </div>
    `;

        // 添加到页面
        document.body.appendChild(container);

        // 获取DOM元素引用
        const overlay = document.getElementById(`${pickerId}-overlay`);
        const pickerContainer = document.getElementById(`${pickerId}-container`);
        const closeBtn = pickerContainer.querySelector('.close-btn');
        const hueSlider = pickerContainer.querySelector('.hue-slider');
        const hueHandle = pickerContainer.querySelector('.hue-handle');
        const colorPanel = pickerContainer.querySelector('.color-panel');
        const colorHandle = pickerContainer.querySelector('.color-handle');
        const hexInput = document.getElementById(`${pickerId}-hex`);
        const rSlider = document.getElementById(`${pickerId}-r`);
        const gSlider = document.getElementById(`${pickerId}-g`);
        const bSlider = document.getElementById(`${pickerId}-b`);
        const rValue = document.getElementById(`${pickerId}-r-value`);
        const gValue = document.getElementById(`${pickerId}-g-value`);
        const bValue = document.getElementById(`${pickerId}-b-value`);
        const confirmBtn = pickerContainer.querySelector('.confirm-btn');
        const cancelBtn = pickerContainer.querySelector('.cancel-btn');

        // 颜色变量
        let h = 251; // 初始色相（对应#0532ff）
        let s = 98;  // 初始饱和度
        let l = 51;  // 初始亮度
        let savedHexValue = hexInput.value; // 保存初始Hex值

        // 移除弹窗的函数
        function removePicker() {
            container.remove();
        }

        // 关闭按钮事件
        closeBtn.addEventListener('click', removePicker);
        cancelBtn.addEventListener('click', removePicker);

        // 确定按钮事件
        confirmBtn.addEventListener('click', () => {
            if (typeof callback === 'function') {
                callback(hexInput.value);
            }
            removePicker();
        });

        // HSL转RGB
        function hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        // RGB转HSL
        function rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) {
                h = s = 0;
            } else {
                const delta = max - min;
                s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
                switch (max) {
                    case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / delta + 2; break;
                    case b: h = (r - g) / delta + 4; break;
                }
                h /= 6;
            }
            h = Math.round(h * 360);
            s = Math.round(s * 100);
            l = Math.round(l * 100);
            return [h, s, l];
        }

        // 绘制颜色面板
        function drawColorPanel() {
            const displayWidth = colorPanel.offsetWidth;
            const displayHeight = colorPanel.offsetHeight;
            const canvasWidth = colorPanel.width;
            const canvasHeight = colorPanel.height;
            const scaleX = canvasWidth / displayWidth;
            const scaleY = canvasHeight / displayHeight;

            const ctx = colorPanel.getContext('2d');
            const imageData = ctx.createImageData(canvasWidth, canvasHeight);
            const data = imageData.data;

            for (let y = 0; y < canvasHeight; y++) {
                for (let x = 0; x < canvasWidth; x++) {
                    const sVal = x / canvasWidth;
                    const lVal = (canvasHeight - y) / canvasHeight;
                    const [r, g, b] = hslToRgb(h, sVal * 100, lVal * 100);
                    const i = (y * canvasWidth + x) * 4;
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = 255;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // 更新色相滑块位置
        function updateHueHandlePosition() {
            const height = hueSlider.offsetHeight;
            const top = height - (h / 360) * height;
            hueHandle.style.top = `${top}px`;
        }

        // 更新颜色手柄位置
        function updateColorHandlePosition() {
            const width = colorPanel.offsetWidth;
            const height = colorPanel.offsetHeight;
            const handleSize = 20;
            const x = (s / 100) * width - handleSize / 2;
            const y = height - (l / 100) * height - handleSize / 2;
            colorHandle.style.left = `${x}px`;
            colorHandle.style.top = `${y}px`;
        }

        // 更新RGB滑块和显示
        function updateRGBSliders(r, g, b) {
            rSlider.value = r;
            rValue.textContent = r;
            gSlider.value = g;
            gValue.textContent = g;
            bSlider.value = b;
            bValue.textContent = b;
        }

        // 更新Hex输入框
        function updateHexInput(r, g, b) {
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            hexInput.value = hex;
            savedHexValue = hex;
        }

        // 从HSL更新界面
        function updateFromHSL() {
            const [r, g, b] = hslToRgb(h, s, l);
            updateRGBSliders(r, g, b);
            updateHexInput(r, g, b);
            drawColorPanel();
            updateColorHandlePosition();
        }

        // 从RGB更新界面
        function updateFromRGB() {
            const r = parseInt(rSlider.value);
            const g = parseInt(gSlider.value);
            const b = parseInt(bSlider.value);
            [h, s, l] = rgbToHsl(r, g, b);
            updateHueHandlePosition();
            drawColorPanel();
            updateColorHandlePosition();
            updateHexInput(r, g, b);
        }

        // 从Hex更新界面
        function updateFromHex(hex) {
            hex = hex.replace(/^#/, '');
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (hex.length !== 6) hex = '0532ff';
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            updateRGBSliders(r, g, b);
            updateFromRGB();
        }

        // Hex输入框事件处理
        hexInput.addEventListener('focus', () => {
            savedHexValue = hexInput.value;
        });

        hexInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const filtered = value.replace(/[^#0-9a-fA-F]/g, '');
            const hashIndex = filtered.indexOf('#');

            if (hashIndex > 0) {
                const withoutHash = filtered.replace(/#/g, '');
                e.target.value = '#' + withoutHash.substring(0, 6);
            } else if (hashIndex === 0) {
                e.target.value = filtered.substring(0, 7);
            } else {
                e.target.value = filtered.substring(0, 6);
            }

            const currentValue = e.target.value;
            if ((currentValue.length === 7 && currentValue.startsWith('#')) ||
                (currentValue.length === 6 && !currentValue.startsWith('#'))) {
                updateFromHex(currentValue);
            }
        });

        hexInput.addEventListener('blur', () => {
            const value = hexInput.value.replace(/^#/, '').toUpperCase();
            if (/^[0-9A-F]{6}$/.test(value)) {
                hexInput.value = '#' + value;
                updateFromHex(hexInput.value);
            } else {
                hexInput.value = savedHexValue;
            }
        });

        // 监听色相条拖动
        let isHueDragging = false;
        const handleHueDrag = (e) => {
            if (!isHueDragging) return;
            e.preventDefault();

            const rect = hueSlider.getBoundingClientRect();
            let y = e.type.includes('touch')
                ? e.touches[0].clientY - rect.top
                : e.clientY - rect.top;

            h = 360 - (y / rect.height) * 360;
            h = Math.max(0, Math.min(360, h));
            updateHueHandlePosition();
            updateFromHSL();
        };

        hueSlider.addEventListener('mousedown', (e) => { isHueDragging = true; handleHueDrag(e); });
        hueSlider.addEventListener('touchstart', (e) => { isHueDragging = true; handleHueDrag(e); });
        document.addEventListener('mousemove', handleHueDrag);
        document.addEventListener('touchmove', handleHueDrag);
        document.addEventListener('mouseup', () => isHueDragging = false);
        document.addEventListener('touchend', () => isHueDragging = false);

        // 监听颜色面板拖动
        let isColorDragging = false;
        const handleColorDrag = (e) => {
            if (!isColorDragging) return;
            e.preventDefault();

            const rect = colorPanel.getBoundingClientRect();
            let x = e.type.includes('touch')
                ? e.touches[0].clientX - rect.left
                : e.clientX - rect.left;
            let y = e.type.includes('touch')
                ? e.touches[0].clientY - rect.top
                : e.clientY - rect.top;

            s = (x / rect.width) * 100;
            l = ((rect.height - y) / rect.height) * 100;
            s = Math.max(0, Math.min(100, s));
            l = Math.max(0, Math.min(100, l));
            updateColorHandlePosition();
            updateFromHSL();
        };

        colorPanel.addEventListener('mousedown', (e) => { isColorDragging = true; handleColorDrag(e); });
        colorPanel.addEventListener('touchstart', (e) => { isColorDragging = true; handleColorDrag(e); });
        document.addEventListener('mousemove', handleColorDrag);
        document.addEventListener('touchmove', handleColorDrag);
        document.addEventListener('mouseup', () => isColorDragging = false);
        document.addEventListener('touchend', () => isColorDragging = false);

        // 监听RGB滑块变化
        rSlider.addEventListener('input', updateFromRGB);
        gSlider.addEventListener('input', updateFromRGB);
        bSlider.addEventListener('input', updateFromRGB);

        // 响应式调整
        function adjustForScreenSize() {
            const containerWidth = pickerContainer.offsetWidth;
            const colorSelection = pickerContainer.querySelector('.color-selection');

            if (containerWidth < 350) {
                colorSelection.style.flexDirection = 'column';
                hueSlider.style.width = '100%';
                hueSlider.style.height = '30px';
                hueSlider.style.background = 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))';
                hueHandle.style.width = '12px';
                hueHandle.style.height = '40px';
                hueHandle.style.left = '0';
                hueHandle.style.top = '-5px';

                updateHueHandlePosition = () => {
                    const width = hueSlider.offsetWidth;
                    const left = (h / 360) * width;
                    hueHandle.style.left = `${left}px`;
                };
            } else {
                colorSelection.style.flexDirection = 'row';
                hueSlider.style.width = '30px';
                hueSlider.style.height = '240px';
                hueSlider.style.background = 'linear-gradient(to top, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))';
                hueHandle.style.width = '40px';
                hueHandle.style.height = '12px';
                hueHandle.style.left = '-5px';
                hueHandle.style.top = '0';

                updateHueHandlePosition = () => {
                    const height = hueSlider.offsetHeight;
                    const top = height - (h / 360) * height;
                    hueHandle.style.top = `${top}px`;
                };
            }

            drawColorPanel();
            updateHueHandlePosition();
        }

        // 初始化
        updateFromHex(hexInput.value);
        updateHueHandlePosition();
        drawColorPanel();
        updateColorHandlePosition();
        adjustForScreenSize();

        // 窗口大小变化监听
        window.addEventListener('resize', adjustForScreenSize);

        // 移除弹窗时清理事件
        const originalRemovePicker = removePicker;
        removePicker = () => {
            window.removeEventListener('resize', adjustForScreenSize);
            originalRemovePicker();
        };
    }

    // 获取表情图片URL的函数（基于已有全局变量smilies_array数据）
    function getSmileyUrl(smileyKey) {
        // 基础URL（公用部分）
        const baseUrl = "https://cdn-bbs.mt2.cn/static/image/smiley/";
        const smilies_array = window.smilies_array || []

        // 遍历所有表情类型（12、5、14）
        for (const type in smilies_array) {
            if (smilies_array.hasOwnProperty(type)) {
                // 遍历该类型下的所有分页
                const pages = smilies_array[type];
                for (const page in pages) {
                    if (pages.hasOwnProperty(page)) {
                        // 遍历当前分页的所有表情
                        const smilies = pages[page];
                        for (const smiley of smilies) {
                            // 找到匹配的表情标识（smiley[1]是表情标识）
                            if (smiley[1] === smileyKey) {
                                // 获取文件夹名称（smilies_type中'_类型'对应的文件夹）
                                const folder = smilies_type[`_${type}`][1];
                                // 获取文件名（smiley[2]是文件名）
                                const fileName = smiley[2];
                                // 拼接完整URL并返回
                                return `${baseUrl}${folder}/${fileName}`;
                            }
                        }
                    }
                }
            }
        }

        // 未找到对应表情时返回null
        return null;
    }

    //bbcode2html，来源于：https://greasyfork.org/zh-CN/scripts/401359-mt%E8%AE%BA%E5%9D%9B
    function replaceText(text) {

        // 特殊字符转义预处理函数，防止文字被误以为html进行解析
        function escapeHtml(str) {
            if (typeof str !== 'string') return str; // 非字符串类型直接返回
            return str.replace(/[&<>"']/g, (match) => {
                const escapeMap = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                };
                return escapeMap[match];
            });
        }

        //  1. 提取[code]标签内容并替换为占位符
        const codeBlocks = []; // 存储处理后的代码块HTML
        let codeIndex = 0; // 代码块索引        
        let processedText = escapeHtml(text);// 执行转义预处理

        // 提取所有[code]标签内容
        processedText = processedText.replace(
            /\[code\]([\s\S]*?)\[\/code\]/g,
            (match, codeContent) => {
                // 提前处理代码块内容（转换为HTML）
                let brSplit = codeContent.split("\n");
                let content = brSplit.map(line => `<li style='list-style:auto'>${line}</li>`).join('');
                let codeHtml = `<div class="comiis_blockcode comiis_bodybg b_ok f_b"><div class="bg_f b_l"><ol>${content}</ol></div></div>`;

                // 存储处理后的HTML并返回占位符
                const placeholder = `__CODE_BLOCK_${codeIndex}__`;
                codeBlocks.push(codeHtml);
                codeIndex++;
                return placeholder;
            }
        );

        //  2. 处理其他所有标签（此时[code]已被占位符替代，不参与解析）
        // 处理[attachimg]标签
        let attachimgmatch = processedText.match(/\[attachimg\]([\s\S]+?)\[\/attachimg\]/g);
        if (attachimgmatch) {
            attachimgmatch.forEach((item) => {
                let aimgidMatch = item.match(/\[attachimg\]([\s\S]+?)\[\/attachimg\]/);
                let aimg_id = aimgidMatch ? aimgidMatch[1] : "";
                let imgElement = document.getElementById(`aimg_${aimg_id}`);
                let imgtitle = imgElement ? imgElement.getAttribute("title") : "";
                let imgsrc = imgElement ? imgElement.getAttribute("src") : "";
                if (!imgsrc) {
                    imgtitle = "该图片不存在";
                }
                processedText = processedText.replace(
                    item,
                    `<span class="comiis_postimg vm"><img loading="lazy" id="aimg_${aimg_id}" src="${imgsrc}" alt="${imgtitle}" title="${imgtitle}"></span>`
                );
            });
        }

        // 处理[url]标签
        let url = processedText.match(/\[url(=[\s\S]*?)?\]([\s\S]*?)\[\/url\]/g);
        if (url) {
            url.forEach((item) => {
                let urlMatch = item.match(/\[url(?:=([\s\S]*?))?\]([\s\S]*?)\[\/url\]/);
                if (urlMatch) {
                    let _url_ = urlMatch[1] ? urlMatch[1].trim() : urlMatch[2].trim();
                    let _url_name_ = urlMatch[1] ? urlMatch[2].trim() : _url_;
                    processedText = processedText.replace(item, `<a style='color:#507daf' href="${_url_}" target="_blank">${_url_name_}</a>`);
                }
            });
        }

        // 处理[color]标签
        let color = processedText.match(/\[color\=[\s\S]*?\]([\s\S]*?)\[\/color\]/g);
        if (color) {
            color.forEach((item) => {
                let colorMatch = item.match(/\[color=([\s\S]*?)\]([\s\S]*?)\[\/color\]/);
                let colorValue = colorMatch ? colorMatch[1] : "";
                let colorText = colorMatch ? colorMatch[2] : "";
                processedText = processedText.replace(item, `<font color='${colorValue}'>${colorText}</font>`);
            });
        }

        // 处理[backcolor]标签
        let backcolor = processedText.match(/\[backcolor\=[\s\S]*?\]([\s\S]*?)\[\/backcolor\]/g);
        if (backcolor) {
            backcolor.forEach((item) => {
                let backcolorMatch = item.match(/\[backcolor=([\s\S]*?)\]([\s\S]*?)\[\/backcolor\]/);
                let backcolorValue = backcolorMatch ? backcolorMatch[1] : "";
                let backcolorText = backcolorMatch ? backcolorMatch[2] : "";
                processedText = processedText.replace(item, `<font style="background-color:${backcolorValue}">${backcolorText}</font>`);
            });
        }

        // 处理[size]标签
        let size = processedText.match(/\[size\=[\s\S]*?\]([\s\S]*?)\[\/size\]/g);
        if (size) {
            size.forEach((item) => {
                let sizeMatch = item.match(/\[size=([\s\S]*?)\]([\s\S]*?)\[\/size\]/);
                let sizeValue = sizeMatch ? sizeMatch[1] : "";
                let sizeText = sizeMatch ? sizeMatch[2] : "";
                processedText = processedText.replace(item, `<font size="${sizeValue}">${sizeText}</font>`);
            });
        }

        // 处理[img]标签
        let img = processedText.match(/\[img(|\=[\s\S]+?)\]([\s\S]*?)\[\/img\]/g);
        if (img) {
            img.forEach((item) => {
                let widthInfo = "100%";
                let heightInfo = "";
                let imgSizeMatch = item.match(/\[img\=([\s\S]+?)\]([\s\S]*?)\[\/img\]/);
                if (imgSizeMatch) {
                    let sizeArr = imgSizeMatch[1].split(",");
                    widthInfo = sizeArr[0] || "100%";
                    heightInfo = sizeArr[1] || "";
                }
                let contentMatch = item.match(/\[img(|\=[\s\S]+?)\]([\s\S]*?)\[\/img\]/);
                let content = contentMatch ? contentMatch[2] : "";
                processedText = processedText.replace(
                    item,
                    `<img loading="lazy" src="${content}" border="0" alt="" width="${widthInfo}" height="${heightInfo}" crossoriginNew="anonymous">`
                );
            })
        }

        // 处理[hide]标签（无参数）
        let hide = processedText.match(/\[hide\]([\s\S]*?)\[\/hide\]/g);
        if (hide) {
            hide.forEach((item) => {
                let contentMatch = item.match(/\[hide\]([\s\S]*?)\[\/hide\]/);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(
                    item,
                    `<div class="comiis_quote bg_h f_c"><h2 class="f_a">本帖隐藏的内容: </h2>${content}</div>`
                );
            });
        }

        // 处理[hide=参数]标签
        let hide2 = processedText.match(/\[hide=[\s\S]*?\]([\s\S]*?)\[\/hide\]/g);
        if (hide2) {
            hide2.forEach((item) => {
                let match = item.match(/\[hide=([\s\S]*?)\]([\s\S]*?)\[\/hide\]/);
                let otherInfo = match ? match[1].split(",") : [];
                let integral = otherInfo.length === 2 ? otherInfo[1] : "";
                processedText = processedText.replace(
                    item,
                    `<div class="comiis_quote bg_h f_c">以下内容需要积分高于 ${integral} 才可浏览</div>`
                );
            });
        }

        // 处理[quote]标签
        let quote = processedText.match(/\[quote\]([\s\S]*?)\[\/quote\]/g);
        if (quote) {
            quote.forEach((item) => {
                let contentMatch = item.match(/\[quote\]([\s\S]*?)\[\/quote\]/);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(
                    item,
                    `<div class="comiis_quote bg_h b_dashed f_c"><blockquote><font>回复</font> ${content}</blockquote></div>`
                );
            });
        }

        // 处理[free]标签
        let free = processedText.match(/\[free\]([\s\S]*?)\[\/free\]/g);
        if (free) {
            free.forEach((item) => {
                let contentMatch = item.match(/\[free\]([\s\S]*?)\[\/free\]/);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(
                    item,
                    `<div class="comiis_quote bg_h f_c"><blockquote>${content}</blockquote></div>`
                );
            });
        }

        // 处理[b]标签
        let strong = processedText.match(/\[b\]([\s\S]*?)\[\/b\]/g);
        if (strong) {
            strong.forEach((item) => {
                let contentMatch = item.match(/\[b\]([\s\S]*?)\[\/b\]/i);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(item, `<strong>${content}</strong>`);
            });
        }

        // 处理[u]标签
        let xhx = processedText.match(/\[u\]([\s\S]*?)\[\/u\]/g);
        if (xhx) {
            xhx.forEach((item) => {
                let contentMatch = item.match(/\[u\]([\s\S]*?)\[\/u\]/);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(item, `<u>${content}</u>`);
            });
        }

        // 处理[i]标签
        let qx = processedText.match(/\[i\]([\s\S]*?)\[\/i\]/g);
        if (qx) {
            qx.forEach((item) => {
                let contentMatch = item.match(/\[i\]([\s\S]*?)\[\/i\]/);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(item, `<i>${content}</i>`);
            });
        }

        // 处理[s]标签
        let strike = processedText.match(/\[s\]([\s\S]*?)\[\/s\]/g);
        if (strike) {
            strike.forEach((item) => {
                let contentMatch = item.match(/\[s\]([\s\S]*?)\[\/s\]/);
                let content = contentMatch ? contentMatch[1] : "";
                processedText = processedText.replace(item, `<strike>${content}</strike>`);
            });
        }

        // 处理表情标签
        let smilies = processedText.match(/\[([\s\S]+?)\]/g);
        if (smilies) {
            smilies.forEach((item) => {
                let smilieSrc = getSmileyUrl(item);
                if (smilieSrc) {
                    processedText = processedText.replace(
                        item,
                        `<img loading="lazy" style='max-height: 22px;' src="${smilieSrc}" border="0" alt="" smilieid="">`
                    );
                }
            });
        }

        // 处理[media]标签
        let media = processedText.match(/\[media(=[\s\S]*?)?\]([\s\S]*?)\[\/media\]/g);
        if (media) {
            media.forEach((item) => {
                let mediaMatch = item.match(/\[media(?:=([\s\S]*?))?\]([\s\S]*?)\[\/media\]/);
                if (mediaMatch) {
                    // 忽略对：[media]、[media=宽,高]、[media=类型,宽,高] 等格式的解析
                    // 解析媒体链接并过滤非法字符
                    let mediaUrl = mediaMatch[2].trim();
                    mediaUrl = mediaUrl.replace(/[<>"]/g, ''); // 简单XSS过滤
                    let mediaHtml = '';

                    // 适配主流视频平台（优先处理B站，兼容b23.tv短链接）
                    if (mediaUrl) {
                        // B站（bilibili.com、b23.tv）
                        if (mediaUrl.includes('bilibili.com') || mediaUrl.includes('b23.tv')) {
                            // 解析b23.tv短链接中的BV号/AV号（需实际请求或正则提取，这里简化处理）
                            let bvidMatch = mediaUrl.match(/BV(\w+)|av(\d+)/i) || mediaUrl.match(/b23\.tv\/(\w+)/i);
                            let aid = '', bvid = '';
                            if (bvidMatch) {
                                if (bvidMatch[1] && bvidMatch[1].startsWith('V')) {
                                    bvid = bvidMatch[1]; // BV号
                                } else if (bvidMatch[2]) {
                                    aid = bvidMatch[2]; // AV号
                                } else if (bvidMatch[1]) {
                                    // b23.tv短链接后缀（需实际跳转获取真实BV/AV，这里简化为直接使用）
                                    bvid = bvidMatch[1];
                                }
                            }
                            // 构造B站播放器链接（支持BV号和AV号）
                            let playerSrc = '';
                            if (bvid) {
                                playerSrc = `https://player.bilibili.com/player.html?bvid=BV${bvid}`;
                            } else if (aid) {
                                playerSrc = `https://player.bilibili.com/player.html?aid=${aid}`;
                            }
                            if (playerSrc) {
                                mediaHtml = `<iframe src="${playerSrc}" width="100%" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`;
                            }
                        }
                        // 经测试，论坛不支持优酷视频，此处预览仅供参考
                        // 适配优酷链接（含PC端、移动端、带参数）
                        else if (mediaUrl.includes('youku.com')) {
                            // 标准化URL：移除Query String，统一处理路径
                            let cleanUrl = mediaUrl.split('?')[0]; // 去掉?后的参数
                            // 正则匹配：支持PC端(/v_show/id_xxx.html)、移动端(/video/id_xxx)、ID含等号/字母/数字/下划线/短横线
                            let youkuMatch = cleanUrl.match(/id[_\/]([a-zA-Z0-9_\-=]+)(?:\.html)?/i);
                            if (youkuMatch) {
                                let vid = youkuMatch[1];
                                // 优酷新版iframe嵌入地址（兼容带等号的ID）
                                mediaHtml = `<iframe src="https://player.youku.com/embed/${vid}" width="100%" frameborder="0" allowfullscreen="true"></iframe>`;
                            }
                        }
                        // 腾讯视频（v.qq.com）
                        else if (mediaUrl.includes('v.qq.com')) {
                            let qqMatch = mediaUrl.match(/vid=([a-zA-Z0-9_\-]+)|\/([a-zA-Z0-9_\-]+)\.html/i);
                            let vid = qqMatch ? (qqMatch[1] || qqMatch[2]) : '';
                            if (vid) {
                                mediaHtml = `<iframe src="https://v.qq.com/txp/iframe/player.html?vid=${vid}" width="100%" frameborder="0" allowfullscreen="true"></iframe>`;
                            }
                        }
                        // 通用视频格式（MP4/WEBM/FLV）
                        else if (/\.(mp4|webm|flv)$/i.test(mediaUrl)) {
                            mediaHtml = `<video width="100%" controls="controls" preload="none">
                        <source src="${mediaUrl}" type="video/${mediaUrl.match(/\.(\w+)$/i)[1].toLowerCase()}">
                        您的浏览器不支持HTML5视频播放
                    </video>`;
                        }
                        // 通用音频格式（MP3/WAV/OGG）
                        else if (/\.(mp3|wav|ogg)$/i.test(mediaUrl)) {
                            mediaHtml = `<audio width="100%" controls="controls" preload="none">
                        <source src="${mediaUrl}" type="audio/${mediaUrl.match(/\.(\w+)$/i)[1].toLowerCase()}">
                        您的浏览器不支持HTML5音频播放
                    </audio>`;
                        }
                    }

                    // 无匹配平台时返回原链接，否则返回解析后的HTML
                    let replaceContent = mediaHtml || `<a style='color:#507daf' href="${mediaUrl}" target="_blank">${mediaUrl}</a>`;
                    processedText = processedText.replace(item, replaceContent);
                }
            });
        }

        // 处理[email]标签
        let email = processedText.match(/\[email(=[\s\S]*?)?\]([\s\S]*?)\[\/email\]/g);
        if (email) {
            email.forEach((item) => {
                let emailMatch = item.match(/\[email(?:=([\s\S]*?))?\]([\s\S]*?)\[\/email\]/);
                if (emailMatch) {
                    let _email_ = emailMatch[1] ? emailMatch[1].trim() : emailMatch[2].trim();
                    let _email_name_ = emailMatch[1] ? emailMatch[2].trim() : _email_;
                    processedText = processedText.replace(item, `<a style='color:#507daf' href="mailto:${_email_}">${_email_name_}</a>`);
                }
            });
        }

        // 处理[align]标签
        let align = processedText.match(/\[align=[\s\S]+?\][\s\S]+?\[\/align\]/g);
        if (align) {
            align.forEach((item) => {
                let match = item.match(/\[align=([\s\S]*?)\]([\s\S]+?)\[\/align\]/);
                let _align_ = match ? match[1] : "";
                let _content_ = match ? match[2] : "";
                if (_align_ || _content_) {
                    processedText = processedText.replace(item, `<div align="${_align_}">${_content_}</div>`);
                }
            });
        }

        // 处理[qq]标签
        let qq = processedText.match(/\[qq\][\s\S]*?\[\/qq\]/g);
        if (qq) {
            qq.forEach((item) => {
                let match = item.match(/\[qq\]([\s\S]*?)\[\/qq\]/);
                let content = match ? match[1] : "";
                processedText = processedText.replace(
                    item,
                    `<a href="http://wpa.qq.com/msgrd?v=3&uin=${content}&site=[Discuz!]&from=discuz&menu=yes" target="_blank"><img loading="lazy" src="static/image/common/qq_big.gif" border="0"></a>`
                );
            });
        }

        // 处理表格标签
        let td = processedText.match(/\[td\][\s\S]+?\[\/td\]/g);
        if (td) {
            td.forEach((item) => {
                let match = item.match(/\[td\]([\s\S]*?)\[\/td\]/);
                let content = match ? match[1] : "";
                processedText = processedText.replace(item, `<td style='border: 1px solid #E3EDF5;'>${content}</td>`);
            });
        }
        let tr = processedText.match(/\[tr\][\s\S]+?\[\/tr\]/g);
        if (tr) {
            tr.forEach((item) => {
                let match = item.match(/\[tr\]([\s\S]*?)\[\/tr\]/);
                let content = match ? match[1] : "";
                processedText = processedText.replace(item, `<tr>${content}</tr>`);
            });
        }
        let table = processedText.match(/\[table\][\s\S]+?\[\/table\]/g);
        if (table) {
            table.forEach((item) => {
                let match = item.match(/\[table\]([\s\S]*?)\[\/table\]/);
                let content = match ? match[1].replace(/\n/g, "") : "";
                processedText = processedText.replace(item, `<table style='width: 100%;'>${content}</table>`);
            });
        }

        // 处理[list]标签（支持带参数和无参数两种形式）
        let list = processedText.match(/\[list(?:=([\s\S]*?))?\][\s\S]+?\[\/list\]/g);
        if (list) {
            list.forEach((item) => {
                // 匹配带参数或无参数的list标签
                let modelMatch = item.match(/\[list(?:=([\s\S]*?))?\]([\s\S]*?)\[\/list\]/);
                let listModel = modelMatch ? modelMatch[1] : ""; // 无参数时为""
                let content = modelMatch ? modelMatch[2] : "";
                let listType = "";
                let styleType = ''

                // 处理列表类型（新增无参数情况的默认样式）
                if (listModel === "a") {
                    listType = "litype_2"; // 小写字母列表
                    styleType = 'list-style-type:lower-alpha;'
                } else if (listModel === "A") {
                    listType = "litype_3"; // 大写字母列表
                    styleType = 'list-style-type:upper-alpha;'
                } else if (/[0-9]/.test(listModel)) {
                    listType = "litype_1"; // 数字列表
                    styleType = 'list-style-type:decimal;'
                } else if (!listModel) {
                    listType = ""; // 无参数默认列表（圆点）
                    styleType = 'list-style-type:disc;'
                } else {
                    listType = ""; // 其他参数情况（如*i等）
                    styleType = 'list-style-type:none;'
                }

                // 处理列表项
                let liSplit = content.split("[*]");
                if (liSplit.length > 1) {
                    // 移除空的第一项（因split导致）
                    if (liSplit[0].trim() === "") liSplit = liSplit.slice(1);
                    // 生成li标签
                    content = liSplit.map(line => `<li style='${styleType}'>${line}</li>`).join("");
                }
                // 清除换行符
                content = content.replace(/\n/g, "");

                // 替换原标签为HTML列表
                processedText = processedText.replace(
                    item,
                    `<ol type="${listModel || ''}" class="${listType}">${content}</ol>`
                );
            });
        }

        // 最终文本替换
        processedText = processedText.replace(/\[hr\]/g, '<hr class="l">');
        processedText = processedText.replace(/\[\*\]/g, "<li></li>");
        processedText = processedText.replace(/\n/g, "<br>");

        //  3. 还原[code]标签内容（替换占位符）
        codeBlocks.forEach((codeHtml, index) => {
            processedText = processedText.replace(`__CODE_BLOCK_${index}__`, codeHtml);
        });

        return processedText;
    }

    // 编辑框预览
    function showPreviewPopup(htmlContent) {
        // 检查弹窗是否已存在
        let popupWrapper = document.getElementById('popup-wrapper');

        // 如果弹窗不存在，创建完整结构
        if (!popupWrapper) {
            // 创建弹窗容器并通过innerHTML一次性构建所有结构
            const container = document.createElement('div');
            container.innerHTML = `
            <div id="popup-wrapper" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: none; justify-content: center; align-items: center; z-index: 1000;">
                <div style="position: relative; width: 90%; max-width: 600px; background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);">
                    <!-- 关闭按钮 -->
                    <button class="close-btn" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 20px; cursor: pointer; color: #666; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s;">X</button>

                    <!-- 内容区域 -->
                    <div id="popup-content" style="padding: 20px; max-height: 70vh; overflow-y: auto; box-sizing: border-box;"></div>
                </div>
            </div>
        `;

            // 添加到页面
            document.body.appendChild(container.firstElementChild);
            popupWrapper = document.getElementById('popup-wrapper');

            // 获取元素并绑定事件
            const closeBtn = popupWrapper.querySelector('.close-btn');

            // 关闭按钮点击事件
            closeBtn.addEventListener('click', () => {
                popupWrapper.style.display = 'none';
            });

            // 点击遮罩关闭弹窗
            popupWrapper.addEventListener('click', (e) => {
                if (e.target === popupWrapper) {
                    popupWrapper.style.display = 'none';
                }
            });
        }

        // 更新内容并显示弹窗
        document.getElementById('popup-content').innerHTML = htmlContent;
        popupWrapper.style.display = 'flex';
    }

    // 彩虹字体生成器，待彩虹的字符串、回调函数（彩虹代码）
    function rainbowTextGenerator(initialText, callback) {
        if (!initialText.trim()) initialText = '彩虹字体示例';
        // 创建弹窗元素
        const overlay = document.createElement('div');
        overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
    `;

        // 弹窗内容
        overlay.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; width: 80%; max-width: 500px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <h2 style="margin: 0 0 20px; color: #333; text-align: center; font-size: 1.5rem;">彩虹字体生成</h2>

            <label style="font-size: 0.9rem; color: #666; margin-bottom: 5px; display: block;">文字内容（点击可编辑）：</label>
            <div class="content-container" style="position: relative; height: 120px; margin: 0 0 20px; cursor: pointer;">
                <textarea class="input-area" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 15px; border: 2px dashed #ddd; border-radius: 6px; box-sizing: border-box; overflow-y: auto; resize: none; display: none; font-family: inherit; font-size: 1rem; white-space: pre-wrap; word-wrap: break-word;" placeholder="请输入文字...">${initialText}</textarea>
                <div class="preview-area" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 15px; border: 2px dashed #6366F1; border-radius: 6px; box-sizing: border-box; overflow-y: auto; font-family: inherit; font-size: 1rem; white-space: pre-wrap; word-wrap: break-word;"></div>
            </div>

            <div class="controls" style="margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #555; font-weight: 500;">起始色相</label>
                    <input type="range" class="hue-start" min="0" max="360" value="0" style="width: 100%; height: 8px; -webkit-appearance: none; appearance: none; background: #ddd; border-radius: 4px; outline: none;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 5px;">
                        <span>0°</span>
                        <span class="hue-start-value">0°</span>
                        <span>360°</span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #555; font-weight: 500;">颜色步长</label>
                    <input type="range" class="hue-step" min="1" max="120" value="30" style="width: 100%; height: 8px; -webkit-appearance: none; appearance: none; background: #ddd; border-radius: 4px; outline: none;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 5px;">
                        <span>1°</span>
                        <span class="hue-step-value">30°</span>
                        <span>120°</span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #555; font-weight: 500;">饱和度</label>
                    <input type="range" class="saturation" min="0" max="100" value="80" style="width: 100%; height: 8px; -webkit-appearance: none; appearance: none; background: #ddd; border-radius: 4px; outline: none;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 5px;">
                        <span>0%</span>
                        <span class="saturation-value">80%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #555; font-weight: 500;">亮度</label>
                    <input type="range" class="lightness" min="10" max="90" value="50" style="width: 100%; height: 8px; -webkit-appearance: none; appearance: none; background: #ddd; border-radius: 4px; outline: none;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 5px;">
                        <span>10%</span>
                        <span class="lightness-value">50%</span>
                        <span>90%</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button class="random-btn" style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; background: #2196F3; color: white;">随机颜色</button>
                <button class="cancel-btn" style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; background: #f44336; color: white;">取消</button>
                <button class="confirm-btn" style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; background: #4CAF50; color: white;">确定</button>
            </div>
        </div>
    `;

        document.body.appendChild(overlay);

        // 获取元素
        const container = overlay.querySelector('.content-container');
        const input = overlay.querySelector('.input-area');
        const preview = overlay.querySelector('.preview-area');
        const hueStart = overlay.querySelector('.hue-start');
        const hueStep = overlay.querySelector('.hue-step');
        const saturation = overlay.querySelector('.saturation');
        const lightness = overlay.querySelector('.lightness');
        const hueStartValue = overlay.querySelector('.hue-start-value');
        const hueStepValue = overlay.querySelector('.hue-step-value');
        const saturationValue = overlay.querySelector('.saturation-value');
        const lightnessValue = overlay.querySelector('.lightness-value');
        const randomBtn = overlay.querySelector('.random-btn');
        const cancelBtn = overlay.querySelector('.cancel-btn');
        const confirmBtn = overlay.querySelector('.confirm-btn');

        // 颜色转换工具
        const hslToRgb = (h, s, l) => {
            h /= 360; s /= 100; l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const f = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = f(p, q, h + 1 / 3);
                g = f(p, q, h);
                b = f(p, q, h - 1 / 3);
            }
            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
        };

        const rgbToHex = (r, g, b) =>
            `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

        // 生成彩虹文字
        const generate = () => {
            const text = input.value.trim();
            if (!text) {
                preview.innerHTML = '<span style="color: #999;">点击此处输入文字内容</span>';
                return '';
            }

            const scrollTop = input.scrollTop;
            let html = '';
            let code = '';
            const start = parseInt(hueStart.value);
            const step = parseInt(hueStep.value);
            const sat = parseInt(saturation.value);
            const lit = parseInt(lightness.value);

            for (let i = 0; i < text.length; i++) {
                const hue = (start + i * step) % 360;
                const rgb = hslToRgb(hue, sat, lit);
                const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
                html += `<font color="${hex}">${text[i]}</font>`;
                code += `[color=${hex}]${text[i]}[/color]`;
            }

            preview.innerHTML = html;
            preview.scrollTop = scrollTop;
            return code;
        };

        // 更新显示值
        const updateValues = () => {
            hueStartValue.textContent = `${hueStart.value}°`;
            hueStepValue.textContent = `${hueStep.value}°`;
            saturationValue.textContent = `${saturation.value}%`;
            lightnessValue.textContent = `${lightness.value}%`;
        };

        // 切换显示模式
        const showInput = () => {
            preview.style.display = 'none';
            input.style.display = 'block';
            input.focus();
            input.scrollTop = preview.scrollTop;
        };

        const showPreview = () => {
            if (input.style.display === 'block') {
                input.style.display = 'none';
                preview.style.display = 'block';
                generate();
            }
        };

        // 随机颜色
        const randomize = () => {
            hueStart.value = Math.floor(Math.random() * 360);
            hueStep.value = Math.floor(Math.random() * 60) + 10;
            saturation.value = Math.floor(Math.random() * 50) + 50;
            lightness.value = Math.floor(Math.random() * 40) + 30;
            updateValues();
            generate();
        };

        // 事件绑定
        container.addEventListener('click', () => showInput());
        input.addEventListener('blur', showPreview);
        input.addEventListener('input', () => preview.scrollTop = input.scrollTop);

        hueStart.addEventListener('input', () => { updateValues(); generate(); });
        hueStep.addEventListener('input', () => { updateValues(); generate(); });
        saturation.addEventListener('input', () => { updateValues(); generate(); });
        lightness.addEventListener('input', () => { updateValues(); generate(); });

        randomBtn.addEventListener('click', () => { showPreview(); randomize(); });
        cancelBtn.addEventListener('click', () => document.body.removeChild(overlay));
        confirmBtn.addEventListener('click', () => {
            showPreview();
            const code = generate();
            callback(code);
            document.body.removeChild(overlay);
        });

        // 初始化
        updateValues();
        generate();
    }

    let currentImgIndex = 0;
    // 图片管理工具，可以插图、上传图片、删除图片
    function pictureManagementTool() {
        const textarea = document.querySelector('textarea');
        let images = []; // 全局维护图片列表
        let overlay = null; // 遮罩层实例
        let popupObserver = null; // 弹窗监听实例（全局单例）

        // 收集图片（ID改为匹配数字）
        const collectTargetImages = () => {
            const idPattern = /^aimg_(\d+)$/;
            const images = Array.from(document.querySelectorAll('#imglist img') || []).reduce((acc, img) => {
                const match = img.id.match(idPattern);
                if (match) acc.push({ id: img.id, src: img.src, number: match[1], imgNode: img });
                return acc;
            }, []);
            return images.reverse();
        };

        // 获取已插入的图片编号（ID改为数字）
        const getInsertedNumbers = () => {
            const pattern = /\[attachimg\](\d+)\[\/attachimg\]/g;
            const inserted = [];
            let match;
            while ((match = pattern.exec(textarea.value))) inserted.push(match[1]);
            return inserted;
        };

        // 插入到文本框
        const insertIntoTextarea = (number) => {
            const { selectionStart: start, selectionEnd: end } = textarea;
            const insertStr = `[attachimg]${number}[/attachimg]`;
            textarea.value = textarea.value.slice(0, start) + insertStr + textarea.value.slice(end);
            textarea.focus();
            textarea.setSelectionRange(start + insertStr.length, start + insertStr.length);
        };

        // 创建大图预览区域（含全屏按钮）
        const createMainPreview = (src) => {
            return `
            <div style="position:relative;max-width:100%;max-height:100%;">
                <img id="mainPreviewImg" src="${src}" style="max-width:100%;max-height:100%;object-contain;">
                <button id="fullscreenBtn" style="position:absolute;top:10px;right:10px;padding:4px 8px;border:none;border-radius:4px;background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:12px;">全屏</button>
            </div>
        `;
        };

        // 更新缩略图列表
        const updateThumbnailList = () => {
            if (!overlay) return;
            images = collectTargetImages();
            const insertedNumbers = getInsertedNumbers();
            const thumbnailContainer = overlay.querySelector('.thumbnail-list');
            const previewArea = overlay.querySelector('.preview-area');
            const hasImages = images.length > 0;

            // 渲染缩略图
            thumbnailContainer.innerHTML = hasImages ? images.map((img, i) => `
            <div style="margin-bottom:8px;cursor:pointer;border-radius:4px;overflow:hidden;position:relative;
                ${insertedNumbers.includes(img.number) ? 'border:2px solid #4CAF50;' : 'border:2px solid #F44336;'}">
                <img src="${img.src}" alt="缩略图${i + 1}" style="width:100%;height:80px;object-fit:cover;" data-index="${i}">
                ${insertedNumbers.includes(img.number) ?
                    '<span style="position:absolute;top:2px;left:2px;background:#4CAF50;color:#fff;font-size:10px;padding:1px 4px;border-radius:2px;">已插</span>' : ''}
                <span class="img-remove-btn" data-number="${img.number}" style="position:absolute;bottom:2px;right:2px;background:#f00;color:#fff;font-size:10px;padding:1px 4px;border-radius:2px;cursor:pointer;z-index:10;">删</span>
            </div>
        `).join('') : '<div style="text-align:center;padding:20px;color:#999;">暂无</div>';

            // 处理大图预览
            if (hasImages) {
                // 校验当前索引
                if (currentImgIndex === undefined || currentImgIndex >= images.length || currentImgIndex < 0) {
                    currentImgIndex = 0;
                }
                const currentImg = images[currentImgIndex];
                // 生成大图区域HTML（含全屏按钮）
                previewArea.innerHTML = createMainPreview(currentImg.src);
                // 绑定全屏按钮事件
                const fullscreenBtn = previewArea.querySelector('#fullscreenBtn');
                fullscreenBtn.onclick = () => {
                    window.open(currentImg.src, '_blank');
                };
            } else {
                // 无图片时显示提示
                previewArea.innerHTML = '<div style="color:#999;font-size:18px;">请先上传图片</div>';
                currentImgIndex = 0;
            }

            // 绑定缩略图点击事件
            if (hasImages) {
                thumbnailContainer.querySelectorAll('[data-index]').forEach(thumb => {
                    thumb.onclick = () => {
                        const index = +thumb.dataset.index;
                        currentImgIndex = index;
                        const currentImg = images[index];
                        const previewArea = overlay.querySelector('.preview-area');
                        // 更新大图和全屏按钮
                        previewArea.innerHTML = createMainPreview(currentImg.src);
                        const fullscreenBtn = previewArea.querySelector('#fullscreenBtn');
                        fullscreenBtn.onclick = () => {
                            window.open(currentImg.src, '_blank');
                        };
                    };
                });

                // 绑定移除按钮点击事件
                thumbnailContainer.querySelectorAll('.img-remove-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const number = btn.dataset.number;
                        const delElement = document.querySelector(`#imglist span[aid="${number}"]`);
                        if (delElement) delElement.click();
                        // 重新更新列表
                        updateThumbnailList();
                    };
                });
            }

            // 更新插入按钮显示
            const insertBtn = overlay.querySelector('#insertBtn');
            if (insertBtn) {
                insertBtn.style.display = hasImages ? 'inline-block' : 'none';
            }
        };

        // 初始化监听（仅首次调用）
        const initUploadObserver = () => {
            if (popupObserver) return; // 已存在监听器，直接返回
            const imgList = document.querySelector('#imglist');
            if (!imgList) return;

            popupObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    const hasImgChange =
                        Array.from(mutation.addedNodes).some(node => node.tagName === 'LI') ||
                        Array.from(mutation.removedNodes).some(node => node.tagName === 'LI');
                    if (hasImgChange) updateThumbnailList();
                });
            });

            const observerOptions = { childList: true, subtree: true };
            popupObserver.observe(imgList, observerOptions);
        };

        // 创建遮罩层（单例）
        const createOverlay = () => {
            const existingOverlay = document.getElementById('imageHelperOverlay');
            if (existingOverlay) {
                overlay = existingOverlay;
                return; // 已有实例，直接返回
            }

            const overlayHtml = `
            <div id="imageHelperOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;">
                <div style="width:95%;max-width:1000px;height:80%;max-height:600px;background:#fff;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;">
                    <div style="padding:12px 16px;background:#f5f5f5;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
                        <h3 style="margin:0;font-size:16px;color:#333;">图片插入助手</h3>
                    </div>
                    <div style="flex:1;display:flex;overflow:hidden;">
                        <div style="width:75px;max-height:100%;overflow-y:auto;border-right:1px solid #eee;padding:5px;box-sizing:border-box;display:flex;flex-direction:column;">
                            <button id="uploadBtn" style="margin-bottom:10px;padding:8px 0;border:none;border-radius:4px;background:#2196F3;color:#fff;cursor:pointer;font-size:14px;">上传图片</button>
                            <div class="thumbnail-list" style="flex:1;overflow-y:auto;"></div>
                        </div>
                        <div class="preview-area" style="flex:1;display:flex;align-items:center;justify-content:center;padding:5px;"></div>
                    </div>
                    <div style="padding:12px 16px;background:#f5f5f5;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px;">
                        <button id="cancelBtn" style="padding:8px 16px;border:none;border-radius:4px;background:#666;color:#fff;cursor:pointer;">取消</button>
                        <button id="insertBtn" style="padding:8px 16px;border:none;border-radius:4px;background:#E91E63;color:#fff;cursor:pointer;display:none;">插入</button>
                    </div>
                </div>
            </div>`;

            document.body.insertAdjacentHTML('beforeend', overlayHtml);
            overlay = document.getElementById('imageHelperOverlay');

            // 绑定按钮事件（仅首次创建时绑定）
            const cancelBtn = overlay.querySelector('#cancelBtn');
            const insertBtn = overlay.querySelector('#insertBtn');
            const uploadBtn = overlay.querySelector('#uploadBtn');

            uploadBtn.onclick = () => {
                const uploadInput = document.querySelector('#imglist input') || document.querySelector('#filedata');
                if (uploadInput) uploadInput.click();
            };

            insertBtn.onclick = () => {
                if (images.length > 0) {
                    insertIntoTextarea(images[currentImgIndex || 0].number);
                    overlay.style.display = 'none'; // 隐藏而非删除
                }
            };

            cancelBtn.onclick = () => {
                overlay.style.display = 'none'; // 隐藏而非删除
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none'; // 隐藏而非删除
                }
            };

            // 首次创建遮罩层时初始化监听器（仅一次）
            initUploadObserver();
        };

        // 打开/显示图片助手（单例逻辑）
        const openImageHelper = () => {
            createOverlay(); // 确保实例存在（首次创建时初始化监听器）
            overlay.style.display = 'flex'; // 显示遮罩层
            updateThumbnailList(); // 先更新列表（包含大图初始化）
        };

        openImageHelper();
    }

    //选择
    function selectIncludingBrackets() {
        const textarea = document.querySelector('textarea');
        const text = textarea.value;
        const selectStart = textarea.selectionStart;
        const selectEnd = textarea.selectionEnd;
        const len = text.length;

        // 从选择开始位置向前查找最近的'['
        let leftBracket = null;
        for (let i = selectStart - 1; i >= 0; i--) {
            if (text[i] === '[') {
                leftBracket = i;
                break;
            }
        }

        // 从选择结束位置向后查找最近的']'
        let rightBracket = null;
        for (let i = selectEnd; i < len; i++) {
            if (text[i] === ']') {
                rightBracket = i;
                break;
            }
        }

        // 计算最终选择范围：
        const newStart = leftBracket !== null ? leftBracket : 0; // 未找到[则从开头开始
        const newEnd = rightBracket !== null ? rightBracket + 1 : len; // 未找到]则到末尾结束

        // 执行选择
        textarea.focus();
        textarea.selectionStart = newStart;
        textarea.selectionEnd = newEnd;
    }

    //编辑框页面优化
    (function () {
        // 判断是否为发帖页面
        const url = new URL(window.location.href);
        if (url.searchParams.get('mod') !== 'post') return;

        // 插入图片显示隐藏
        const targetDiv = document.querySelector('#comiis_mh_sub>div');
        if (targetDiv) {
            // 创建要插入的元素
            const newLink = document.createElement('a');
            newLink.href = 'javascript:;';
            newLink.className = 'comiis_pictitle';
            newLink.innerHTML = '<i class="comiis_font"><em>图片</em></i><span style="display: none;">0</span>';

            // 插入到div内部作为子元素（末尾）
            targetDiv.appendChild(newLink);

            // 绑定点击事件
            const imgList = document.querySelector('#imglist');
            const comiisPostTab = document.querySelector('#comiis_post_tab');
            imgList.style.display = 'none'
            comiisPostTab.appendChild(imgList);

            newLink.addEventListener('click', function () {
                // // 获取自身class是否包含f_0
                // const hasF0 = this.querySelector('i').classList.contains('f_0');
                // if (imgList) {
                //     imgList.style.display = hasF0 ? 'none' : 'block';
                // }
                pictureManagementTool()
            });
        }

        // 按钮移至顶部（适配多个comiis_btnbox）
        (function () {
            // 获取所有comiis_btnbox元素
            const btnBoxList = document.querySelectorAll('.comiis_btnbox');
            // 获取目标插入位置的headDiv
            const headDiv = document.querySelector('#comiis_head>div');

            // 校验核心元素
            if (btnBoxList.length === 0 || !headDiv) {
                console.warn('按钮移顶时未找到核心元素元素！');
                return;
            }

            // 创建顶部父容器并设置样式
            const headerY = document.createElement('div');
            headerY.className = 'header_y';
            Object.assign(headerY.style, {
                display: 'flex',
                alignContent: 'center',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%'
            });

            // 遍历所有comiis_btnbox元素处理
            btnBoxList.forEach((btnBox, index) => {
                // 遍历当前btnBox的子元素处理
                Array.from(btnBox.children).forEach(child => {
                    if (child.nodeType !== 1) return;
                    const bgClass = Array.from(child.classList).find(cls => cls.startsWith('bg_'));
                    if (!bgClass) return;

                    // 创建新元素并设置样式和内容
                    const btnDiv = document.createElement('div');
                    // 若多个btnBox的bgClass重复，可添加索引区分
                    btnDiv.className = `${bgClass}`;
                    btnDiv.textContent = child.textContent.trim();
                    Object.assign(btnDiv.style, {
                        padding: '5px',
                        whiteSpace: 'nowrap',
                        margin: '10px',
                    });

                    // 绑定点击事件（触发原child的点击）
                    btnDiv.addEventListener('click', () => {
                        child.click();
                    });

                    // 加入父容器
                    headerY.appendChild(btnDiv);
                });

                // 隐藏当前btnBox
                btnBox.style.display = 'none';
            });

            // 插入父容器到headDiv
            if (headerY.children.length > 0) {
                headDiv.appendChild(headerY);
            }
        })();

        // 增加textarea的显示大小
        (function () {
            // 禁用默认的textarea高度调整函数
            function disableDefaultHeightAdjust() {
                window.textarea_scrollHeight = () => { };
            }

            // 计算并设置form和textarea的高度（核心逻辑）
            function calculateAndSetHeight() {
                const postForm = document.querySelector('#postform>div');
                const needMessage = document.querySelector('#needmessage');
                if (!postForm || !needMessage) {
                    console.log('计算textarea时未找到核心元素！')
                    return;
                }

                // 2. 计算form内除textarea外的元素总高度：form高度 - textarea高度
                const formExceptTextareaHeight = postForm.offsetHeight - needMessage.offsetHeight;

                // 3. 重新计算textarea高度：网页高度 - 其他元素总高度 - 预留间距（避免边界溢出）
                const padding = 50;
                let textareaHeight = document.documentElement.clientHeight - formExceptTextareaHeight - padding;
                // 限制最小高度（避免过小）
                textareaHeight = Math.max(100, textareaHeight);
                // 取整避免小数像素渲染问题
                textareaHeight = Math.floor(textareaHeight);

                // 4. 设置textarea高度（宽度自适应form，box-sizing确保计算准确）
                needMessage.style.cssText = `
                height: ${textareaHeight}px;
                width: 100%;
                box-sizing: border-box;
                margin: 0;
                padding: 4px; /* 可根据实际需求调整 */
            `;

            }

            // 监听窗口resize事件（防抖处理）
            function listenWindowResize() {
                let resizeTimer;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(calculateAndSetHeight, 100);
                });
            }

            // 监听#comiis_post_tab高度变化（触发form内元素高度重计算）
            function observeTabHeightChange() {
                const targetSelector = '#comiis_post_tab';
                const target = document.querySelector(targetSelector);

                if (target) {
                    initObserver(target);
                } else {
                    // 等待元素加载（简化版）
                    const observer = new MutationObserver((mutations, obs) => {
                        const el = document.querySelector(targetSelector);
                        if (el) {
                            obs.disconnect();
                            initObserver(el);
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                }

                // 初始化MutationObserver
                function initObserver(element) {
                    let lastHeight = element.clientHeight;
                    const observer = new MutationObserver(() => {
                        const currentHeight = element.clientHeight;
                        if (currentHeight !== lastHeight) {
                            lastHeight = currentHeight;
                            calculateAndSetHeight();
                        }
                    });
                    observer.observe(element, {
                        attributes: true,
                        attributeFilter: ['style', 'class'],
                        childList: true,
                        subtree: true
                    });
                }
            }

            // 初始化所有逻辑
            (function () {
                disableDefaultHeightAdjust();

                // 页面加载完成后执行初始计算
                calculateAndSetHeight();

                listenWindowResize();
                observeTabHeightChange();
            })()
        })()

    })()


})();