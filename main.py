from flask import Flask, jsonify
from flask_cors import CORS
import requests
import numpy as np
from sklearn.neural_network import MLPRegressor
import time
import os 
import traceback

app = Flask(__name__)
CORS(app) 

def train_and_predict(data_list, steps=5):
    # 🛡️ 終極防爆機制：AI 運算嚴格限制只取近 50 期，防止 Render 記憶體爆滿當機！
    if len(data_list) > 50:
        data_list = data_list[-50:]

    def to_vector(nums):
        m = np.zeros(39)
        for n in nums: 
            try: m[int(n) - 1] = 1
            except: pass
        return m
    
    sequences = np.array([to_vector(row) for row in data_list])
    if len(sequences) <= steps: steps = max(1, len(sequences) - 1)
    
    X, y = [], []
    for i in range(len(sequences) - steps):
        X.append(sequences[i : i + steps].flatten()) 
        y.append(sequences[i + steps]) 
            
    if len(X) == 0: raise Exception("歷史數據不足以訓練")
        
    # 💡 極致輕量化引擎：神經元降至 32，迭代次數降至 100，運算速度提升 3 倍
    model = MLPRegressor(hidden_layer_sizes=(32,), activation='relu', max_iter=100, random_state=42)
    model.fit(np.array(X), np.array(y))
    
    last_sequence = sequences[-steps:].flatten().reshape(1, -1)
    predicted_probs = model.predict(last_sequence)[0]
    
    recent_draws = data_list[-15:] if len(data_list) >= 15 else data_list
    hot_counts = np.zeros(39)
    for draw in recent_draws:
        for n in draw:
            try: hot_counts[int(n)-1] += 1
            except: pass

    final_scores = []
    last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]

    for i in range(39):
        ai_score = float(predicted_probs[i]) * 100 
        stat_score = (hot_counts[i] / max(1, len(recent_draws))) * 150 
        total_score = (ai_score * 0.6) + (stat_score * 0.4)
        
        # 剛開出的號碼打 4 折，強制分散號碼
        if (i + 1) in last_draw:
            total_score *= 0.4
            
        final_scores.append((i+1, total_score))
            
    scores = sorted(final_scores, key=lambda x: x[1], reverse=True)
    return scores, steps

def extract_history(data_json):
    if isinstance(data_json, dict):
        return data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
    if isinstance(data_json, list): return data_json
    return []

@app.route('/')
def home():
    return "✅ 系統運作正常 (AI 極致防當機版 + 6碼輸出)"

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
        scores, steps = train_and_predict(data)
        
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
        scores, steps = train_and_predict(data)
        
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
