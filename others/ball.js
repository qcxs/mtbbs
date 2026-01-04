// 定义核心变量
let ballSize = 60; // 悬浮球大小
let floatingBall; // 悬浮球元素引用
let optionsPanel; // 选项面板引用
let optionsList; // 选项列表引用
let positionMask; // 位置遮罩引用
let lastRequestTime = 0; // 上次发送请求的时间戳
let checkInterval; // 检查定时器（10秒一次）

// 获取当前窗口尺寸的唯一标识（用于缓存键）
function getWindowKey() {
    const width = window.innerWidth || document.documentElement.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight;
    return `${width},${height}`; // 格式: "宽度,高度"
}

// 从缓存加载设置（支持多窗口尺寸）
function loadSettings() {
    // 1. 加载大小设置
    const sizeStr = localStorage.getItem('floatingBallSize');
    if (sizeStr) {
        const parsedSize = parseInt(sizeStr, 10);
        ballSize = isNaN(parsedSize) ? 60 : Math.max(30, Math.min(100, parsedSize));
    }

    // 2. 加载位置设置（按当前窗口尺寸查找）
    const positionsStr = localStorage.getItem('floatingBallPositions');
    const positions = positionsStr ? JSON.parse(positionsStr) : {};
    const windowKey = getWindowKey();

    // 默认位置：左上角（距离顶部和左侧各20px）
    const defaultPosition = {
        x: 20,
        y: 50
    };

    // 优先使用当前窗口尺寸对应的缓存位置，无则使用默认
    return {
        position: positions[windowKey] ? { ...positions[windowKey] } : defaultPosition
    };
}

// 保存大小设置到缓存
function saveSizeSetting(size) {
    localStorage.setItem('floatingBallSize', size.toString());
}

// 保存位置设置到缓存（关联当前窗口尺寸）
function savePositionSetting(position) {
    const positionsStr = localStorage.getItem('floatingBallPositions');
    const positions = positionsStr ? JSON.parse(positionsStr) : {};
    const windowKey = getWindowKey();

    // 存储当前窗口尺寸对应的位置
    positions[windowKey] = { ...position };
    localStorage.setItem('floatingBallPositions', JSON.stringify(positions));
}

// 确保悬浮球在视口内
function ensureVisibleInViewport() {
    if (!floatingBall) return;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const currentX = parseFloat(floatingBall.style.left) || 0;
    const currentY = parseFloat(floatingBall.style.top) || 0;

    // 强制约束在视口内
    const constrainedX = Math.max(0, Math.min(currentX, viewportWidth - ballSize));
    const constrainedY = Math.max(0, Math.min(currentY, viewportHeight - ballSize));

    if (constrainedX !== currentX || constrainedY !== currentY) {
        floatingBall.style.left = `${constrainedX}px`;
        floatingBall.style.top = `${constrainedY}px`;

        // 同步更新缓存中当前窗口的位置（避免超出视口后下次加载仍有问题）
        savePositionSetting({ x: constrainedX, y: constrainedY });
    }
}

// 窗口大小变化时重新加载位置（核心逻辑）
function handleWindowResize() {
    // 重新加载当前窗口尺寸对应的位置设置
    const { position } = loadSettings();
    floatingBall.style.left = `${position.x}px`;
    floatingBall.style.top = `${position.y}px`;

    // 确保新位置在视口内
    ensureVisibleInViewport();

    // 同步更新菜单位置
    if (optionsPanel.classList.contains('active')) {
        updateOptionsPanelPosition();
    }
}

// 清理资源
function cleanupResources() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }

    // 移除动态创建的元素
    if (floatingBall && floatingBall.parentNode) floatingBall.parentNode.removeChild(floatingBall);
    if (optionsPanel && optionsPanel.parentNode) optionsPanel.parentNode.removeChild(optionsPanel);
    if (positionMask && positionMask.parentNode) positionMask.parentNode.removeChild(positionMask);
}

// 创建样式
function createStyles() {
    if (document.getElementById('floating-ball-styles')) return;

    const style = document.createElement('style');
    style.id = 'floating-ball-styles';
    style.textContent = `
        .floating-ball {
            position: fixed !important;
            width: ${ballSize}px;
            height: ${ballSize}px;
            background-color: #4a90e2;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${ballSize * 0.5}px;
            z-index: 9999 !important;
            transition: all 0.3s ease;
            position: relative;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
        }

        .floating-ball:hover {
            background-color: #3a80d2;
            transform: scale(1.05);
        }

        .floating-ball-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #ff3b30;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
        }

        .floating-ball-badge.visible {
            opacity: 1;
            visibility: visible;
        }

        .options-panel {
            position: fixed;
            width: 100px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            z-index: 9998;
            transition: all 0.3s ease;
            opacity: 0;
            visibility: hidden;
            margin: 0;
            padding: 0;
        }

        .options-panel.active {
            opacity: 1;
            visibility: visible;
        }

        .options-list {
            max-height: 300px;
            overflow-y: auto;
            margin: 0;
            padding: 0;
        }

        .option-item {
            padding: 15px 10px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background-color 0.2s;
            list-style: none;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .option-item:last-child {
            border-bottom: none;
        }

        .option-item:hover {
            background-color: #f5f7fa;
        }

        .options-list::-webkit-scrollbar {
            width: 6px;
        }

        .options-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .options-list::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
        }

        .position-mask {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            cursor: pointer;
        }

        .position-mask.active {
            display: flex;
        }
    `;

    document.head.appendChild(style);
}

// 创建悬浮球和选项面板
function createFloatingElements() {
    // 加载当前窗口对应的设置
    const { position } = loadSettings();

    // 创建样式
    createStyles();

    // 定义菜单项（"设置位置"用于保存位置）
    const menuItems = [
        { key: '侧滑栏' },
        { key: '设置位置' },
        { key: '图床', value: 'https://img.binmt.cc' },
        { key: '消息', value: 'https://bbs.binmt.cc/home.php?mod=space&do=notice' },
        { key: '签到', value: 'https://bbs.binmt.cc/k_misign-sign.html' },
        { key: '导读', value: 'https://bbs.binmt.cc/forum.php?mod=guide&view=newthread&index=1' },
        { key: '个人中心', value: 'https://bbs.binmt.cc/home.php?mod=space&do=profile' },
        { key: '搜索', value: 'https://bbs.binmt.cc/search.php?mod=forum' },
        { key: '精华帖', value: 'https://bbs.binmt.cc/forum.php?mod=guide&view=digest&index=1' },
        { key: '设置大小' },
    ];

    // ========== 动态创建悬浮球 ==========
    floatingBall = document.createElement('div');
    floatingBall.className = 'floating-ball';
    floatingBall.style.left = `${position.x}px`;
    floatingBall.style.top = `${position.y}px`;
    floatingBall.innerHTML = `
        ☰
        <span class="floating-ball-badge"></span>
    `;
    document.body.appendChild(floatingBall);

    // ========== 动态创建选项面板 ==========
    optionsPanel = document.createElement('div');
    optionsPanel.className = 'options-panel';

    optionsList = document.createElement('ul');
    optionsList.className = 'options-list';
    optionsPanel.appendChild(optionsList);

    document.body.appendChild(optionsPanel);

    // ========== 动态创建位置遮罩 ==========
    positionMask = document.createElement('div');
    positionMask.className = 'position-mask';
    positionMask.textContent = '点击屏幕任意位置设置悬浮球固定位置';
    document.body.appendChild(positionMask);

    // 初始化位置检查
    ensureVisibleInViewport();

    // 添加菜单项
    menuItems.forEach(item => {
        const optionItem = document.createElement('li');
        optionItem.className = 'option-item';
        optionItem.textContent = item.key;

        optionItem.addEventListener('click', (e) => {
            e.stopPropagation();

            switch (item.key) {
                case '侧滑栏':
                    window.comiis_leftnv();
                    break;
                case '图床':
                case '签到':
                case '导读':
                case '个人中心':
                case '搜索':
                case '精华帖':
                    window.open(item.value, '_blank');
                    break;
                case '消息':
                    window.open(item.value, '_blank');
                    updateNotificationBadge(0);
                    saveNotificationData(0);
                    break;
                case '设置大小':
                    handleSizeSetting();
                    break;
                case '设置位置':
                    handlePositionSetting();
                    break;
            }

            optionsPanel.classList.remove('active');
        });

        optionsList.appendChild(optionItem);
    });

    // 处理大小设置
    function handleSizeSetting() {
        const sizeInput = prompt(`请输入悬浮球大小（30-100px）：`, ballSize);
        if (sizeInput === null) return;

        const newSize = parseInt(sizeInput, 10);
        if (isNaN(newSize) || newSize < 30 || newSize > 100) {
            alert('请输入30-100之间的数字');
            return;
        }

        ballSize = newSize;
        floatingBall.style.width = `${ballSize}px`;
        floatingBall.style.height = `${ballSize}px`;
        floatingBall.style.fontSize = `${ballSize * 0.5}px`;

        // 更新样式
        const styleElement = document.getElementById('floating-ball-styles');
        if (styleElement) {
            document.head.removeChild(styleElement);
            createStyles();
        }

        saveSizeSetting(ballSize);
        ensureVisibleInViewport();
    }

    // 处理位置设置（保存到当前窗口尺寸对应的缓存）
    function handlePositionSetting() {
        positionMask.classList.add('active');

        const maskClickHandler = (e) => {
            e.stopPropagation();

            try {
                const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
                const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

                // 计算悬浮球左上角坐标（点击位置为中心）
                const newX = clientX - ballSize / 2;
                const newY = clientY - ballSize / 2;

                // 限制在视口内
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const constrainedX = Math.max(0, Math.min(newX, viewportWidth - ballSize));
                const constrainedY = Math.max(0, Math.min(newY, viewportHeight - ballSize));

                // 更新并保存当前窗口尺寸对应的位置
                floatingBall.style.left = `${constrainedX}px`;
                floatingBall.style.top = `${constrainedY}px`;
                savePositionSetting({ x: constrainedX, y: constrainedY });

            } catch (error) {
                console.error("位置设置错误:", error);
                alert(`位置设置失败: ${error.message}`);
            } finally {
                positionMask.classList.remove('active');
                positionMask.removeEventListener('click', maskClickHandler);
            }
        };

        positionMask.addEventListener('click', maskClickHandler);
    }

    // 智能计算菜单位置
    function updateOptionsPanelPosition() {
        const rect = floatingBall.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const panelWidth = optionsPanel.offsetWidth;
        const panelHeight = optionsPanel.offsetHeight;
        const ballCenterY = rect.top + rect.height / 2;

        // 判断悬浮球是否在顶部区域
        const isNearTop = rect.top < rect.height;

        // 判断悬浮球是否在中间区域
        const viewportMiddleY = viewportHeight / 2;
        const isInMiddle = Math.abs(ballCenterY - viewportMiddleY) < viewportHeight / 4;

        // 初始X位置：优先放在悬浮球右侧（左上角默认位置，右侧空间更充足）
        let panelX = rect.right + 5;

        // 如果右侧空间不足，放在左侧
        if (panelX + panelWidth > viewportWidth) {
            panelX = rect.left - panelWidth - 5;
        }

        // Y位置计算
        let panelY;

        if (isNearTop) {
            // 顶部：菜单顶部与悬浮球顶部对齐
            panelY = rect.top;
        } else if (isInMiddle) {
            // 中间：菜单中间与悬浮球中心齐平
            panelY = ballCenterY - (panelHeight / 2);
        } else {
            // 底部：菜单底部与悬浮球底部对齐
            panelY = rect.bottom - panelHeight;
        }

        // 最终约束
        panelX = Math.max(0, Math.min(panelX, viewportWidth - panelWidth));
        panelY = Math.max(0, Math.min(panelY, viewportHeight - panelHeight));

        optionsPanel.style.left = `${panelX}px`;
        optionsPanel.style.top = `${panelY}px`;
    }

    // 更新小红点
    function updateNotificationBadge(count) {
        const badge = floatingBall.querySelector('.floating-ball-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.add('visible');
            } else {
                badge.textContent = '';
                badge.classList.remove('visible');
            }
        }
    }

    // 保存通知数据到缓存
    function saveNotificationData(count) {
        localStorage.setItem('notificationCache', JSON.stringify({
            count,
            timestamp: Date.now()
        }));
    }

    // 从缓存读取通知数据
    function getNotificationData() {
        const cacheStr = localStorage.getItem('notificationCache');
        return cacheStr ? JSON.parse(cacheStr) : null;
    }

    // 发送通知请求（30秒间隔）
    async function fetchNotifications() {
        const now = Date.now();
        const thirtySeconds = 30 * 1000;

        if (now - lastRequestTime < thirtySeconds) {
            return;
        }

        try {
            const response = await fetch('https://bbs.binmt.cc/home.php?mod=space&do=profile');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            if (html.includes('登录')) {
                throw new Error('需要登录');
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const notificationElement = doc.querySelector('.sidenv_num.bg_del.f_f');
            const count = notificationElement ? parseInt(notificationElement.textContent.trim(), 10) : 0;
            const validCount = isNaN(count) ? 0 : count;

            updateNotificationBadge(validCount);
            saveNotificationData(validCount);
            lastRequestTime = now;

        } catch (error) {
            console.error('获取通知失败:', error);
            cleanupResources();
        }
    }

    // 初始化定时器
    function initNotificationChecker() {
        fetchNotifications().then(() => {
            lastRequestTime = Date.now();
        });

        checkInterval = setInterval(() => {
            if (!document.hidden) {
                fetchNotifications();
            }
        }, 10000);
    }

    // 监听窗口大小变化
    function setupResizeListener() {
        window.addEventListener('resize', handleWindowResize);
        return handleWindowResize; // 用于清理
    }

    // 悬浮球点击事件
    floatingBall.addEventListener('click', () => {
        if (optionsPanel.classList.contains('active')) {
            optionsPanel.classList.remove('active');
        } else {
            updateOptionsPanelPosition();
            optionsPanel.classList.add('active');
        }
    });

    // 点击其他地方关闭菜单
    const documentClickHandler = (e) => {
        if (!floatingBall.contains(e.target) && !optionsPanel.contains(e.target)) {
            optionsPanel.classList.remove('active');
        }
    };
    document.addEventListener('click', documentClickHandler);

    // 初始化
    const resizeHandler = setupResizeListener();
    initNotificationChecker();

    // 返回清理函数
    return () => {
        cleanupResources();
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('click', documentClickHandler);
        const styleElement = document.getElementById('floating-ball-styles');
        if (styleElement) {
            document.head.removeChild(styleElement);
        }
    };
}

// 初始化函数
function initFloatingBall() {
    return createFloatingElements();
}

// 初始化悬浮球
const cleanupFloatingBall = initFloatingBall();
