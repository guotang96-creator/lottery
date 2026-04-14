from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import os
import math

app = Flask(__name__)
CORS(app)

# =====================================================================
# 📊 【第一部分：V12 泛用型量化 AI 引擎】
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

# =====================================================================
# 🌐 【第二部分：全讀取 GitHub JSON API 路由】
# =====================================================================
@app.route('/')
def home():
    return "✅ V12 終極輕量版運行中 (全自動讀取 GitHub JSON)"

@app.route('/api/predict/<game>')
def get_prediction(game):
    # 🌟 所有彩種全部走 GitHub JSON 模式
    filename = {
        '539': 'latest.json',
        'daily': 'daily.json',
        'lotto': 'lotto.json',
        'weili': 'weili.json',
        'marksix': 'marksix.json'
    }.get(game)
    
    if not filename:
        return jsonify({"status": "error", "message": "未知彩種"})

    # 讀取您 GitHub 上的 JSON 檔案
    json_url = f"https://guotang96-creator.github.io/lottery/{filename}?t={int(time.time())}"
    
    try:
        res = requests.get(json_url, timeout=10)
        if res.status_code != 200:
            return jsonify({"status": "error", "message": f"等待 GitHub Actions 產生資料中... ({res.status_code})"})
        
        data = res.json()
        raw_history = data.get("history", [])
        if not raw_history: # 兼容 539 舊版格式
            raw_history = data.get("recent50") or data.get("data") or []
        
        history = []
        latest_period = "N/A"
        latest_numbers = []
        
        if raw_history:
            # 抓取最新期數與號碼
            latest_item = raw_history[0] if isinstance(raw_history[0], dict) else {}
            latest_period = str(latest_item.get("issue", latest_item.get("period", "N/A")))
            
            nums_source = latest_item.get("numbers", latest_item.get("drawNumberSize", []))
            latest_numbers = [str(n).zfill(2) for n in nums_source if str(n).isdigit()]
            
            # 整理歷史矩陣供 AI 運算
            for item in raw_history:
                if isinstance(item, dict):
                    n_src = item.get("numbers", item.get("drawNumberSize", []))
                    nums = [int(n) for n in n_src if str(n).isdigit()]
                    if len(nums) >= 5:
                        history.append(nums)
        
        if not history:
            return jsonify({"status": "error", "message": "歷史資料格式異常"})

        # 貝氏 AI 運算 (由舊到新傳入，所以要反轉 [::-1])
        max_num = 38 if game == 'weili' else (39 if game in ['539', 'daily'] else 49)
        scores = bayesian_engine(history[::-1], max_num)
        
        return jsonify({
            "status": "success",
            "game": game,
            "latest_period": latest_period,
            "latest_numbers": latest_numbers[:6] if game not in ['539', 'daily'] else latest_numbers[:5],
            "predicted": [s["num"] for s in scores[:10]],
            "details": scores[:10]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
