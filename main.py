from flask import Flask, jsonify
from flask_cors import CORS
import requests
import numpy as np
from sklearn.neural_network import MLPRegressor
import time
import os 

app = Flask(__name__)
CORS(app) 

# --- AI 預測核心模組 ---
def train_and_predict(data_list, steps=7):
    def to_vector(nums):
        m = np.zeros(39)
        for n in nums: m[int(n) - 1] = 1
        return m
    
    sequences = np.array([to_vector(row) for row in data_list])
    if len(sequences) <= steps: steps = len(sequences) - 1
    
    X, y = [], []
    for i in range(len(sequences) - steps):
        X.append(sequences[i : i + steps].flatten()) 
        y.append(sequences[i + steps]) 
            
    model = MLPRegressor(hidden_layer_sizes=(128, 64), activation='relu', max_iter=500, random_state=42)
    model.fit(np.array(X), np.array(y))
    
    last_sequence = sequences[-steps:].flatten().reshape(1, -1)
    predicted_probs = model.predict(last_sequence)[0]
    scores = sorted([(i+1, float(predicted_probs[i]) * 100) for i in range(39)], key=lambda x: x[1], reverse=True)
    return scores, steps

# --- API 路由 ---
@app.route('/')
def home():
    return "✅ V5.2 AI 雙核心已啟動 (直接對接 GitHub 資料庫)"

@app.route('/api/predict')
def predict_539():
    try:
        # 💡 直接讀取您網頁本身的 latest.json，保證不被擋
        url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        data_json = res.json()
        
        recent_data = data_json.get("recent50", data_json) if isinstance(data_json, dict) else data_json
        
        data = []
        for item in recent_data:
            nums = item.get("drawNumberSize", item.get("numbers", []))
            if len(nums) == 5: data.append(nums)
            
        data = data[::-1] # 反轉為由舊到新
        scores, steps = train_and_predict(data)
        
        return jsonify({
            "status": "success", "type": "539", "time_steps": steps,
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e: return jsonify({"status": "error", "message": str(e)})

@app.route('/api/predict_daily')
def predict_daily():
    try:
        # 💡 直接讀取您網頁本身的 daily.json，保證不被擋
        url = f"https://guotang96-creator.github.io/lottery/daily.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        data_json = res.json()
        
        recent_data = data_json.get("recent50", [])
        
        data = []
        for item in recent_data:
            nums = item.get("drawNumberSize", item.get("numbers", []))
            if len(nums) == 5: data.append(nums)
            
        data = data[::-1] # 反轉為由舊到新
        
        if len(data) < 2:
            raise Exception("資料庫歷史期數不足")
            
        scores, steps = train_and_predict(data)
        
        return jsonify({
            "status": "success", "type": "DAILY", "time_steps": steps,
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e: return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
