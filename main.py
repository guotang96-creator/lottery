from flask import Flask, jsonify
from flask_cors import CORS
import requests
import threading
import datetime
import time
import os 
import math
import re
import json

app = Flask(__name__)
CORS(app) 

# =====================================================================
# 📊 【第一部分：V11 泛用型量化 AI 引擎】
# =====================================================================
def bayesian_engine(data_list, max_num):
    total_draws = len(data_list)
    if total_draws < 3:
        return [{"num": str(i).zfill(2), "score": 1.0} for i in range(1, max_num + 1)]

    ema_scores = {i: 0.0 for i in range(1, max_num + 1)}
    alpha = 0.15
    for idx, draw in enumerate(data_list):
        weight = math.exp(alpha * (idx - total_draws)) * 100
        for n in draw:
            if 1 <= n <= max_num: ema_scores[n] += weight

    markov_scores = {i: 0.0 for i in range(1, max_num + 1)}
    last_draw = set(data_list[-1])
    for i in range(total_draws - 1):
        if last_draw.intersection(set(data_list[i])):
            for n in data_list[i+1]:
                if 1 <= n <= max_num: markov_scores[n] += 5.0

    reversion_scores = {i: 0.0 for i in range(1, max_num + 1)}
    gaps = {i: total_draws for i in range(1, max_num + 1)}
    for idx, draw in enumerate(reversed(data_list)):
        for n in draw:
            if 1 <= n <= max_num and gaps[n] == total_draws:
                gaps[n] = idx
    for i in range(1, max_num + 1):
        reversion_scores[i] = math.pow(gaps[i], 1.2) * 2.0

    final_scores = []
    for i in range(1, max_num + 1):
        s = ema_scores[i] + markov_scores[i] + reversion_scores[i]
        final_scores.append({"num": str(i).zfill(2), "score": round(s, 2)})

    return sorted(final_scores, key=lambda x: x['score'], reverse=True)

def fetch_github_json(url):
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        recent = data.get("history") or data.get("recent50") or data.get("data") or []
        history = []
        latest_period = ""
        for item in recent:
            if isinstance(item, dict):
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) >= 5:
                    history.append([int(n) for n in nums if str(n).isdigit()])
        if recent and isinstance(recent[0], dict):
            latest_period = str(recent[0].get("period", recent[0].get("issue", "")))
        return history[::-1], latest_period
    except:
        return [], ""

# =====================================================================
# 🕷️ 【第二部分：穿甲彈雷達 (專攻官方 JSON 與無防護老站)】
# =====================================================================
GLOBAL_DATA = {
    "lotto": {"history": [[4,10,15,22,30,41], [1,8,12,25,33,40], [7,14,19,28,35,45]], "latest_period": "穿甲雷達連線中", "last_update": "剛啟動"},    
    "weili": {"history": [[6,7,12,15,23,31], [3,11,13,17,24,30], [2,10,18,22,28,35]], "latest_period": "穿甲雷達連線中", "last_update": "剛啟動"},    
    "marksix": {"history": [[5,12,18,24,33,41], [2,9,15,22,30,45], [1,11,17,25,38,48]], "latest_period": "穿甲雷達連線中", "last_update": "剛啟動"}   
}

# 🔥 直接攔截台彩官方 JSON 封包！
def fetch_official_json(game_code):
    url = f"https://api.taiwanlottery.com/TLCAPIWeB/Lottery/{game_code}Result?limit=15"
    # 使用 GET 取回 JSON字串，徹底繞過 HTML Cloudflare
    proxy = f"https://api.allorigins.win/get?url={url}" 
    try:
        res = requests.get(proxy, headers={"User-Agent": "Mozilla/5.0"}, timeout=15).json()
        if "contents" in res:
            content = json.loads(res["contents"])
        else:
            return None, []
        
        # 動態抓取台彩的 key (無視台彩欄位名稱變更)
        for key, val in content.get('content', {}).items():
            if isinstance(val, list) and len(val) > 0 and 'period' in val[0]:
                history = []
                latest_period = ""
                # 排序：由舊到新
                val.sort(key=lambda x: int(x.get('period', 0)))
                for item in val:
                    nums = item.get('drawNumberSize', [])
                    if len(nums) >= 6:
                        history.append([int(n) for n in nums[:6]])
                        latest_period = str(item.get('period', ''))
                if history:
                    return latest_period, history[-10:]
    except Exception as e:
        print(f"[{game_code}] 官方直連失敗: {e}")
    return None, []

# 🔥 專攻無防護老站：樂透研究院
def fetch_marksix_old_school():
    url = "https://www.lotto-8.com/listltomk.asp"
    proxy = f"https://api.allorigins.win/get?url={url}"
    try:
        res = requests.get(proxy, headers={"User-Agent": "Mozilla/5.0"}, timeout=15).json()
        text = res.get("contents", "")
        
        # 六合彩期數特徵：2024xxx (7碼)
        periods = re.findall(r'(?<!\d)(2\d{6})(?!\d)', text)
        if not periods: return None, []
        latest = sorted(list(set(periods)), reverse=True)[0]
        
        idx = text.find(latest)
        block = text[idx:idx+300]
        # 嚴格抓取 01~49 數字
        balls = re.findall(r'(?<!\d)(0[1-9]|[1-4][0-9])(?!\d)', block)
        unique = []
        for b in balls:
            if int(b) not in unique: unique.append(int(b))
            if len(unique) >= 6: break
            
        if len(unique) >= 6:
            return latest, [unique[:6]]
    except Exception as e:
        print(f"[MarkSix] 老站直連失敗: {e}")
    return None, []

def auto_update_job():
    time.sleep(8) # 延遲點火保護 Render
    print("🚀 [系統] 穿甲彈雷達啟動，鎖定目標資料庫...")
    while True:
        try:
            # 1. 大樂透 (官方直連)
            l_period, l_history = fetch_official_json("Lotto649")
            if l_period and l_period != GLOBAL_DATA["lotto"]["latest_period"]:
                GLOBAL_DATA["lotto"]["history"].extend(l_history)
                GLOBAL_DATA["lotto"]["latest_period"] = l_period
                GLOBAL_DATA["lotto"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                print(f"✅ 大樂透突破成功: {l_period}")

            # 2. 威力彩 (官方直連)
            w_period, w_history = fetch_official_json("SuperLotto638")
            if w_period and w_period != GLOBAL_DATA["weili"]["latest_period"]:
                GLOBAL_DATA["weili"]["history"].extend(w_history)
                GLOBAL_DATA["weili"]["latest_period"] = w_period
                GLOBAL_DATA["weili"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                print(f"✅ 威力彩突破成功: {w_period}")

            # 3. 六合彩 (無防護老站)
            m_period, m_history = fetch_marksix_old_school()
            if m_period and m_period != GLOBAL_DATA["marksix"]["latest_period"]:
                GLOBAL_DATA["marksix"]["history"].extend(m_history)
                GLOBAL_DATA["marksix"]["latest_period"] = m_period
                GLOBAL_DATA["marksix"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                print(f"✅ 六合彩突破成功: {m_period}")
                
            # 清理過長陣列
            for k in GLOBAL_DATA:
                if len(GLOBAL_DATA[k]["history"]) > 30:
                    GLOBAL_DATA[k]["history"] = GLOBAL_DATA[k]["history"][-30:]
        except:
            pass
        
        time.sleep(600) # 每 10 分鐘同步一次

# =====================================================================
# 🌐 【第三部分：五合一 API 路由】
# =====================================================================
@app.route('/')
def home():
    return "✅ V11 穿甲彈版運行中 (台彩 JSON 直連 + 老站破解)"

@app.route('/api/predict/<game>')
def get_prediction(game):
    if game in ['539', 'daily']:
        json_url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}" if game == '539' else f"https://guotang96-creator.github.io/lottery/daily.json?t={int(time.time())}"
        history, latest_period = fetch_github_json(json_url)
        if not history: return jsonify({"status": "error", "message": "讀取 GitHub JSON 失敗"})
        
        scores = bayesian_engine(history, 39)
        latest_nums = [str(n).zfill(2) for n in history[-1]]
        
        return jsonify({
            "status": "success", "game": game,
            "latest_period": latest_period or "最新", "last_update": "即時",
            "latest_numbers": latest_nums,
            "predicted": [s["num"] for s in scores[:10]], "details": scores[:10]
        })

    if game in ['lotto', 'weili', 'marksix']:
        data = GLOBAL_DATA[game]
        max_n = 38 if game == 'weili' else 49
        scores = bayesian_engine(data["history"], max_n)
        latest_nums = [str(n).zfill(2) for n in data["history"][-1]] if data["history"] else []
        
        return jsonify({
            "status": "success", "game": game,
            "latest_period": data["latest_period"], "last_update": data["last_update"],
            "latest_numbers": latest_nums,
            "predicted": [s["num"] for s in scores[:10]], "details": scores[:10]
        })

    return jsonify({"status": "error", "message": "未知彩種"})

if __name__ == '__main__':
    threading.Thread(target=auto_update_job, daemon=True).start()
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
