from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import os 
import traceback
import math

app = Flask(__name__)
CORS(app) 

def advanced_quantitative_predict(data_list):
    # 確保資料量足夠進行深度運算，最多取近 500 期
    if len(data_list) > 500:
        data_list = data_list[-500:]
        
    scores = {i: 0.0 for i in range(1, 40)}
    total_draws = len(data_list)
    
    if total_draws < 10:
        return sorted(scores.items(), key=lambda x: x[1], reverse=True), total_draws

    # ==========================================
    # 核心 1：EMA 指數移動平均 (捕捉短期極強動能)
    # ==========================================
    # alpha 值設定衰減率，越近的期數權重越高
    alpha = 0.12 
    for idx, draw in enumerate(data_list):
        # 計算時間衰減權重 (最近一期為最大值，往過去呈指數遞減)
        weight = math.exp(alpha * (idx - total_draws)) * 100 
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                scores[int(n)] += weight

    # ==========================================
    # 核心 2：馬可夫鏈 (Markov Chain) 拖牌矩陣計算
    # ==========================================
    # 取得最新一期開出的號碼作為「當前狀態」
    last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    markov_scores = {i: 0.0 for i in range(1, 40)}
    
    # 掃描歷史，尋找這 5 顆球過去開出後，下一期跟著開什麼
    for i in range(total_draws - 1):
        current_draw = [int(n) for n in data_list[i] if str(n).isdigit()]
        next_draw = [int(n) for n in data_list[i+1] if str(n).isdigit()]
        
        # 尋找交集：如果歷史上的這一期，有包含我們昨天開出的號碼
        matches = set(last_draw).intersection(set(current_draw))
        if matches:
            # 根據重合的球數給予權重，重合越多，跟牌參考價值越高
            match_weight = len(matches) * 2.5
            for nxt in next_draw:
                if 1 <= nxt <= 39:
                    markov_scores[nxt] += match_weight
                    
    # 將馬可夫拖牌分數正規化並疊加到總分
    for i in range(1, 40):
        scores[i] += markov_scores[i]

    # ==========================================
    # 核心 3：極端偏差回歸 (Mean Reversion)
    # ==========================================
    # 計算每個號碼已經幾期沒開了
    gaps = {i: total_draws for i in range(1, 40)}
    for idx, draw in enumerate(reversed(data_list)):
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                if gaps[int(n)] == total_draws:
                    gaps[int(n)] = idx # 距離現在幾期
                    
    # 理論上 539 每個號碼平均約 8 期會開出一次
    # 如果超過 15 期沒開，開始給予指數級的反彈分數補償
    for i in range(1, 40):
        if gaps[i] > 15:
            # 距離越遠，反彈力道呈非線性放大
            reversion_force = math.pow((gaps[i] - 15), 1.5) * 0.5
            scores[i] += reversion_force

    # ==========================================
    # 核心 4：防連莊懲罰因子 (避免絕對霸榜)
    # ==========================================
    # 雖然連莊有可能，但在機率上連續出現會大幅壓低期望值
    for n in last_draw:
        if n in scores:
            scores[n] *= 0.15 # 將剛開過的號碼權重強力壓縮

    # 進行最終排序，取分數最高者
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_scores, total_draws

def extract_history(data_json):
    if isinstance(data_json, dict):
        return data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
    if isinstance(data_json, list): return data_json
    return []

@app.route('/')
def home():
    return "✅ 系統運作正常 (V8 終極量化數學引擎 - EMA/Markov/Reversion 啟動中)"

@app.route('/api/predict')
def predict_539():
    try:
        url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        recent_data = extract_history(res.json())
        
        data = []
        for item in recent_data:
            if isinstance(item, dict):
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) == 5: data.append(nums)
                    
        if len(data) < 2: raise Exception("歷史期數不足")
            
        data = data[::-1]
        scores, steps = advanced_quantitative_predict(data)
        
        return jsonify({
            "status": "success", "type": "539", "time_steps": steps,
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:6]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:6]]
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/predict_daily')
def predict_daily():
    try:
        url = f"https://guotang96-creator.github.io/lottery/daily.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        recent_data = extract_history(res.json())
        
        data = []
        for item in recent_data:
            if isinstance(item, dict):
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) == 5: data.append(nums)
                    
        if len(data) < 2: raise Exception("歷史期數不足")
            
        data = data[::-1]
        scores, steps = advanced_quantitative_predict(data)
        
        return jsonify({
            "status": "success", "type": "DAILY", "time_steps": steps,
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:6]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:6]]
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
