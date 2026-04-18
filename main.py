from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import os
import math

app = Flask(__name__)
CORS(app)

def bayesian_engine(data_list, max_num):
    total_draws = len(data_list)
    if total_draws < 3:
        return [{"num": str(i).zfill(2), "score": 1.0} for i in range(1, max_num + 1)]

    ema_scores = {i: 0.0 for i in range(1, max_num + 1)}
    alpha = 0.1 
    for idx, draw in enumerate(data_list):
        weight = math.exp(alpha * (idx - total_draws)) * 30 
        for n in draw:
            if 1 <= n <= max_num: ema_scores[n] += weight

    markov_scores = {i: 0.0 for i in range(1, max_num + 1)}
    last_draw = set(data_list[-1])
    for i in range(total_draws - 1):
        if last_draw.intersection(set(data_list[i])):
            for n in data_list[i+1]:
                if 1 <= n <= max_num: markov_scores[n] += 12.0 

    reversion_scores = {i: 0.0 for i in range(1, max_num + 1)}
    gaps = {i: total_draws for i in range(1, max_num + 1)}
    for idx, draw in enumerate(reversed(data_list)):
        for n in draw:
            if 1 <= n <= max_num and gaps[n] == total_draws:
                gaps[n] = idx
    
    for i in range(1, max_num + 1):
        if gaps[i] == 0:
            reversion_scores[i] = -15.0 
        else:
            reversion_scores[i] = math.pow(gaps[i], 1.2) * 5.0 

    final_scores = []
    for i in range(1, max_num + 1):
        s = ema_scores[i] + markov_scores[i] + reversion_scores[i]
        final_scores.append({"num": str(i).zfill(2), "score": round(s, 2)})

    return sorted(final_scores, key=lambda x: x['score'], reverse=True)

@app.route('/')
def home():
    return "✅ V13 終極輕量版運行中 (已啟動全自動對獎引擎)"

@app.route('/api/predict/<game>')
def get_prediction(game):
    filename = {
        '539': 'latest.json', 'daily': 'daily.json', 'lotto': 'lotto.json',
        'weili': 'weili.json', 'marksix': 'marksix.json'
    }.get(game)
    
    if not filename: return jsonify({"status": "error", "message": "未知彩種"})

    json_url = f"https://guotang96-creator.github.io/lottery/{filename}?t={int(time.time())}"
    
    try:
        res = requests.get(json_url, timeout=10)
        data = res.json()
        raw_history = data.get("history", []) or data.get("recent50") or data.get("data") or []
        
        history = []
        latest_period = "N/A"
        latest_numbers = []
        
        if raw_history:
            latest_item = raw_history[0] if isinstance(raw_history[0], dict) else {}
            latest_period = str(latest_item.get("issue", latest_item.get("period", "N/A")))
            nums_source = latest_item.get("numbers", latest_item.get("drawNumberSize", []))
            latest_numbers = [str(n).zfill(2) for n in nums_source if str(n).isdigit()]
            
            for item in raw_history:
                if isinstance(item, dict):
                    n_src = item.get("numbers", item.get("drawNumberSize", []))
                    nums = [int(n) for n in n_src if str(n).isdigit()]
                    if len(nums) >= 5: history.append(nums)
        
        if not history: return jsonify({"status": "error", "message": "歷史資料格式異常"})

        max_num = 38 if game == 'weili' else (39 if game in ['539', 'daily'] else 49)
        ball_count = 5 if game in ['539', 'daily'] else 6
        
        # 1. 預測未來的下一期
        scores = bayesian_engine(history[::-1], max_num)
        
        # 💡 2. 時空旅行模擬：算出「上一期」的推薦號碼並對獎
        prev_predicted = []
        hit_nums = []
        if len(history) > 1:
            simulated_history = history[1:] # 把最新一期遮住
            prev_scores = bayesian_engine(simulated_history[::-1], max_num)
            prev_predicted = [s["num"] for s in prev_scores[:ball_count]]
            
            # 對獎 (只比對主支號碼)
            actual_main_balls = latest_numbers[:ball_count]
            hit_nums = list(set(prev_predicted) & set(actual_main_balls)) # 找出重疊的中獎號碼
        
        return jsonify({
            "status": "success",
            "game": game,
            "latest_period": latest_period,
            "latest_numbers": latest_numbers[:6] if game not in ['539', 'daily'] else latest_numbers[:5],
            "predicted": [s["num"] for s in scores[:10]],
            "details": scores[:10],
            "prev_predicted": prev_predicted, # 傳送模擬預測
            "hit_nums": hit_nums # 傳送中獎結果
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
