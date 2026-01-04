import requests
import re
import os
import time
import json
import random
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 全局变量配置
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
# 账号密码环境变量名
OSAP = "mtluntan"
PROFILE_CHECK_URL = 'https://bbs.binmt.cc/home.php?mod=space&do=profile&set=comiis&mycenter=1'
INVALID_COOKIE_MARKER = '<title>提示信息 - MT论坛</title>'

# 重试/超时配置（全局统一）
RETRY_TIMES = 3  # 3次重试
CONNECT_TIMEOUT = 3  # 连接超时3秒
READ_TIMEOUT = 3  # 读取超时3秒，总超时6秒
BACKOFF_FACTOR = 0.5  # 重试间隔：0.5s、1s、2s（指数递增，避免频繁请求）


def init_request_session():
    """初始化请求会话：配置重试、超时、请求后关闭连接，提高鲁棒性"""
    session = requests.session()
    # 1. 配置重试规则：仅重试连接错误、超时错误，不重试4xx/5xx（避免无效重试）
    retry_strategy = Retry(
        total=RETRY_TIMES,
        backoff_factor=BACKOFF_FACTOR,
        status_forcelist=[],  # 不根据响应码重试（如需重试5xx，可加[500,502,503,504]）
        allowed_methods=["GET", "POST"],  # 仅对GET/POST请求重试
        connect=CONNECT_TIMEOUT,
        read=READ_TIMEOUT
    )
    # 2. 绑定适配器到会话
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    # 3. 请求后自动关闭连接，避免资源占用
    session.hooks["response"] = lambda r, *args, **kwargs: r.connection.close()
    return session


def randomSkipSignInByHour():
    """随机函数，返回true概率逐渐增大"""
    h = datetime.now().hour
    return random.random() > h / 22


def init_cache(username):
    """初始化指定账号的缓存"""
    cache_file = f'cache/{username}.json'
    cache_data = {'cookie': '', 'sign_date': ''}
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                cache_data['cookie'] = loaded.get('cookie', '')
                cache_data['sign_date'] = loaded.get('sign_date', '')
            print("缓存加载成功")
        except Exception as e:
            print(f"缓存加载异常：{str(e)}")
    else:
        print("缓存文件不存在")
    return cache_data, cache_file


def save_cache(username, cache_file, cookie, sign_date=None):
    """保存指定账号的缓存"""
    os.makedirs(os.path.dirname(cache_file), exist_ok=True)
    cache_data = {
        'cookie': cookie,
        'sign_date': sign_date if sign_date is not None else ''
    }
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        print("缓存保存成功")
    except Exception as e:
        print(f"缓存保存异常：{str(e)}")


def send_notification(username, success, reward, message):
    """发送简洁通知"""
    time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if success:
        title = f"[mt论坛]{username}签到成功"
        content = f"账号：{username}\n获得金币：{reward}\n时间：{time_str}"
    else:
        title = f"[mt论坛]{username}签到失败"
        content = f"账号：{username}\n错误信息：{message}\n时间：{time_str}"

    try:
        # 假设QLAPI已存在，保持原通知调用方式
        notify_res = QLAPI.systemNotify({"title": title, "content": content})
        if notify_res.get("code") == 200:
            print("通知发送成功")
        else:
            print(f"通知发送失败：{notify_res.get('message', '未知错误')}")
    except Exception as e:
        print(f"通知发送异常：{str(e)}")


def verify_cookie_validity(session, cookie):
    """验证Cookie有效性：区分“请求失败”与“Cookie无效” """
    print("验证Cookie有效性")
    if not cookie:
        print("缓存无Cookie")
        return False, "缓存无Cookie"  # 新增返回值：是否有效+状态说明

    # 加载Cookie到会话
    cookie_items = {}
    for item in cookie.split('; '):
        if '=' in item:
            k, v = item.split('=', 1)
            cookie_items[k] = v
    session.cookies.update(cookie_items)
    print("访问个人中心")

    try:
        # 带超时请求（总6秒：连接3秒+读取3秒），重试已在session中配置
        response = session.get(
            PROFILE_CHECK_URL,
            headers={'User-Agent': USER_AGENT},
            allow_redirects=False,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        # 仅当请求成功且包含标记时，才判定Cookie无效
        if INVALID_COOKIE_MARKER in response.text:
            print("Cookie无效")
            return False, "Cookie无效"
        print("Cookie有效")
        return True, "Cookie有效"
    except requests.exceptions.RequestException as e:
        # 重试3次后仍失败：判定为“请求异常”，而非Cookie无效（核心修复）
        err_msg = f"请求异常：{str(e)}"
        print(err_msg)
        return False, err_msg  # 无效是因请求失败，不是Cookie本身问题


def perform_login(username, password):
    """执行登录，返回session和登录结果"""
    print("执行登录流程")
    # 用统一工具函数初始化session（自带重试/超时/关连接）
    session = init_request_session()
    headers = {'User-Agent': USER_AGENT}

    # 初始化会话并获取登录页面参数（带超时）
    try:
        session.get('https://bbs.binmt.cc', headers=headers, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
    except requests.exceptions.RequestException as e:
        return session, False, f"初始化会话失败：{str(e)}"

    login_page_url = 'https://bbs.binmt.cc/member.php?mod=logging&action=login&infloat=yes&handlekey=login&inajax=1&ajaxtarget=fwin_content_login'

    try:
        # 提取loginhash和formhash（带超时）
        login_page_res = session.get(login_page_url, headers=headers, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
        loginhash = re.findall('loginhash=(.*?)">', login_page_res.text)[0]
        formhash = re.findall('formhash" value="(.*?)".*? />', login_page_res.text)[0]
        print("成功获取loginhash和formhash")
    except IndexError:
        return session, False, "登录参数（loginhash/formhash）提取失败"
    except requests.exceptions.RequestException as e:
        return session, False, f"获取登录页失败：{str(e)}"

    # 构造登录请求数据
    login_submit_url = f'https://bbs.binmt.cc/member.php?mod=logging&action=login&loginsubmit=yes&handlekey=login&loginhash={loginhash}&inajax=1'
    login_data = {
        'formhash': formhash,
        'referer': 'https://bbs.binmt.cc/forum.php',
        'loginfield': 'username',
        'username': username,
        'password': password,
        'questionid': '0',
        'answer': ''
    }

    try:
        # 提交登录请求（带超时）
        login_res = session.post(
            login_submit_url,
            headers=headers,
            data=login_data,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        if '欢迎您回来' in login_res.text:
            user_info = re.findall('欢迎您回来，(.*?)，现在', login_res.text)[0]
            print(f"{user_info}：登录成功")
            return session, True, "登录成功"
        # 提取错误信息
        error_msg = re.findall("CDATA(.*?)<", login_res.text)[0] if re.findall("CDATA(.*?)<", login_res.text) else "未知错误"
        return session, False, f"登录失败：{error_msg}"
    except requests.exceptions.RequestException as e:
        return session, False, f"登录请求失败：{str(e)}"


def perform_sign(session):
    """执行签到，返回结果、奖励、信息"""
    print("执行签到流程")
    headers = {'User-Agent': USER_AGENT}
    sign_page_url = 'https://bbs.binmt.cc/k_misign-sign.html'

    try:
        # 获取签到所需formhash（带超时）
        sign_page_res = session.get(sign_page_url, headers=headers, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
        formhash = re.findall('formhash" value="(.*?)".*? />', sign_page_res.text)[0]
        print(f"成功获取签到formhash")
    except IndexError:
        err_msg = "签到参数（formhash）提取失败"
        print(err_msg)
        return False, 0, err_msg
    except requests.exceptions.RequestException as e:
        err_msg = f"获取签到页失败：{str(e)}"
        print(err_msg)
        return False, 0, err_msg

    # 构造并发送签到请求
    sign_submit_url = f'https://bbs.binmt.cc/plugin.php?id=k_misign:sign&operation=qiandao&format=text&formhash={formhash}'
    try:
        sign_res = session.get(sign_submit_url, headers=headers, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
        sign_status = re.findall('<root><(.*?)</root>', sign_res.text)[0] if re.findall('<root><(.*?)</root>', sign_res.text) else "未知"
        print(f"签到状态：{sign_status}")

        if '已签' in sign_res.text or '成功' in sign_status:
            # 获取签到排名和奖励（带超时）
            detail_res = session.get(sign_page_url, headers=headers, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
            rank = re.findall('您的签到排名：(.*?)</div>', detail_res.text)[0] if re.findall('您的签到排名：(.*?)</div>', detail_res.text) else "未知"
            reward = re.findall('id="lxreward" value="(.*?)">', detail_res.text)[0] if re.findall('id="lxreward" value="(.*?)">', detail_res.text) else "0"
            print(f"签到成功（排名：{rank}，奖励：{reward}金币）")
            return True, int(reward), f"排名：{rank}"
        return False, 0, f"签到失败（状态：{sign_status}）"
    except requests.exceptions.RequestException as e:
        err_msg = f"签到请求失败：{str(e)}"
        print(err_msg)
        return False, 0, err_msg


if __name__ == '__main__':
    start_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{start_time}] \n===[MT论坛] 多账号挂机+签到===")

    # 读取环境变量
    if OSAP not in os.environ:
        print(f"未找到环境变量{OSAP}")
        try:
            QLAPI.systemNotify({"title": f"未找到环境变量{OSAP}", "content": f"时间：{start_time}"})
        except:
            pass
        exit(1)

    mt_accounts_str = os.environ.get(OSAP)
    # 按#分割多账号
    accounts = mt_accounts_str.split('#')
    print(f"共解析到{len(accounts)}个账号")

    TODAY_DATE = datetime.now().strftime('%Y-%m-%d')

    # 遍历所有账号，带间隔处理
    for i, acc in enumerate(accounts):
        acc = acc.strip()
        if not acc:
            print("跳过空账号")
            continue

        if '&' not in acc:
            print(f"账号格式错误（{acc}），需为「账号&密码」")
            send_notification(acc, False, 0, "格式错误，需为「账号&密码」")
            continue

        # 分割账号密码
        username, password = acc.split('&', 1)
        username = username.strip()
        password = password.strip()
        print(f"\n===== 处理账号：{username} =====")

        # 初始化缓存
        cache_data, cache_file = init_cache(username)
        cookie = cache_data['cookie']
        sign_date = cache_data['sign_date']

        # 初始化会话
        session = init_request_session()

        # 验证Cookie有效性：接收“是否有效”和“状态说明”，避免误判（核心修复）
        cookie_valid, cookie_msg = verify_cookie_validity(session, cookie)

        # Cookie无效（含“缓存无Cookie”“真实无效”）才执行登录；“请求异常”不登录（避免无效登录）
        login_success = False
        if not cookie_valid:
            if cookie_msg in ["缓存无Cookie", "Cookie无效"]:
                # 仅真实Cookie问题才登录
                session, login_success, login_msg = perform_login(username, password)
                if not login_success:
                    send_notification(username, False, 0, login_msg)
                else:
                    # 保存登录后的Cookie
                    new_cookie = '; '.join([f"{k}={v}" for k, v in session.cookies.items()])
                    save_cache(username, cache_file, new_cookie)
            else:
                # 若为“请求异常”，不登录，直接通知
                send_notification(username, False, 0, cookie_msg)
                # 跳过后续签到（请求失败，无法继续）
                login_success = False
        else:
            login_success = True

        # 检查今日是否已签到（仅登录成功/ Cookie有效时执行）
        if login_success and sign_date == TODAY_DATE:
            print("今日已完成签到")
        elif login_success:
            # 延迟1秒执行签到
            time.sleep(1)
            # 12以前随机签到，且越来越大
            if randomSkipSignInByHour():
                print("随机跳过此次签到")
            else:
                # 执行签到（自带重试/超时）
                sign_success, reward, sign_msg = perform_sign(session)

                # 处理签到结果
                if sign_success:
                    # 保存签到状态
                    current_cookie = '; '.join([f"{k}={v}" for k, v in session.cookies.items()])
                    save_cache(username, cache_file, current_cookie, TODAY_DATE)
                    send_notification(username, True, reward, sign_msg)
                else:
                    send_notification(username, False, 0, sign_msg)

        # 账号处理完毕后，除最后一个账号外，间隔2秒
        if i != len(accounts) - 1:
            print(f"等待2秒后处理下一个账号...")
            time.sleep(2)

    end_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"\n[{end_time}] \n所有账号处理完毕")
