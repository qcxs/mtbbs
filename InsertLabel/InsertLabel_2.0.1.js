initImgMenu()

// 初始化函数：将菜单添加到textarea下方
function initImgMenu() {
    // 定义存储在localStorage中的键名
    const QUICK_INPUT = 'QuickInput';
    const MEUN_ITEMS = 'Menu_Items';
    const IS_REMOVE_TOUCH_START = 'isRemoveTouchStart';
    const DEFAULT = []

    DEFAULT[QUICK_INPUT] = [
        { name: "添加", value: "add" },
        { name: "删除", value: "delete" }
    ]
    DEFAULT[MEUN_ITEMS] = [
        { name: '选择', isShow: true },
        { name: '预览', isShow: true },
        { name: '插图', isShow: true },
        { name: '水平线', isShow: true },
        { name: '删除线', isShow: true },
        { name: 'code', isShow: true },
        { name: 'color', isShow: true },
        { name: 'url', isShow: true },
        { name: '加粗', isShow: true },
        { name: '字号', isShow: true },
        { name: 'img', isShow: true },
        { name: 'hide', isShow: true },
        { name: '更多', isShow: true },
        { name: '常用语', isShow: false },
        { name: '彩虹字体', isShow: false },
        { name: '对齐', isShow: false },
        { name: '斜体', isShow: false },
        { name: '下划线', isShow: false },
        { name: '邮件', isShow: false },
        { name: '引用', isShow: false },
        { name: '视频', isShow: false },
        { name: 'QQ', isShow: false },
        { name: 'backcolor', isShow: false },
        { name: '高级', isShow: false },
    ]
    DEFAULT[IS_REMOVE_TOUCH_START] = false;

    let isRemoveTouchStart = getBylocalStorage(IS_REMOVE_TOUCH_START);

    const textarea = document.querySelector('textarea');
    if (!textarea) {
        console.log('未找到textarea元素');
        return;
    }
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
    //使用代码中菜单
    // const menuItems = DEFAULT[MEUN_ITEMS];

    // 使用localStorage菜单，覆盖旧版
    let menuItems = getBylocalStorage(MEUN_ITEMS);
    if (menuItems.length !== DEFAULT[MEUN_ITEMS].length) {
        menuItems = initlocalStorage(MEUN_ITEMS)
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
        if (isRemoveTouchStart) removeTouchStart();

        // 获取第一个textarea元素
        const textarea = document.querySelector('textarea');
        if (!textarea) {
            console.log('未找到文本框');
            return;
        }

        // 获取选中文本信息
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        // 使用switch处理不同操作
        switch (name) {
            case '常用语':
                selectDia(getBylocalStorage(QUICK_INPUT), (value) => {
                    if (value === 'add') {
                        inputDia([
                            { placeholder: '请输入备注：' },
                            { placeholder: '请输入内容：' },
                        ], (name, value) => {
                            if (name.trim() && value.trim()) {
                                // 向前面添加
                                const arr = getBylocalStorage(QUICK_INPUT);
                                arr.unshift({ name, value });
                                localStorage.setItem(QUICK_INPUT, JSON.stringify(arr));
                            }
                        });
                    } else if (value === 'delete') {
                        selectDia(getBylocalStorage(QUICK_INPUT), (value) => {
                            // 删除（不能删除"添加"和"删除"）
                            if (value === "add" || value === "delete") return false;

                            const arr = getBylocalStorage(QUICK_INPUT);
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
                showPreviewPopup(replaceText(document.querySelector('textarea').value));
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
                pictureGallery()
                break;
            case '加粗':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[b]${text}[/b]`);
                    })
                    return;
                }
                insertTextAndScroll(`[b]${selectedText}[/b]`);
                break;
            case '斜体':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[i]${text}[/i]`);
                    })
                    return;
                }
                insertTextAndScroll(`[i]${selectedText}[/i]`);
                break;
            case '下划线':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[u]${text}[/u]`);
                    })
                    return;
                }
                insertTextAndScroll(`[u]${selectedText}[/u]`);
                break;
            case '删除线':
                if (!selectedText.trim()) {
                    inputDia([{ placeholder: '请输入文字：' }], (text) => {
                        insertTextAndScroll(`[s]${text}[/s]`);
                    })
                    return;
                }
                insertTextAndScroll(`[s]${selectedText}[/s]`);
                break;
            case '字号':
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
                    { name: `url`, value: `[${text}=#507daf]${selectedText}[/${text}]`, css: `${textText}: #507daf;` },
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
            case '邮件':
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
            case '水平线':
                insertTextAndScroll(`[hr]${selectedText}`);
                break;
            case '对齐':
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
            case '引用':
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
            case '视频':
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
            case '高级':
                const allLocalStorage = [];
                const itemCount = localStorage.length;
                for (let i = 0; i < itemCount; i++) {
                    const key = localStorage.key(i);
                    allLocalStorage.push({
                        name: key,
                        value: key
                    });
                }
                selectDia([
                    { name: '编辑localStorage', value: `EditLocalStorage` },
                    { name: '删除localStorage', value: `DeleteLocalStorage` },
                    { name: '清空localStorage', value: `ClearLocalStorage` },
                    { name: '执行自定义js', value: `js` },
                    { name: '阻止离开', value: `阻止离开` },
                    { name: '替换选中内容', value: `替换选中内容` },
                ], (value) => {
                    if (value === 'EditLocalStorage') {
                        selectDia(allLocalStorage, (key) => {
                            inputDia([
                                { placeholder: 'key', value: key },
                                { placeholder: 'value', value: localStorage.getItem(key) },
                            ], (key, value) => {
                                localStorage.setItem(key, value)
                            })
                        })
                    } else if (value === 'DeleteLocalStorage') {
                        selectDia(allLocalStorage, (key) => {
                            localStorage.removeItem(key)
                        })
                    } else if (value === 'ClearLocalStorage') {
                        localStorage.clear();
                    } else if (value === 'js') {
                        if (window.runUserCode === undefined) {
                            window.runUserCode = function () {
                                const userCode = prompt('请输入要执行的JavaScript代码：', `document.body.contentEditable = true;// 使整个页面可编辑`);
                                if (userCode !== null) {
                                    try {
                                        eval(userCode);
                                    } catch (e) {
                                        alert('执行错误：' + e.message);
                                    }
                                }
                            }
                        }
                        window.runUserCode();
                    } else if (value === '阻止离开') {
                        window.addEventListener('beforeunload', function (e) {
                            e.preventDefault();
                            e.returnValue = ''; // 这行在某些浏览器中是必需的
                            return '您有未保存的内容，确定要离开吗？';
                        });
                    } else if (value === '替换选中内容') {
                        if (!selectedText.trim()) {
                            alert('请先选择内容！')
                            return;
                        }
                        inputDia([
                            { placeholder: '查找', value: "/\\[color=.*?\\](.*?)\\[\\/color\\]/" },
                            { placeholder: '替换', value: '$1' },
                        ], (search, replace) => {
                            insertTextAndScroll(replaceWithUserRegex(search, replace, `${selectedText}`));
                        })
                    }
                }, "一些高级功能：");
                break;
            default:
                alert('未知操作');
                return;
        }
    }

    // 使用临时元素和scrollIntoView模拟光标位置
    function insertTextAndScroll(newText) {
        const textarea = document.querySelector('textarea');
        if (!textarea) {
            console.log('未找到文本框');
            return;
        }

        // 保存原始属性
        const originalPosition = textarea.style.position;
        const originalPadding = textarea.style.padding;

        // 获取选中文本信息
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // 更新文本框内容
        const fullText = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.value = fullText;

        // 计算新的光标位置
        const newStart = start;
        const newEnd = start + newText.length;

        // 设置光标位置
        textarea.focus();
        textarea.selectionStart = newStart;
        textarea.selectionEnd = newEnd;

        // 创建临时元素用于定位
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '0';
        tempDiv.style.left = '0';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'pre-wrap';
        tempDiv.style.font = getComputedStyle(textarea).font;
        tempDiv.style.fontSize = getComputedStyle(textarea).fontSize;
        tempDiv.style.width = textarea.clientWidth + 'px';
        tempDiv.style.padding = getComputedStyle(textarea).padding;
        tempDiv.style.boxSizing = 'border-box';

        // 只添加光标前的文本
        tempDiv.textContent = textarea.value.substring(0, newEnd);
        document.body.appendChild(tempDiv);

        // 计算光标位置并滚动
        const cursorTop = tempDiv.offsetHeight;
        textarea.scrollTop = cursorTop - textarea.clientHeight / 2;

        // 清理临时元素
        document.body.removeChild(tempDiv);
        textarea.style.position = originalPosition;
        textarea.style.padding = originalPadding;
    }

    // 选择弹窗
    function selectDia(options, callback, title = "请选择") {
        const dialogId = `select-dialog-${Date.now()}`;
        const container = document.createElement('div');

        // 一次性创建所有元素
        container.innerHTML = `
        <!-- 遮罩层 -->
        <div class="mask" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;"></div>
        
        <!-- 弹窗主体 -->
        <div class="dialog" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;border:1px solid #ccc;border-radius:4px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);padding:0;display:block;z-index:1000;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #eee;">
                <span>${title}</span>
                <button class="close" style="background:none;border:none;font-size:16px;cursor:pointer;padding:0;line-height:1;">×</button>
            </div>
            
            <div style="max-height:200px;overflow-y:auto;padding:8px 0;scrollbar-width:thin;scrollbar-color:#ccc transparent;">
                <ul style="list-style:none;margin:0;padding:0;">
                    ${options.map((opt, i) => `
                        <li data-i="${i}" style="padding:8px 16px;cursor:pointer;display:flex;align-items:center;${opt.css || ''}">
                            <input type="radio" name="${dialogId}" id="${dialogId}-${i}" value="${opt.value}" style="margin-right:8px;">
                            <label for="${dialogId}-${i}">${opt.name}</label>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 16px;border-top:1px solid #eee;">
                <button class="cancel" style="padding:6px 16px;border-radius:4px;cursor:pointer;background:#fff;border:1px solid #ccc;">取消</button>
                <button class="confirm" style="padding:6px 16px;border-radius:4px;cursor:pointer;background:#409eff;color:#fff;border:none;">确定</button>
            </div>
        </div>
    `;

        document.body.appendChild(container);

        // 获取元素
        const [mask, dialog] = container.children;
        const closeBtn = dialog.querySelector('.close');
        const cancelBtn = dialog.querySelector('.cancel');
        const confirmBtn = dialog.querySelector('.confirm');
        const optionsList = dialog.querySelectorAll('li');
        const radios = dialog.querySelectorAll(`input[name="${dialogId}"]`);

        // 保存原始样式+默认选中
        const originalStyles = Array.from(optionsList).map(li => li.style.cssText);
        if (optionsList[0]) {
            optionsList[0].style.background = '#e6f3ff';
            radios[0].checked = true;
        }

        // 选项点击事件
        optionsList.forEach((li, i) => {
            li.onclick = () => {
                optionsList.forEach((opt, idx) => opt.style.cssText = originalStyles[idx]);
                li.style.background = '#e6f3ff';
                radios[i].checked = true;
            };
        });

        // 关闭函数（关键修改：同时移除整个容器，不再分步隐藏）
        const close = () => {
            container.remove(); // 直接移除包含弹窗和遮罩的容器，实现同时关闭
        };

        // 绑定所有关闭事件
        closeBtn.onclick = close;
        cancelBtn.onclick = close;
        mask.onclick = close;
        confirmBtn.onclick = () => {
            const selected = dialog.querySelector(`input[name="${dialogId}"]:checked`);
            if (selected && callback) callback(selected.value);
            close();
        };
    }

    // 动态输入框，可以定义输入个数
    function inputDia(inputConfigs, callback) {
        // 创建遮罩层并设置样式
        const mask = document.createElement('div');
        mask.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999';

        // 构建对话框HTML
        mask.innerHTML = `
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.15);z-index:10000;width:80%;max-width:500px">
  <div style="max-height:60vh;overflow-y:auto;" id="inputContainer"></div>
  <div style="text-align:right">
    <button id="cancelBtn" style="padding:8px 16px;background:#f5f5f5;color:#666;border:none;border-radius:4px;cursor:pointer;margin-right:8px">取消</button>
    <button id="confirmBtn" style="padding:8px 16px;background:#409eff;color:#fff;border:none;border-radius:4px;cursor:pointer">确定</button>
  </div>
</div>
`;

        // 获取容器元素
        const inputContainer = mask.querySelector('#inputContainer');
        const cancelBtn = mask.querySelector('#cancelBtn');
        const confirmBtn = mask.querySelector('#confirmBtn');

        // 动态生成输入框（处理每个配置项的默认值）
        inputConfigs.forEach(config => {
            // 提取配置项，设置默认值
            const placeholder = config.placeholder || '请输入';
            const value = config.value || '';

            inputContainer.innerHTML += `
<div>
  <label style="display:block;margin-bottom:6px;font-size:14px;color:#666">${placeholder}</label>
  <textarea placeholder="${placeholder}" style="width:100%;min-height:80px;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:14px;resize:vertical;box-sizing:border-box;white-space:pre-wrap;word-wrap:break-word;overflow-x:hidden">${value}</textarea>
</div>
`;
        });

        // 事件处理
        mask.addEventListener('click', e => e.target === mask && document.body.removeChild(mask));
        cancelBtn.addEventListener('click', () => document.body.removeChild(mask));
        confirmBtn.addEventListener('click', () => {
            const values = Array.from(inputContainer.querySelectorAll('textarea')).map(el => el.value);
            callback(...values);
            document.body.removeChild(mask);
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
                <div style="position: relative; width: 80%; max-width: 600px; background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);">
                    <!-- 关闭按钮 -->
                    <button class="close-btn" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 20px; cursor: pointer; color: #666; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s;"></button>
                    
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
            closeBtn.innerHTML = '×';

            // 关闭按钮hover效果
            closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#f1f1f1';
            closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';

            // 关闭按钮点击事件
            closeBtn.addEventListener('click', () => {
                popupWrapper.style.display = 'none';
            });

            // 遮罩层点击事件（点击遮罩关闭弹窗）
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

    // 获取表情图片URL的函数（基于已有全局变量smilies_array数据）
    function getSmileyUrl(smileyKey) {
        // 基础URL（公用部分）
        const baseUrl = "https://cdn-bbs.mt2.cn/static/image/smiley/";
        const smilies_array = window.smilies_array

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
        // -------------------------- 1. 提取[code]标签内容并替换为占位符
        const codeBlocks = []; // 存储处理后的代码块HTML
        let codeIndex = 0; // 代码块索引
        let processedText = text;

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

        // -------------------------- 2. 处理其他所有标签（此时[code]已被占位符替代，不参与解析）
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
                processedText = processedText.replace(item, `<font color="${colorValue}">${colorText}</font>`);
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
        let media = processedText.match(/\[media=[\s\S]+?\][\s\S]+?\[\/media\]/g);
        if (media) {
            media.forEach((item) => {
                let match = item.match(/\[media=[\s\S]*?\]([\s\S]*?)\[\/media\]/);
                let content = match ? match[1] : "";
                if (content) {
                    processedText = processedText.replace(
                        item,
                        `<ignore_js_op><span><iframe src="${content}" border="0" scrolling="no" framespacing="0" allowfullscreen="true" style="max-width: 100%" width="100%" height="auto" frameborder="no"></iframe></span></ignore_js_op>`
                    );
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
                let styleType=''

                // 处理列表类型（新增无参数情况的默认样式）
                if (listModel === "a") {
                    listType = "litype_2"; // 小写字母列表
                    styleType='list-style-type:lower-alpha;'
                } else if (listModel === "A") {
                    listType = "litype_3"; // 大写字母列表
                    styleType='list-style-type:upper-alpha;'
                 } else if (/[0-9]/.test(listModel)) {
                    listType = "litype_1"; // 数字列表
                    styleType='list-style-type:decimal;'
                } else if(!listModel){
                    listType = ""; // 无参数默认列表（圆点）
                    styleType='list-style-type:disc;'
                }else{
                    listType = ""; // 其他参数情况（如*i等）
                    styleType='list-style-type:none;'
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


        // 移除付费主题提示标签
        document.querySelectorAll(".gm_plugin_previewpostforum_html .comiis_quote.comiis_qianglou")
            .forEach(el => el.remove());

        // 处理[password]标签
        let password = processedText.match(/\[password\](.*?)\[\/password\]/gi);
        if (password) {
            password.forEach((item) => {
                processedText = item.replace(/\[password\](.*?)\[\/password\]/gi, "");
                let messageTable = document.querySelector(".gm_plugin_previewpostforum_html .comiis_message_table");
                if (messageTable) {
                    let priceInput = document.getElementById("price");
                    let price = priceInput ? priceInput.value : "0";
                    let newDiv = document.createElement("div");
                    newDiv.className = "comiis_quote comiis_qianglou bg_h";
                    newDiv.style.display = "flex";
                    newDiv.innerHTML = `
                <i class="comiis_font f_a" style="font-size: 16px;"></i>&nbsp;付费主题, 价格: <strong>${price} 金币</strong>
                <a href="javascript:;" class="y f_a" style="height: auto;color: #FF9900 !important;right: 5px;position: absolute;">记录</a>
            `;
                    messageTable.parentNode.insertBefore(newDiv, messageTable);
                }
            });
        }

        // 处理奖励信息
        document.querySelectorAll(".gm_plugin_previewpostforum_html .comiis_htjl")
            .forEach(el => el.remove());

        let everyRewardInput = document.getElementById("replycredit_extcredits");
        let totalRewardInput = document.getElementById("replycredit_times");
        let memberTimesInput = document.getElementById("replycredit_membertimes");
        let randomInput = document.getElementById("replycredit_random");

        let everyReward = everyRewardInput ? parseInt(everyRewardInput.value) : 0;
        let totalReward = totalRewardInput ? parseInt(totalRewardInput.value) : 0;
        let getRewardMemberTimes = memberTimesInput ? parseInt(memberTimesInput.value) : 0;
        let getRewardRandom = randomInput ? parseInt(randomInput.value) : 0;

        if (!isNaN(everyReward) && !isNaN(totalReward) && everyReward > 0 && totalReward > 0) {
            let messageTable = document.querySelector(".gm_plugin_previewpostforum_html .comiis_message_table");
            if (messageTable) {
                let rewardDiv = document.createElement("div");
                rewardDiv.className = "comiis_htjl bg_h f_a";
                rewardDiv.innerHTML = `
            <i class="comiis_font"></i>
            总共奖励 ${totalReward} 金币<br>回复本帖可获得 ${everyReward} 金币奖励! 每人限 ${getRewardMemberTimes} 次 ${getRewardRandom != 100 ? `(中奖概率 ${getRewardRandom}%)` : ""}
        `;
                messageTable.parentNode.insertBefore(rewardDiv, messageTable);
            }
        }

        // 最终文本替换
        processedText = processedText.replace(/\[hr\]/g, '<hr class="l">');
        processedText = processedText.replace(/\[\*\]/g, "<li></li>");
        processedText = processedText.replace(/\n/g, "<br>");

        // -------------------------- 3. 还原[code]标签内容（替换占位符）
        codeBlocks.forEach((codeHtml, index) => {
            processedText = processedText.replace(`__CODE_BLOCK_${index}__`, codeHtml);
        });

        return processedText;
    }

    //初始化key为target的localStorage
    function initlocalStorage(target) {
        localStorage.setItem(target, JSON.stringify(DEFAULT[target]));
        return getBylocalStorage(target);
    }

    // 获取key为target的localStorage的值并转为变量
    function getBylocalStorage(target) {
        try {
            // 为空重置数据
            return JSON.parse(localStorage.getItem(target) || initlocalStorage(target));
        } catch (error) {
            // 损坏重置数据
            return initlocalStorage(target);
        }
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
        <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 500px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
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

    // 图片画廊，用于插入图片
    function pictureGallery() {
        const collectTargetImages = () => {
            const images = [];
            const idPattern = /^aimg_(\d{6})$/, upboxImgs = document.querySelector('.comiis_upbox')?.getElementsByTagName('img') || [];
            Array.from(upboxImgs).forEach(img => {
                const match = img.id.match(idPattern);
                if (match) images.push({ id: img.id, src: img.src, number: match[1], inserted: false });
            });
            return images;
        };

        const getInsertedNumbers = () => {
            const textarea = document.querySelector('textarea');
            if (!textarea) return [];
            const pattern = /\[attachimg\](\d{6})\[\/attachimg\]/g, inserted = [];
            let match;
            while ((match = pattern.exec(textarea.value)) !== null) inserted.push(match[1]);
            return inserted;
        };

        const updateInsertedStatus = (images) => {
            const insertedNumbers = getInsertedNumbers();
            return images.map(img => ({ ...img, inserted: insertedNumbers.includes(img.number) }));
        };

        const insertIntoTextarea = (number) => {
            const textarea = document.querySelector('textarea');
            if (!textarea) return;
            const start = textarea.selectionStart, end = textarea.selectionEnd;
            const insertStr = `[attachimg]${number}[/attachimg]`;
            textarea.value = textarea.value.substring(0, start) + insertStr + textarea.value.substring(end);
            textarea.focus();
            textarea.setSelectionRange(start + insertStr.length, start + insertStr.length);
        };

        const openImageViewer = () => {
            let images = collectTargetImages();
            if (images.length === 0) { alert('还未上传图片！'); return; }
            images = updateInsertedStatus(images);
            let currentIndex = 0;

            document.getElementById('imageViewerOverlay')?.remove();
            const overlayHtml = `
        <div id="imageViewerOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;padding:20px;box-sizing:border-box;margin:0;border:0;">
            <div id="closeBtn" style="position:absolute;top:20px;right:20px;font-size:30px;background:transparent;color:white;z-index:10;cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">×</div>
            <div style="display:flex;gap:20px;height:100%;">
                <div id="thumbnailContainer" style="width:100px;overflow-x:hidden;overflow-y:auto;max-height:calc(100% - 40px);padding:10px;box-sizing:border-box;">
                    <div id="thumbnailScroll" style="display:flex;flex-direction:column;gap:10px;">
                        ${images.map((img, i) => `
                            <img src="${img.src}" alt="缩略图 ${i + 1}" style="width:80px;height:80px;object-fit:cover;border:${i === currentIndex ? '3px solid #e74c3c' : '3px solid transparent'};border-radius:4px;cursor:pointer;${img.inserted ? 'box-shadow:0 0 0 2px #81C784;background-color:#E8F5E9;' : ''}" data-index="${i}">
                        `).join('')}
                    </div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:20px;min-width:0;">
                    <div id="mainImageContainer" style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                        <img id="mainImage" style="max-width:100%;max-height:100%;object-fit:contain;" src="${images[0].src}">
                    </div>
                    <div id="actionButtons" style="display:flex;justify-content:center;gap:20px;padding:20px;box-sizing:border-box;min-height:60px;">
                        <button id="insertBtn" style="padding:10px 20px;font-size:16px;background:#e74c3c;color:white;border-radius:4px;cursor:pointer;border:none;white-space:nowrap;">插入</button>
                        <button id="cancelBtn" style="padding:10px 20px;font-size:16px;background:#34495e;color:white;border-radius:4px;cursor:pointer;border:none;white-space:nowrap;">关闭</button>
                    </div>
                </div>
            </div>
        </div>`;

            document.body.insertAdjacentHTML('beforeend', overlayHtml);
            const overlay = document.getElementById('imageViewerOverlay'),
                closeBtn = overlay.querySelector('#closeBtn'),
                cancelBtn = overlay.querySelector('#cancelBtn'),
                insertBtn = overlay.querySelector('#insertBtn'),
                mainImage = overlay.querySelector('#mainImage'),
                thumbnailScroll = overlay.querySelector('#thumbnailScroll');

            thumbnailScroll.querySelectorAll('img').forEach(thumb => {
                thumb.onclick = () => {
                    currentIndex = parseInt(thumb.dataset.index);
                    mainImage.src = images[currentIndex].src;
                    thumbnailScroll.querySelectorAll('img').forEach(img => {
                        img.style.border = parseInt(img.dataset.index) === currentIndex ? '3px solid #e74c3c' : '3px solid transparent';
                    });
                };
            });

            insertBtn.onclick = () => { insertIntoTextarea(images[currentIndex].number); overlay.remove(); };
            [closeBtn, cancelBtn].forEach(btn => btn.onclick = () => overlay.remove());
            [overlay.querySelector('#thumbnailContainer'), overlay.querySelector('#mainImageContainer'), overlay.querySelector('#actionButtons')].forEach(el => {
                el.onclick = e => e.stopPropagation();
            });
            overlay.onclick = () => overlay.remove();
        };

        openImageViewer();
    }

    //禁用侧边栏
    function removeTouchStart() {
        window.$('html').off('touchstart');
        console.log('移除滑动打开侧边栏')
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
        // 前面未找到[ → 选中从开头到找到的]（或末尾）
        // 后面未找到] → 选中从找到的[（或开头）到末尾
        const newStart = leftBracket !== null ? leftBracket : 0; // 未找到[则从开头开始
        const newEnd = rightBracket !== null ? rightBracket + 1 : len; // 未找到]则到末尾结束

        // 执行选择
        textarea.focus();
        textarea.selectionStart = newStart;
        textarea.selectionEnd = newEnd;
    }


    // 查找替换
    function replaceWithUserRegex(regexStr, replaceStr, targetStr) {
        try {
            // 解析用户输入的正则表达式（支持带修饰符的格式，如 "/pattern/g"）
            const regexParts = regexStr.match(/^\/(.*)\/([gimuy]*)$/);
            let pattern, flags;

            if (regexParts) {
                // 提取模式和修饰符（如从 "/\[color=.*?\]/g" 中提取模式和 "g"）
                pattern = regexParts[1];
                flags = regexParts[2] || '';
                // 确保添加全局匹配修饰符，避免只替换第一个
                if (!flags.includes('g')) flags += 'g';
            } else {
                // 处理纯模式（不带 / 包裹）
                pattern = regexStr;
                flags = 'g'; // 默认全局匹配
            }

            // 创建正则对象（自动处理字符串中的转义）
            const regex = new RegExp(pattern, flags);

            // 执行替换并返回结果
            return targetStr.replace(regex, replaceStr);
        } catch (error) {
            alert('正则表达式错误:', error.message);
            return targetStr; // 错误时返回原始字符串
        }
    }

}