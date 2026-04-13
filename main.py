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
# 📊 【第一部分：V11 泛用型量化 AI 引擎】
# =====================================================================
def bayesian_engine(data_list, max_num):
    total_draws = len(data_list)
    # 🔥 保護機制：如果資料不夠，不回傳智障號碼，直接回傳錯誤讓前端等待
    if total_draws < 3:
        return None

    ema_scores = {i: 0.0 for i in range(1, max_num + 1)}
    alpha = 0.15
    for idx, draw in enumerate(data_list):
        weight = math.exp(alpha * (idx - total_draws)) * 100
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= max_num: ema_scores[int(n)] += weight

    markov_scores = {i: 0.0 for i in range(1, max_num + 1)}
    last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    for i in range(total_draws - 1):
        current = [int(n) for n in data_list[i] if str(n).isdigit()]
        nxt = [int(n) for n in data_list[i+1] if str(n).isdigit()]
        if set(last_draw).intersection(set(current)):
            for n in nxt:
                if 1 <= n <= max_num: markov_scores[n] += 5.0

    reversion_scores = {i: 0.0 for i in range(1, max_num + 1)}
    gaps = {i: total_draws for i in range(1, max_num + 1)}
    for idx, draw in enumerate(reversed(data_list)):
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= max_num and gaps[int(n)] == total_draws:
                gaps[int(n)] = idx
    for i in range(1, max_num + 1):
        reversion_scores[i] = math.pow(gaps[i], 1.2) * 2.0

    final_scores = []
    for i in range(1, max_num + 1):
        s = ema_scores[i] + markov_scores[i] + reversion_scores[i]
        final_scores.append({"num": str(i).zfill(2), "score": round(s, 2)})

    return sorted(final_scores, key=lambda x: x['score'], reverse=True)

# =====================================================================
# 🕷️ 【第二部分：低頻彩種自動爬蟲 (大樂透/威力彩/六合彩)】
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
        
        # 為了提升精準度，一次抓回最近 30 期當底火
        draws = []
        for p in sorted(list(set(periods)), reverse=True)[:30]:
            idx = content.find(p)
            block = content[idx:idx+300]
            balls = re.findall(pattern_ball, block)
            unique_balls = []
            for b in balls:
                if int(b) not in unique_balls: unique_balls.append(int(b))
                if len(unique_balls) == ball_count: break
            if len(unique_balls) >= 6:
                draws.append({"period": p, "numbers": sorted(unique_balls)})
                
        if draws:
            return {"latest_period": latest_period, "history": [d["numbers"] for d in reversed(draws)]}
    except:
        return None

def auto_update_job():
    print("🚀 [系統] 自動爬蟲引擎啟動，全網掃描中...")
    while True:
        # 大樂透
        res1 = scraper_logic("https://www.pilio.idv.tw/lotto/lotto649/list.asp", r'(\d{9})', r'\b(0[1-9]|[1-4][0-9])\b', 7)
        if res1 and res1["latest_period"] != GLOBAL_DATA["lotto"]["latest_period"]:
            GLOBAL_DATA["lotto"]["history"] = res1["history"]
            GLOBAL_DATA["lotto"]["latest_period"] = res1["latest_period"]
            GLOBAL_DATA["lotto"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        # 威力彩
        res2 = scraper_logic("https://www.pilio.idv.tw/lotto/superlotto/list.asp", r'(\d{9})', r'\b(0[1-9]|[1-3][0-9])\b', 7)
        if res2 and res2["latest_period"] != GLOBAL_DATA["weili"]["latest_period"]:
            GLOBAL_DATA["weili"]["history"] = res2["history"]
            GLOBAL_DATA["weili"]["latest_period"] = res2["latest_period"]
            GLOBAL_DATA["weili"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        # 六合彩
        res3 = scraper_logic("https://www.pilio.idv.tw/lotto/hk6/list.asp", r'(\d{5})', r'\b(0[1-9]|[1-4][0-9])\b', 7)
        if res3 and res3["latest_period"] != GLOBAL_DATA["marksix"]["latest_period"]:
            GLOBAL_DATA["marksix"]["history"] = res3["history"]
            GLOBAL_DATA["marksix"]["latest_period"] = res3["latest_period"]
            GLOBAL_DATA["marksix"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        time.sleep(1800) # 半小時檢查一次

# =====================================================================
# 🌐 【第三部分：五合一 API 路由】
# =====================================================================
@app.route('/')
def home():
    return "✅ 大滿貫 V11 引擎運行中 (539/天天樂/大樂透/威力彩/六合彩)"

@app.route('/api/predict/<game>')
def get_prediction(game):
    # 🌟 處理 539 與 天天樂 (讀取您的 GitHub JSON)
    if game in ['539', 'daily']:
        try:
            url_file = "latest.json" if game == '539' else "daily.json"
            url = f"https://guotang96-creator.github.io/lottery/{url_file}?t={int(time.time())}"
            res = requests.get(url, timeout=10)
            data_json = res.json()
            recent_data = data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
            
            history = []
            for item in recent_data:
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) >= 5: history.append(nums[:5])
            
            scores = bayesian_engine(history[::-1], 39)
            if not scores: return jsonify({"status": "waiting", "message
