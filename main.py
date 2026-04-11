from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import os 
import traceback
import random

app = Flask(__name__)
CORS(app) 

def dynamic_trend_predict(data_list):
    if len(data_list) > 150:
        data_list = data_list[-150:]
        
    scores = {i: 0.0 for i in range(1, 40)}
    
    # 1. 基礎熱度：只看近 30 期 (讓大腦專注於「最近」的趨勢，不被遠古數據綁架)
    recent_30 = data_list[-30:]
    for draw in recent_30:
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                scores[int(n)] += 1.5
                
    # 2. 超短期爆發力：近 5 期給予極高權重 (抓短線強勢號碼)
    recent_5 = data_list[-5:]
    for idx, draw in enumerate(recent_5):
        weight = (idx + 1) * 3.0  
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                scores[int(n)] += weight
                
    # 3. 尋找「冷門反彈號」：計算已經幾期沒開了
    last_seen = {i: 50 for i in range(1, 40)}
    for idx, draw in enumerate(reversed(data_list[-50:])):
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                if last_seen[int(n)] == 50:
                    last_seen[int(n)] = idx # 記錄距離現在幾期沒開

    for i in range(1, 40):
        # 如果超過 8 期沒開，開始給予反彈加分，越久沒開加越多
        if last_seen[i] >= 8:
            scores[i] += (last_seen[i] * 0.8) 
            
    # 4. 防連莊極端懲罰
    last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    for n in last_draw:
        if n in scores:
            scores[n] *= 0.1  # 剛開過的號碼，總分直接打 1 折強迫避開
            
    # 5. 每日活性因子：加入微小波動，讓分數相近的號碼每天洗牌
    random.seed(int(time.time() / 86400)) # 以今天的日期作為種子
    for i in scores:
        scores[i] += random.uniform(0, 5.0)
        
    # 排序並輸出
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_scores, len(data_list)

def extract_history(data_json):
    if isinstance(data_json, dict):
        return data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
    if isinstance(data_json, list): return data_json
    return []

@app.route('/')
def home():
    return "✅ 系統運作正常 (高動態 AI 引擎 V7 - 徹底解決霸榜問題)"

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
        scores, steps = dynamic_trend_predict(data)
        
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
        scores, steps = dynamic_trend_predict(data)
        
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
