from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
from sklearn.neural_network import MLPRegressor
import re
import os 

app = Flask(__name__)
CORS(app) 

# --- 通用預測核心函數 ---
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

@app.route('/')
def home():
    return "✅ 539 & 天天樂 AI 雙核心引擎已啟動！"

# 1️⃣ 今彩 539 接口
@app.route('/api/predict')
def predict_539():
    try:
        url = "https://www.lotto-8.com/listlto539.asp"
        res = requests.get(url, timeout=10)
        res.encoding = 'utf-8'
        soup = BeautifulSoup(res.text, 'html.parser')
        pattern = r'(\d{4}/\d{2}/\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})'
        matches = re.findall(pattern, soup.get_text(separator=' '))
        data = [[int(n) for n in m[1:6]] for m in matches][::-1]
        
        scores, steps = train_and_predict(data)
        return jsonify({
            "status": "success", "type": "539", "time_steps": steps,
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e: return jsonify({"status": "error", "message": str(e)})

# 2️⃣ 加州天天樂 接口
@app.route('/api/predict_daily')
def predict_daily():
    try:
        # 爬取天天樂網址 (範例網址，請確認抓取來源)
        url = "https://www.lotto-8.com/list_Daily39.asp" 
        res = requests.get(url, timeout=10)
        res.encoding = 'utf-8'
        soup = BeautifulSoup(res.text, 'html.parser')
        pattern = r'(\d{4}/\d{2}/\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})'
        matches = re.findall(pattern, soup.get_text(separator=' '))
        data = [[int(n) for n in m[1:6]] for m in matches][::-1]
        
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
