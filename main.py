from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import os 
import traceback

app = Flask(__name__)
CORS(app) 

def fast_statistical_predict(data_list):
    # 🚀 超光速矩陣引擎：不使用 sklearn，記憶體佔用極低，保證 100% 不當機！
    if len(data_list) > 150:
        data_list = data_list[-150:]
        
    scores = {i: 0.0 for i in range(1, 40)}
    
    # 1. 長期趨勢權重 (Long-term Frequency)
    for draw in data_list:
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                scores[int(n)] += 1.0
                
    # 將長期分數標準化到 0~40 分
    max_freq = max(scores.values()) if scores.values() else 1
    for i in scores:
        scores[i] = (scores[i] / max_freq) * 40.0
        
    # 2. 短期爆發力與動能 (Short-term Momentum)
    # 越近期的開獎號碼，給予越高的加權分數
    recent_10 = data_list[-10:]
    for idx, draw in enumerate(recent_10):
        weight = (idx + 1) * 1.5  # 越近期的權重越高
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                scores[int(n)] += weight
                
    # 3. 防連莊與極端值懲罰 (Anti-Repeat Penalty)
    last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    for n in last_draw:
        if n in scores:
            scores[n] *= 0.3  # 上一期剛開過的號碼，總分直接打 3 折強迫避開
            
    # 排序並輸出結果
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_scores, len(data_list)

def extract_history(data_json):
    if isinstance(data_json, dict):
        return data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
    if isinstance(data_json, list): return data_json
    return []

@app.route('/')
def home():
    return "✅ 系統運作正常 (超光速矩陣引擎 V6 - 絕對防當機版)"

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
            
        data = data[::-1] # 反轉為時間正序
        scores, steps = fast_statistical_predict(data)
        
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
        scores, steps = fast_statistical_predict(data)
        
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
