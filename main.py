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
# 🕷️ 【第二部分：海外破壁雷達 (專攻民間大站 Auzonet / TWBB)】
# =====================================================================
GLOBAL_DATA = {
    "lotto": {"history": [[4,10,15,22,30,41], [1,8,12,25,33,40], [7,14,19,28,35,45]], "latest_period": "歷史底火運作中", "last_update": "系統剛啟動"},    
    "weili": {"history": [[6,7,12,15,23,31], [3,11,13,17,24,30], [2,10,18,22,28,35]], "latest_period": "歷史底火運作中", "last_update": "系統剛啟動"},    
    "marksix": {"history": [[5,12,18,24,33,41], [2,9,15,22,30,45], [1,11,17,25,38,48]], "latest_period": "歷史底火運作中", "last_update": "系統剛啟動"}   
}

# 🔥 新技術：專門針對民間大站的文本挖掘器
def scraper_tw_games(game_code):
    targets = [
        f"https://lotto.auzonet.com/{game_code}/list_10.html",
        f"https://www.twbb.tw/{game_code}/"
    ]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    for t in targets:
        # 使用直連與跳板雙重保險
        routes = [t, f"https://api.allorigins.win/raw?url={t}", f"https://api.codetabs.com/v1/proxy?quest={t}"]
        for route in routes:
            try:
                res = requests.get(route, headers=headers, timeout=12)
                res.encoding = 'utf-8'
                content = re.sub(r'<[^>]+>', ' ', res.text)
                
                # 尋找 113 開頭的 9 位數期數
                periods = re.findall(r'(11[3-9]\d{6})', content)
                if not periods: continue
                
                latest_period = sorted(list(set(periods)), reverse=True)[0]
                idx = content.find(latest_period)
                block = content[idx:idx+800]
                balls = re.findall(r'\b(0[1-9]|[1-4][0-9])\b', block)
                
                unique_balls = []
                for b in balls:
                    val = int(b)
                    if val not in unique_balls: unique_balls.append(val)
                    if len(unique_balls) == 7: break # 抓滿7顆球(含特別號)就停
                    
                if len(unique_balls) >= 6:
                    return {"period": latest_period, "numbers": sorted(unique_balls[:6])}
            except:
                continue
    return None

def scraper_marksix():
    targets = ["https://lotto.auzonet.com/marksix/list_10.html", "https://www.twbb.tw/marksix/"]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    for t in targets:
        routes = [t, f"https://api.allorigins.win/raw?url={t}"]
        for route in routes:
            try:
                res = requests.get(route, headers=headers, timeout=10)
                res.encoding = 'utf-8'
                content = re.sub(r'<[^>]+>', ' ', res.text)
                periods = re.findall(r'(\d{5,7})', content)
                if not periods: continue
                
                periods = [p for p in periods if len(p) >= 5]
                latest_period = sorted(list(set(periods)), reverse=True)[0]
                
                idx = content.find(latest_period)
                block = content[idx:idx+800]
                balls = re.findall(r'\b(0[1-9]|[1-4][0-9])\b', block)
                unique_balls = []
                for b in balls:
                    val = int(b)
                    if val not in unique_balls: unique_balls.append(val)
                    if len(unique_balls) == 7: break 
                    
                if len(unique_balls) >= 6:
                    return {"period": latest_period, "numbers": sorted(unique_balls[:6])}
            except:
                continue
    return None

def auto_update_job():
    time.sleep(5) # 延遲點火保護機制
    print("🚀 [系統] 啟動海外破壁雷達 (專攻民間未封鎖大站)...")
    while True:
        try:
            # 1. 大樂透
            lotto_data = scraper_tw_games("lotto649")
            if lotto_data and lotto_data["period"] != GLOBAL_DATA["lotto"]["latest_period"]:
                GLOBAL_DATA["lotto"]["history"].append(lotto_data["numbers"])
                GLOBAL_DATA["lotto"]["latest_period"] = lotto_data["period"]
                GLOBAL_DATA["lotto"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

            # 2. 威力彩
            weili_data = scraper_tw_games("superlotto638")
            if weili_data and weili_data["period"] != GLOBAL_DATA["weili"]["latest_period"]:
                GLOBAL_DATA["weili"]["history"].append(weili_data["numbers"])
                GLOBAL_DATA["weili"]["latest_period"] = weili_data["period"]
                GLOBAL_DATA["weili"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

            # 3. 六合彩
            hk_data = scraper_marksix()
            if hk_data and hk_data["period"] != GLOBAL_DATA["marksix"]["latest_period"]:
                GLOBAL_DATA["marksix"]["history"].append(hk_data["numbers"])
                GLOBAL_DATA["marksix"]["latest_period"] = hk_data["period"]
                GLOBAL_DATA["marksix"]["last_update"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        except Exception as e:
            pass
        
        time.sleep(600) # 每 10 分鐘同步一次

# =====================================================================
# 🌐 【第三部分：五合一 API 路由】
# =====================================================================
@app.route('/')
def home():
    return "✅ V11 海外破壁版運行中 (繞過台彩 IP 封鎖)"

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
