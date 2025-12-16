initMenu()

// 初始化函数：将菜单添加到textarea下方
function initMenu() {
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
    const menuItems = [
        { name: 'code', isShow: true },
        { name: '删除线', isShow: true },
        { name: '字号', isShow: true },
        { name: '颜色', isShow: true },
        { name: 'url', isShow: true },
        { name: '对齐', isShow: true },
        { name: 'img', isShow: true },
        { name: '水平线', isShow: true },
        { name: 'hide', isShow: true },
        { name: '加粗', isShow: true },
        { name: '斜体', isShow: true },
        { name: '下划线', isShow: true },
        { name: '邮件', isShow: true },
        { name: '引用', isShow: true },
        { name: '视频', isShow: true },
        { name: 'QQ', isShow: true },
    ];

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

        // if (!selectedText) {
        //     console.log('请先选择文本内容');
        //     return;
        // }

        let newText, newStart, newEnd;

        // 使用switch处理不同操作
        switch (name) {
            case '加粗':
                newText = `[b]${selectedText}[/b]`;
                break;
            case '斜体':
                newText = `[i]${selectedText}[/i]`;
                break;
            case '下划线':
                newText = `[u]${selectedText}[/u]`;
                break;
            case '删除线':
                newText = `[s]${selectedText}[/s]`;
                break;
            case '字号':
                newText = `[size=1-9]${selectedText}[/size]`;
                break;
            case '颜色':
                newText = `[color=#FF0000]${selectedText}[/color]`;
                break;
            case 'url':
                newText = `[url=${selectedText}]${selectedText}[/url]`;
                break;
            case '邮件':
                newText = `[email=${selectedText}]${selectedText}[/email]`;
                break;
            case 'img':
                newText = `[img]${selectedText}[/img]`;
                break;
            case '水平线':
                newText = `[hr]${selectedText}`;
                break;
            case '对齐':
                newText = `[align=left/center/right]${selectedText}[/align]`;
                break;
            case 'code':
                newText = `[code]${selectedText}[/code]`;
                break;
            case '引用':
                newText = `[quote]${selectedText}[/quote]`;
                break;
            case 'hide':
                newText = `[hide]${selectedText}[/hide]`;
                break;
            case '视频':
                newText = `[media=x,500,375]${selectedText}[/media]`;
                break;
            case 'QQ':
                newText = `[qq]${selectedText}[/qq]`;
                break;
            default:
                alert('未知操作');
                return;
        }

        // 更新文本框内容
        const fullText = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.value = fullText;

        // 重新设置光标位置
        newStart = start;
        newEnd = start + newText.length;
        textarea.focus();
        textarea.selectionStart = newStart;
        textarea.selectionEnd = newEnd;
    }

}