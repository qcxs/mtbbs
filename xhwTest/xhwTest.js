function xhw() {
    // 配置参数
    const API_URL = 'forum.php?mod=misc&action=showdarkroom&cid=';
    const AVATAR_API = 'uc_server/avatar.php?uid=';
    const SPACE_URL = 'home.php?mod=space&uid=';
    let currentCid = '';
    let isLoading = false;
    let isFiltering = false;
    let allData = [];

    // 创建DOM元素
    const mask = document.createElement('div');
    mask.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.3); z-index: 9998;
    `;
    document.body.append(mask);

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 550px; max-width: 90%; max-height: 80vh; background: #fff;
        border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        z-index: 9999; display: flex; flex-direction: column;
    `;
    mask.append(modal);

    // 标题栏（标题加粗居中）
    const header = document.createElement('div');
    header.style.cssText = `padding:8px 16px; display: flex; justify-content: space-between; align-items: center;`;
    header.innerHTML = `<h3 style="text-align:center; font-weight:bold;font-size:20px; flex-grow:1">小黑屋名单</h3><span style="font-size:32px; margin-left:16px">×</span>`;
    modal.append(header);
    header.querySelector('span').addEventListener('click', () => mask.remove());

    // 过滤框
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = `padding: 8px 16px;`;
    filterContainer.innerHTML = `<input type="text" placeholder="过滤用户名/UID" style="width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;border-radius:4px;font-size:14px">`;
    modal.append(filterContainer);
    const filterInput = filterContainer.querySelector('input');

    // 列表容器
    const listContainer = document.createElement('div');
    listContainer.style.cssText = `flex-grow:1; overflow-y:auto; padding:16px;`;
    modal.append(listContainer);

    // 底部按钮（缩小按钮尺寸）
    const footer = document.createElement('div');
    footer.style.cssText = `padding:8px 16px; border-top:1px solid #eee; text-align:right;`;
    footer.innerHTML = `<button style="margin-left:8px;padding:6px 12px;background:#1890ff;color:white;border:none;border-radius:4px;font-size:14px">下一页</button>
                       <button style="margin-left:8px;padding:6px 12px;background:white;color:#1890ff;border:1px solid #1890ff;border-radius:4px;font-size:14px">关闭</button>`;
    modal.append(footer);
    footer.querySelectorAll('button')[1].addEventListener('click', () => mask.remove());
    const nextBtn = footer.querySelectorAll('button')[0];

    // 核心修复：增强JSON解析前的文本清理
    async function loadData(cid = '') {
        if (isLoading) return;
        isLoading = true;
        // 初始加载时显示加载中，追加时不替换内容
        if (!cid) {
            listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:#666">加载中...</div>';
        } else {
            listContainer.innerHTML += '<div class="loading" style="text-align:center;padding:10px;color:#666">加载更多...</div>';
        }

        try {
            const response = await fetch(`${API_URL}${cid}&ajaxdata=json`);
            if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);

            let text = await response.text();
            text = text.replace(/^\uFEFF/, '');
            const entities = {
                '&nbsp;': ' ', '&quot;': '"', '&amp;': '&',
                '&lt;': '<', '&gt;': '>', '&#039;': "'"
            };
            text = text.replace(/&nbsp;|&quot;|&amp;|&lt;|&gt;|&#039;/g, match => entities[match]);
            text = text.replace(/\/\*.*?\*\//g, '').replace(/[\t\n\r]/g, '').replace(/([^\\])"/g, '$1"');

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                const fixedText = text.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
                data = JSON.parse(fixedText);
            }

            const messageParts = data.message.split('|');
            const nextCid = messageParts[1] || '';
            const items = [];
            // 保留原始数据顺序（通过cid排序保持）
            const keys = Object.keys(data.data);
            keys.forEach(key => {
                const item = data.data[key];
                items.push({
                    uid: item.uid,
                    status: item.action,
                    expireTime: item.groupexpiry,
                    nickname: item.username,
                    handlerUid: item.operatorid,
                    handlerNickname: item.operator,
                    handlerRemark: item.reason,
                    dateline: item.dateline.replace(/&nbsp;/g, ' '),
                    cid: item.cid // 用于保持原始顺序
                });
            });
            // 按cid降序排列，确保与原始返回顺序一致
            items.sort((a, b) => b.cid - a.cid);

            // 更新数据（追加模式）
            allData = cid ? [...allData, ...items] : items;
            currentCid = nextCid;
            nextBtn.disabled = !currentCid;

            // 移除加载提示
            const loadingEl = listContainer.querySelector('.loading');
            if (loadingEl) loadingEl.remove();

            // 渲染数据（初始加载全量渲染，后续追加）
            if (cid) {
                renderNewItems(items);
            } else {
                renderList(allData);
            }

        } catch (error) {
            const errorPos = error.message.match(/position (\d+)/)?.[1];
            const context = errorPos ?
                `错误位置附近文本: ${text.substring(Math.max(0, errorPos - 20), parseInt(errorPos) + 20)}` : '';

            listContainer.innerHTML = `
                <div style="padding:20px;color:#ff4d4f">
                    <div>加载失败: ${error.message}</div>
                    <div style="margin-top:8px;font-size:12px">${context}</div>
                </div>
            `;
        } finally {
            isLoading = false;
        }
    }

    // 渲染完整列表（用于初始加载和过滤）
    function renderList(list) {
        if (!list.length) {
            listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:#999">没有匹配记录</div>';
            return;
        }

        listContainer.innerHTML = list.map(item => getListItemHtml(item)).join('');
    }

    // 追加新项（用于加载更多）
    function renderNewItems(newItems) {
        if (!newItems.length) return;
        listContainer.innerHTML += newItems.map(item => getListItemHtml(item)).join('');
    }

    // 列表项HTML生成函数（复用）
    function getListItemHtml(item) {
        return `
            <div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:12px">
                <div style="display:flex;gap:12px">
                    <a href="${SPACE_URL}${item.uid}" target="_blank">
                        <img src="${AVATAR_API}${item.uid}&size=middle" 
                             onerror="this.src='${AVATAR_API}&size=middle'"
                             style="width:40px;height:40px;border-radius:50%;object-fit:cover">
                    </a>
                    <div>
                        <div style="display:flex;justify-content:space-between">
                            <a href="${SPACE_URL}${item.uid}" target="_blank" style="font-weight:bold">${item.nickname}</a>
                            <span style="font-size:12px;color:#666">UID: ${item.uid}</span>
                        </div>
                        <div style="font-size:12px;color:#666;margin:4px 0">${item.dateline}</div>
                        <div style="display:flex;gap:8px;margin-top:6px">
                            <span style="padding:2px 8px;background:${item.expireTime === '永不过期' ? '#ff4d4f' : '#faad14'};color:white;border-radius:4px;font-size:12px">${item.status}</span>
                            <span style="padding:2px 8px;background:#f5f5f5;color:#666;border-radius:4px;font-size:12px">到期: ${item.expireTime}</span>
                        </div>
                    </div>
                </div>
                <div style="background:#f5f5f5;border-radius:6px;padding:8px;margin-top:12px;display:flex;align-items:center;gap:8px">
                    <a href="${SPACE_URL}${item.handlerUid}" target="_blank">
                        <img src="${AVATAR_API}${item.handlerUid}&size=middle" 
                             onerror="this.src='${AVATAR_API}&size=middle'"
                             style="width:30px;height:30px;border-radius:50%;object-fit:cover">
                    </a>
                    <div style="font-size:12px">
                        <a href="${SPACE_URL}${item.handlerUid}" target="_blank">${item.handlerNickname}</a><br>
                        <span style='font-weight: 500;'>${item.handlerRemark}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 滚动到底部自动加载下一页
    listContainer.addEventListener('scroll', () => {
        if (isLoading || isFiltering || !currentCid) return;
        const { scrollTop, clientHeight, scrollHeight } = listContainer;
        // 距离底部小于100px时触发加载
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadData(currentCid);
        }
    });

    // 事件监听
    nextBtn.addEventListener('click', () => currentCid && loadData(currentCid));
    filterInput.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        isFiltering = !!filter; // 设置过滤状态
        nextBtn.disabled = isFiltering; // 过滤时禁用下一页按钮
        renderList(filter ? allData.filter(item =>
            item.uid.toString().includes(filter) || item.nickname.toLowerCase().includes(filter)
        ) : allData);
    });

    // 初始加载
    loadData();
}

const ul = document.querySelector('.comiis_left_Touch');
if (ul) {
    ul.innerHTML += `
    <li class="comiis_left_Touch">
      <a href="javascript:xhw();" class="comiis_left_Touch">
        <i class="comiis_font comiis_left_Touch" style="color:#ff4d4f;"></i>
        小黑屋
      </a>
    </li>
  `;
}
