from flask import Flask, jsonify
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

@app.route('/')
def home():
    return "✅ 539 AI 深度學習神經網路 (7期優化版) 已啟動！"

@app.route('/api/predict')
def predict():
    try:
        url = "https://www.lotto-8.com/listlto539.asp"
        res = requests.get(url, timeout=10)
        res.encoding = 'utf-8'
        soup = BeautifulSoup(res.text, 'html.parser')
        plain_text = soup.get_text(separator=' ')
        pattern = r'(\d{4}/\d{2}/\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})'
        matches = re.findall(pattern, plain_text)
        
        if not matches:
            return jsonify({"status": "error", "message": "無法抓取歷史資料"})

        data_list = [[m[0]] + [int(n) for n in m[1:6]] for m in matches][::-1]

        def to_vector(nums):
            m = np.zeros(39)
            for n in nums: 
                m[int(n) - 1] = 1
            return m

        sequences = np.array([to_vector(row[1:6]) for row in data_list])

        # ==========================================
        # 🌟 調整為 7 期走勢 (黃金平衡點)
        # ==========================================
        TIME_STEPS = 7
        
        if len(sequences) <= TIME_STEPS:
            TIME_STEPS = len(sequences) - 1

        X, y = [], []
        for i in range(len(sequences) - TIME_STEPS):
            X.append(sequences[i : i + TIME_STEPS].flatten()) 
            y.append(sequences[i + TIME_STEPS]) 
            
        X = np.array(X)
        y = np.array(y)

        model = MLPRegressor(hidden_layer_sizes=(128, 64), activation='relu', max_iter=500, random_state=42)
        model.fit(X, y)

        last_sequence = sequences[-TIME_STEPS:].flatten().reshape(1, -1)
        predicted_probs = model.predict(last_sequence)[0]

        scores = sorted([(i+1, float(predicted_probs[i]) * 100) for i in range(39)], key=lambda x: x[1], reverse=True)
        
        return jsonify({
            "status": "success",
            "time_steps": TIME_STEPS, # 這裡會把 7 傳給手機網頁
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
