from flask import Flask, jsonify
from flask_cors import CORS
import requests
import numpy as np
from sklearn.neural_network import MLPRegressor
import time
import os 

app = Flask(__name__)
CORS(app) 

# --- AI 預測核心模組 (防死背優化版) ---
def train_and_predict(data_list, steps=7):
    def to_vector(nums):
        m = np.zeros(39)
        for n in nums: m[int(n) - 1] = 1
        return m
    
    sequences = np.array([to_vector(row) for row in data_list])
    if len(sequences) <= steps: steps = max(1, len(sequences) - 1)
    
    X, y = [], []
    for i in range(len(sequences) - steps):
        X.append(sequences[i : i + steps].flatten()) 
        y.append(sequences[i + steps]) 
            
    if len(X) == 0:
        raise Exception("歷史數據不足以訓練模型")
        
    # 💡 降低神經元數量(64, 32)，並加入 alpha=0.1 (正則化懲罰)，強迫 AI 尋找大趨勢
    model = MLPRegressor(hidden_layer_sizes=(64, 32), activation='relu', max_iter=800, alpha=0.1, random_state=42)
    model.fit(np.array(X), np.array(y))
    
    last_sequence = sequences[-steps:].flatten().reshape(1, -1)
    predicted_probs = model.predict(last_sequence)[0]
    
    # 💡 防連莊機制：將上一期剛開出過的號碼權重打 8 折，強迫 AI 分散選號
    last_draw = data_list[-1]
    for n in last_draw:
        idx = int(n) - 1
        if 0 <= idx < 39:
            predicted_probs[idx] *= 0.8  
            
    scores = sorted([(i+1, float(predicted_probs[i]) * 100) for i in range(39)], key=lambda x: x[1], reverse=True)
    return scores, steps

# --- 💡 萬用資料解析器 ---
def extract_history(data_json):
    if isinstance(data_json, dict):
        return data_json.get("recent50") or data_json.get("history") or data_json.get("data") or []
    elif isinstance(data_json, list):
        return data_json
    return []

# --- API 路由 ---
@app.route('/')
def home():
    return "✅ V5.2.4 AI 雙核心已啟動 (防過度擬合優化版)"

@app.route('/api/predict')
def predict_539():
    try:
        url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        data_json = res.json()
        
        recent_data = extract_history(data_json)
        
        data = []
        for item in recent_data:
            if isinstance(item, dict):
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) == 5: data.append(nums)
            
        if len(data) < 2:
            raise Exception("539 歷史期數不足")
            
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
        url = f"https://guotang96-creator.github.io/lottery/daily.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        data_json = res.json()
        
        recent_data = extract_history(data_json)
        
        data = []
        for item in recent_data:
            if isinstance(item, dict):
                nums = item.get("drawNumberSize", item.get("numbers", []))
                if len(nums) == 5: data.append(nums)
            
        if len(data) < 2:
            raise Exception("天天樂 歷史期數不足")
            
        data = data[::-1] # 反轉為由舊到新
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
