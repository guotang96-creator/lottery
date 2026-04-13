from flask import Flask, jsonify
from flask_cors import CORS
import requests
import threading
import datetime
import time
import os 
import math
import re

app = Flask(__name__)
CORS(app) 

# =====================================================================
# 📊 【第一部分：V11 泛用型量化 AI 引擎 (五合一版)】
# =====================================================================
def bayesian_engine(data_list, max_num):
    """
    泛用型貝氏動態矩陣：自動適應球數 (支援 38, 39, 49)
    """
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

# 抓取 GitHub JSON 專用函數 (539 & 天天樂)
def fetch_github_json(url):
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        recent = data.get("history") or data.get("recent50") or data.get("data") or []
        history = []
        for item in recent:
            if isinstance(item, dict):
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) >= 5:
                    history.append([int(n) for n in nums if str(n).isdigit()])
        return history[::-1] # 反轉為由舊到新
    except:
        return []

# =====================================================================
# 🕷️ 【第二部分：全自動定時爬蟲體系 (大樂透/威力彩/六合彩)】
# =====================================================================
GLOBAL_DATA = {
    "lotto": {"history": [], "latest_period": "", "last_update": ""},    
    "weili": {"history": [], "latest_period": "", "last_update": ""},    
    "marksix": {"history": [], "latest_period": "", "last_update": ""}   
}

def scraper_logic(url, pattern_period, pattern_ball, ball_count):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.encoding = 'utf-8'
        content = re.sub(r'<[^>]+>', ' ', res.text) 
        
        periods = re.findall(pattern_period, content)
        if not periods: return None
        latest_period = sorted(list(set(periods)), reverse=True)[0]
        
        idx = content.find(latest_period)
        block = content[idx:idx+500]
        balls = re.findall(pattern_ball, block)
        
        unique_balls = []
        for b in balls:
            val = int(b)
            if val not in unique_balls: unique_balls.append(val)
            if len(unique_balls) == ball_count: break
            
        if len(unique_balls) >= 6:
            return {"period": latest_period, "numbers": sorted(unique_balls)}
    except:
        return None

def auto_update_job():
    print("🚀 [系統] 自動爬蟲引擎啟動，全網掃描中...")
    while True:
        res = scraper_logic("https://www.pilio.idv.tw/lotto/lotto649/list.asp", r'(\d{9})', r'\b(0[1-9]|[1-4][0-9])\b', 7)
        if res and res["period"] != GLOBAL_DATA["lotto"]["latest_period"]:
            GLOBAL_DATA["lotto"]["history"].append(res["numbers"])
            GLOBAL_DATA["lotto"]["latest_period"] = res["period"]
            GLOBAL_DATA["lotto"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        res = scraper_logic("https://www.pilio.idv.tw/lotto/superlotto/list.asp", r'(\d{9})', r'\b(0[1-9]|[1-3][0-9])\b', 7)
        if res and res["period"] != GLOBAL_DATA["weili"]["latest_period"]:
            GLOBAL_DATA["weili"]["history"].append(res["numbers"])
            GLOBAL_DATA["weili"]["latest_period"] = res["period"]
            GLOBAL_DATA["weili"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        res = scraper_logic("https://www.pilio.idv.tw/lotto/hk6/list.asp", r'(\d{5})', r'\b(0[1-9]|[1-4][0-9])\b', 7)
        if res and res["period"] != GLOBAL_DATA["marksix"]["latest_period"]:
            GLOBAL_DATA["marksix"]["history"].append(res["numbers"])
            GLOBAL_DATA["marksix"]["latest_period"] = res["period"]
            GLOBAL_DATA["marksix"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        time.sleep(1800) # 每半小時檢查一次

# =====================================================================
# 🌐 【第三部分：五合一 API 路由】
# =====================================================================
@app.route('/')
def home():
    return "✅ V11 五合一泛用型引擎運行中 (含 539, 天天樂, 大樂透, 威力彩, 六合彩)"

@app.route('/api/predict/<game>')
def get_prediction(game):
    # 🌟 處理 539 與 天天樂 (從 GitHub 抓取)
    if game in ['539', 'daily']:
        json_url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}" if game == '539' else f"https://guotang96-creator.github.io/lottery/daily.json?t={int(time.time())}"
        history = fetch_github_json(json_url)
        if not history: return jsonify({"status": "error", "message": "讀取 GitHub JSON 失敗"})
        
        scores = bayesian_engine(history, 39)
        return jsonify({
            "status": "success", "game": game,
            "latest_period": "與 JSON 同步", "last_update": "即時",
            "predicted": [s["num"] for s in scores[:10]], "details": scores[:10]
        })

    # 🌟 處理大樂透、威力彩、六合彩 (從爬蟲緩存抓取)
    if game == 'lotto':
        data = GLOBAL_DATA["lotto"]
        max_n = 49
    elif game == 'weili':
        data = GLOBAL_DATA["weili"]
        max_n = 38
    elif game == 'marksix':
        data = GLOBAL_DATA["marksix"]
        max_n = 49
    else:
        return jsonify({"status": "error", "message": "未知彩種"})

    scores = bayesian_engine(data["history"], max_n)
    
    return jsonify({
        "status": "success", "game": game,
        "latest_period": data["latest_period"], "last_update": data["last_update"],
        "predicted": [s["num"] for s in scores[:10]], "details": scores[:10]
    })

threading.Thread(target=auto_update_job, daemon=True).start()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
