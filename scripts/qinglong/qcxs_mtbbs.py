import requests
import re
import os
import json
import random
import time
import math
from datetime import datetime

# ===================== 全局配置 =====================
USER_AGENT = (
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
)

CHECK_PROFILE_URL = "https://bbs.binmt.cc/home.php?mod=space&do=profile"
SIGN_PAGE_URL = "https://bbs.binmt.cc/k_misign-sign.html"
SIGN_API_URL = "https://bbs.binmt.cc/plugin.php?id=k_misign:sign&operation=qiandao"
LOGIN_PAGE_URL = "https://bbs.binmt.cc/member.php?mod=logging&action=login&mobile=2"

INVALID_KEYWORDS = [ "登录后更精彩", "请先登录"]
CACHE_DIR = "cache"

# ===================== 全局日志变量 =====================
log = ""

# ===================== 统一日志函数 =====================
def printlog(msg):
    global log
    print(msg)
    log += msg + "\n"

# ===================== 工具函数 =====================
def parse_time_range(env_val):
    if not env_val:
        return []
    ranges = []
    for part in env_val.split(","):
        part = part.strip()
        if "-" not in part:
            continue
        try:
            s, e = map(int, part.split("-", 1))
            ranges.append((s, e))
        except:
            continue
    return ranges

def is_in_time(ranges):
    h = datetime.now().hour
    return any(s <= h <= e for s, e in ranges)

def get_sign_probability(sign_ranges):
    if not sign_ranges:
        return 0.0

    h = datetime.now().hour
    current_range = None
    for s, e in sign_ranges:
        if s <= h <= e:
            current_range = (s, e)
            break
    if not current_range:
        return 0.0

    s_h, e_h = current_range
    total_hours = e_h - s_h
    if total_hours <= 0:
        return 100.0

    passed = h - s_h
    x = passed / total_hours

    # 标准指数上升：前期慢 → 后期暴增
    prob = 100.0 * (math.exp(3 * x) - 1) / (math.exp(3) - 1)

    if h == e_h:
        prob = 100.0

    return round(prob, 2)

def send_one_notify(username):
    global log
    # 从日志里提取关键状态
    status = []
    if "Cookie已过期" in log:
        status.append("Cookie无效")
    if "异常" in log:
        status.append("!异常!")
    if "签到成功" in log:
        status.append("签到成功")
    elif "签到失败" in log:
        status.append("签到失败")

    if "新消息：" in log:
        import re
        match = re.search(r"新消息：(\d+) 条", log)
        if match:
            status.append(f"有{match.group(1)}条消息")

    # 没有重要消息，不发送
    if not status:
        print("没有重要消息，不发送通知。")
        return

    # 标题：账号 + 核心结果
    title = f"[MT论坛] {username} | {' '.join(status)}"

    try:
        notify_res = QLAPI.systemNotify({"title": title, "content": log.strip()})
        if notify_res.get("code") == 200:
            print("✅ 通知发送成功")
    except:
        print("\n===== 通知标题 =====")
        print(title)
        print("===== 完整日志 =====")
        print(log.strip())


# ===================== 缓存操作 =====================
def init_cache(username):
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_file = os.path.join(CACHE_DIR, f"{username}.json")
    default = {"cookie": "", "sign_date": ""}
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data, cache_file
        except:
            return default, cache_file
    else:
        return default, cache_file

def save_cache(cache_file, cookie=None, sign_date=None):
    data = {}
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except:
            data = {}
    if cookie is not None:
        data["cookie"] = cookie
    if sign_date is not None:
        data["sign_date"] = sign_date
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ===================== Cookie 加载 =====================
def load_cookie_into_session(session, cookie_str):
    if not cookie_str:
        return
    try:
        for item in cookie_str.split("; "):
            if "=" not in item:
                continue
            k, v = item.split("=", 1)
            session.cookies.set(k.strip(), v.strip(), domain="bbs.binmt.cc", path="/")
    except:
        pass

# ===================== 登录 =====================
def login(session, username, password):
    printlog(f"🔐 正在登录：{username}")
    try:
        resp = session.get(LOGIN_PAGE_URL, headers={"User-Agent": USER_AGENT}, timeout=10)
        lh_match = re.search(r'loginhash=([A-Za-z0-9]+)">', resp.text)
        if not lh_match:
            printlog("❌ 未获取到 loginhash")
            return False
        loginhash = lh_match.group(1)

        fh_match = re.search(r'id="formhash" value=\'([a-f0-9]{8})\'', resp.text)
        if not fh_match:
            printlog("❌ 未获取到 formhash")
            return False
        formhash = fh_match.group(1)

        login_submit_url = (
            f"https://bbs.binmt.cc/member.php?mod=logging&action=login"
            f"&loginsubmit=yes&loginhash={loginhash}&mobile=2"
        )

        data = {
            "formhash": formhash,
            "referer": "https://bbs.binmt.cc/forum.php?mobile=2",
            "loginfield": "username",
            "username": username,
            "password": password,
            "questionid": "0",
            "answer": "",
        }

        resp = session.post(login_submit_url, data=data, headers={"User-Agent": USER_AGENT}, timeout=10)
        if "欢迎" in resp.text:
            printlog("✅ 登录成功")
            return True
        else:
            printlog("❌ 登录失败：账号或密码错误")
            return False
    except Exception as e:
        printlog(f"❌ 登录异常：{str(e)}")
        return False

# ===================== 签到 =====================
def do_sign(session):
    printlog("📝 开始签到")
    try:
        resp = session.get(SIGN_PAGE_URL, headers={"User-Agent": USER_AGENT}, timeout=10)
        formhash = re.search(r'formhash=([a-f0-9]{8})', resp.text) or re.search(r'name="formhash" value="([a-f0-9]{8})"', resp.text)
        if not formhash:
            return False, "未获取 formhash"

        sign_url = f"{SIGN_API_URL}&formhash={formhash.group(1)}&format=empty&inajax=1"
        resp = session.post(sign_url, headers={
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest"
        }, timeout=10)

        txt = resp.text
        if "今日已签" in txt or "重复签到" in txt:
            # 该账号已在别处签到，直接判定为签到成功
            return True, "签到成功"
        elif "成功" in txt or "获得" in txt:
            return True, "签到成功"
        else:
            return False, f"签到返回：{txt[:80]}"
    except Exception as e:
        return False, f"签到发生异常：{str(e)}"

# ===================== 检查Cookie + 消息 =====================
def check_cookie_and_message(session):
    try:
        resp = session.get(
            CHECK_PROFILE_URL,
            headers={"User-Agent": USER_AGENT},
            allow_redirects=True,
            timeout=10
        )
        if resp.status_code in (301, 302):
            return False, 0
        for kw in INVALID_KEYWORDS:
            if kw in resp.text:
                return False, 0
        match = re.search(r'<span class="sidenv_num bg_del f_f">(\d+)</span>', resp.text)
        msg_count = int(match.group(1)) if match else 0
        return True, msg_count
    except Exception as e:
        # 出现异常不认为Cookie过期
        printlog(f"❌ 检查失败：{str(e)}")
        return True, 0

# ===================== 单账号流程 =====================
def process_one_account(account, msg_ranges, sign_ranges):
    global log
    log = ""  # 每个账号清空日志

    username = account.get("username", "").strip()
    password = account.get("password", "").strip()

    printlog("========================================")
    printlog(f"账号：{username}")
    printlog("========================================")

    # 1. 检查账号密码
    if not username or not password:
        printlog("❌ 账号密码不完整")
        # 消息时间判断
        if is_in_time(msg_ranges):
            send_one_notify(username)
        return

    # 缓存
    cache_data, cache_file = init_cache(username)
    cached_cookie = cache_data.get("cookie", "").strip()
    last_sign_date = cache_data.get("sign_date", "")
    today = datetime.now().strftime("%Y-%m-%d")

    session = requests.Session()

    # 2. 有Cookie直接用，无则登录
    if cached_cookie:
        printlog("🔍 使用缓存Cookie")
        load_cookie_into_session(session, cached_cookie)
    else:
        printlog("🔍 无Cookie，执行登录")
        login_ok = login(session, username, password)
        if not login_ok:
            if is_in_time(msg_ranges):
                send_one_notify(username)
            return
        new_cookie = "; ".join([f"{k}={v}" for k, v in session.cookies.items()])
        save_cache(cache_file, cookie=new_cookie)

    # 3. 签到逻辑
    if last_sign_date == today:
        printlog("✅ 今日已签到，跳过签到流程")
    else:
        prob = get_sign_probability(sign_ranges)
        printlog(f"🎲 当前签到概率：{prob}%")
        if prob > 0 and random.uniform(0, 100) <= prob:
            sign_ok, sign_msg = do_sign(session)
            if sign_ok:
                printlog(f"✅ {sign_msg}")
                save_cache(cache_file, sign_date=today)
            else:
                printlog(f"❌ {sign_msg}")
        else:
            printlog("🎲 本次未触发签到")

    # 4. 最后检查Cookie + 消息
    printlog("\n🔍 检查Cookie与消息")
    cookie_valid, msg_count = check_cookie_and_message(session)
    if not cookie_valid:
        printlog("❌ Cookie已过期，已清空")
        save_cache(cache_file, cookie="")
    else:
        if msg_count > 0:
            printlog(f"📩 新消息：{msg_count} 条")
        else:
            printlog("📩 无新消息")

    # ===================== 修复：消息时间段控制 =====================
    if is_in_time(msg_ranges):
        send_one_notify(username)
    else:
        printlog("⏳ 当前不在消息提醒时间段内，不发送通知")


# ===================== 主入口 =====================
if __name__ == "__main__":
    print("=" * 60)
    print("     MT论坛 多账号自动助手（最终版）")
    print("=" * 60)

    accounts_json_str = os.getenv("mtbbs_accounts", "").strip()
    message_time_str = os.getenv("mtbbs_message_time", "").strip()
    sign_time_str = os.getenv("mtbbs_sign_time", "").strip()

    msg_ranges = parse_time_range(message_time_str)
    sign_ranges = parse_time_range(sign_time_str)

    if not accounts_json_str:
        print("❌ 请配置环境变量 mtbbs_accounts")
        exit(1)

    try:
        accounts = json.loads(accounts_json_str)
    except:
        print("❌ mtbbs_accounts 不是合法JSON")
        exit(1)

    total = len(accounts)
    print(f"✅ 共加载 {total} 个账号")

    for i, acc in enumerate(accounts):
        process_one_account(acc, msg_ranges, sign_ranges)
        if i != total - 1:
            print("\n⏳ 等待2秒")
            time.sleep(2)

    print("\n🎉 全部执行完成")
