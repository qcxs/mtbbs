import requests
import re
import os
import time
import json
import random
from datetime import datetime

# 全局配置变量
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
SESSION = requests.session()
# 账号密码环境变量名
OSAP="qcxs_mtbbs"
CACHE_FILE = f'cache/{OSAP}.json'
TODAY_DATE = datetime.now().strftime('%Y-%m-%d')
PROFILE_CHECK_URL = 'https://bbs.binmt.cc/home.php?mod=space&do=profile&set=comiis&mycenter=1'
INVALID_COOKIE_MARKER = '<title>提示信息 - MT论坛</title>'

# 全局缓存变量（仅在程序开始时读取一次）
cache_data = {'cookie': '', 'sign_date': ''}


def print_log(content):
    """统一日志打印格式"""
    print(f"  {content}")
    return content + '\n'


def init_cache():
    """初始化缓存：程序启动时读取一次"""
    log = ""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                global cache_data
                cache_data = json.load(f)
                # 确保缓存结构完整
                if 'cookie' not in cache_data:
                    cache_data['cookie'] = ''
                if 'sign_date' not in cache_data:
                    cache_data['sign_date'] = ''
                log += print_log("缓存加载成功")
        except Exception as e:
            log += print_log(f"缓存加载异常：{str(e)}")
    else:
        log += print_log("缓存文件不存在")
    return log


def save_cache(sign_date=None):
    """保存缓存：只更新内存中的数据并写入文件"""
    log = ""
    # 确保缓存目录存在
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)

    # 更新内存中的缓存（始终更新cookie）
    global cache_data
    cache_data['cookie'] = '; '.join([f"{k}={v}" for k, v in SESSION.cookies.items()])
    if sign_date is not None:
        cache_data['sign_date'] = sign_date

    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        log += print_log("缓存保存成功")
    except Exception as e:
        log += print_log(f"缓存保存异常：{str(e)}")
    return log


def send_notification(title, content):
    """发送签到结果通知"""
    try:
        notify_res = QLAPI.systemNotify({"title": title, "content": content})
        if notify_res.get("code") == 200:
            print_log(f"通知发送成功（标题：{title}）")
        else:
            print_log(f"通知发送失败：{notify_res.get('message', '未知错误')}")
    except Exception as e:
        print_log(f"通知发送异常：{str(e)}")

def verify_cookie_validity():
    """验证Cookie有效性（含挂机）"""
    log = print_log("验证Cookie有效性")

    # 无Cookie直接判定无效
    if not cache_data['cookie']:
        log += print_log("缓存无Cookie")
        return False, log

    # 加载Cookie到会话
    cookie_items = {item.split('=')[0]: item.split('=')[1]
                    for item in cache_data['cookie'].split('; ') if '=' in item}
    SESSION.cookies.update(cookie_items)
    log += print_log("访问个人中心")

    try:
        # 发送请求验证
        response = SESSION.get(PROFILE_CHECK_URL,
                               headers={'User-Agent': USER_AGENT},
                               allow_redirects=False)
        if INVALID_COOKIE_MARKER in response.text:
            log += print_log("Cookie无效")
            return False, log
        log += print_log("Cookie有效")
        return True, log
    except Exception as e:
        log += print_log(f"Cookie验证异常：{str(e)}")
        return False, log


def check_today_sign_status():
    """检查今日是否已完成签到"""
    log = ""

    if cache_data['sign_date'] == TODAY_DATE:
        log += print_log("今日已签到")
        return True, log
    log += print_log("今日未签到")
    return False, log


def perform_login(username, password):
    """执行登录逻辑，获取有效Cookie"""
    log = print_log("执行登录流程")
    headers = {'User-Agent': USER_AGENT}

    # 初始化会话并获取登录页面参数
    SESSION.get('https://bbs.binmt.cc', headers=headers)
    login_page_url = 'https://bbs.binmt.cc/member.php?mod=logging&action=login&infloat=yes&handlekey=login&inajax=1&ajaxtarget=fwin_content_login'

    try:
        # 提取loginhash和formhash
        login_page_res = SESSION.get(login_page_url, headers=headers)
        loginhash = re.findall('loginhash=(.*?)">', login_page_res.text)[0]
        formhash = re.findall('formhash" value="(.*?)".*? />', login_page_res.text)[0]
        log += print_log("成功获取loginhash和formhash")
    except Exception as e:
        return False, "", log + print_log(f"登录参数获取失败：{str(e)}")

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
        # 提交登录请求
        login_res = SESSION.post(login_submit_url, headers=headers, data=login_data)
        if '欢迎您回来' in login_res.text:
            # 提取用户信息
            user_info = re.findall('欢迎您回来，(.*?)，现在', login_res.text)[0]
            log += print_log(f"{user_info}：登录成功")
            return True, log
        # 提取错误信息
        error_msg = re.findall("CDATA(.*?)<", login_res.text)[0] if re.findall("CDATA(.*?)<",
                                                                               login_res.text) else "未知错误"
        return False, "", log + print_log(f"登录失败：{error_msg}")
    except Exception as e:
        return False, "", log + print_log(f"登录请求异常：{str(e)}")


def perform_sign():
    """执行签到逻辑"""
    log = print_log("执行签到流程")
    headers = {'User-Agent': USER_AGENT}
    sign_page_url = 'https://bbs.binmt.cc/k_misign-sign.html'

    try:
        # 获取签到所需formhash
        sign_page_res = SESSION.get(sign_page_url, headers=headers)
        formhash = re.findall('formhash" value="(.*?)".*? />', sign_page_res.text)[0]
        log += print_log("成功获取签到formhash")
    except Exception as e:
        return False, log + print_log(f"签到formhash获取失败：{str(e)}")

    # 构造并发送签到请求
    sign_submit_url = f'https://bbs.binmt.cc/plugin.php?id=k_misign:sign&operation=qiandao&format=text&formhash={formhash}'
    try:
        sign_res = SESSION.get(sign_submit_url, headers=headers)
        # 提取签到状态
        sign_status = re.findall('<root><(.*?)</root>', sign_res.text)[0] if re.findall('<root><(.*?)</root>',
                                                                                        sign_res.text) else "未知"
        log += print_log(f"签到状态：{sign_status}")

        # 判断签到是否成功
        if '已签' in sign_res.text or '成功' in sign_status:
            # 获取签到排名和奖励
            detail_res = SESSION.get(sign_page_url, headers=headers)
            rank = re.findall('您的签到排名：(.*?)</div>', detail_res.text)[0] if re.findall('您的签到排名：(.*?)</div>',
                                                                                            detail_res.text) else "未知"
            reward = re.findall('id="lxreward" value="(.*?)">', detail_res.text)[0] if re.findall(
                'id="lxreward" value="(.*?)">', detail_res.text) else "0"
            log += print_log(f"签到成功（排名：{rank}，奖励：{reward}金币）")
            return True, log
        return False, log + print_log("签到失败")
    except Exception as e:
        return False, log + print_log(f"签到请求异常：{str(e)}")


def main():
    """主函数：按逻辑顺序执行签到流程"""
    # 打印开始时间
    start_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{start_time}] \n===[MT论坛] 挂机+签到===")

    # 初始化日志和缓存
    main_log = init_cache()

    # 1. 验证Cookie有效性（含挂机功能）
    cookie_valid, cookie_log = verify_cookie_validity()
    main_log += cookie_log

    # 2. 读取环境变量中的账号密码
    if OSAP not in os.environ:
        return send_notification(f"未找到环境变量{OSAP}",main_log)

    mt_account = os.environ.get(OSAP)
    if '&' not in mt_account:
        return send_notification("环境变量格式错误（需为「账号&密码」）",main_log)

    username, password = mt_account.split('&', 1)
    main_log += print_log("账号信息解析成功")

    # 3. Cookie无效则执行登录
    if not cookie_valid:
        main_log += print_log("Cookie无效，启动登录流程")
        login_success, login_log = perform_login(username, password)
        main_log += login_log

        if not login_success:
            return send_notification("登录失败",main_log)

        # 登录成功后保存Cookie
        save_log = save_cache()
        main_log += save_log
    else:
        main_log += print_log("跳过登录")

    # 4. 检查今日是否已签到
    has_signed, sign_check_log = check_today_sign_status()
    main_log += sign_check_log
    if has_signed:
        return main_log

    #10%的可能性进行签到，模拟随机签到。
    random_num = random.randint(0, 99)
    if random_num >= 10:
        main_log += print_log("跳过此次签到")
        return main_log

    # 5. 延迟1秒执行签到操作
    time.sleep(1)
    sign_success, sign_log = perform_sign()
    main_log += sign_log

    # 6. 处理签到结果
    if sign_success:
        save_log = save_cache(TODAY_DATE)
        main_log += save_log
        send_notification(f"[mt论坛]{username}签到成功", main_log)
    else:
        send_notification(f"[mt论坛]{username}签到失败",main_log)

    return main_log


if __name__ == '__main__':
    main()
