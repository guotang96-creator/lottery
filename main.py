from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
from sklearn.neural_network import MLPRegressor
import re

app = Flask(__name__)
CORS(app) 

@app.route('/')
def home():
    return "✅ 539 AI 深度學習神經網路 (10期長線版) 已啟動！"

@app.route('/api/predict')
def predict():
    try:
        # 1. 爬取最新開獎資料
        url = "https://www.lotto-8.com/listlto539.asp"
        res = requests.get(url, timeout=10)
        res.encoding = 'utf-8'
        soup = BeautifulSoup(res.text, 'html.parser')
        plain_text = soup.get_text(separator=' ')
        pattern = r'(\d{4}/\d{2}/\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})'
        matches = re.findall(pattern, plain_text)
        
        if not matches:
            return jsonify({"status": "error", "message": "無法抓取歷史資料"})

        # 將資料反轉，由舊到新
        data_list = [[m[0]] + [int(n) for n in m[1:6]] for m in matches][::-1]

        def to_vector(nums):
            m = np.zeros(39)
            for n in nums: 
                m[int(n) - 1] = 1
            return m

        sequences = np.array([to_vector(row[1:6]) for row in data_list])

        # ==========================================
        # 🌟 設定時間序列 (回溯版路期數) - 已改為 10 期
        # ==========================================
        TIME_STEPS = 10
        
        # 檢查資料量是否足夠 10 期
        if len(sequences) <= TIME_STEPS:
            TIME_STEPS = len(sequences) - 1

        X, y = [], []
        for i in range(len(sequences) - TIME_STEPS):
            # 攤平過去 10 期的特徵
            X.append(sequences[i : i + TIME_STEPS].flatten()) 
            y.append(sequences[i + TIME_STEPS]) 
            
        X = np.array(X)
        y = np.array(y)

        # 訓練神經網路 (深度學習模型)
        model = MLPRegressor(hidden_layer_sizes=(128, 64), activation='relu', max_iter=500, random_state=42)
        model.fit(X, y)

        # 根據最新的 10 期版路進行預測
        last_sequence = sequences[-TIME_STEPS:].flatten().reshape(1, -1)
        predicted_probs = model.predict(last_sequence)[0]

        # 產出強度評分
        scores = sorted([(i+1, float(predicted_probs[i]) * 100) for i in range(39)], key=lambda x: x[1], reverse=True)
        
        return jsonify({
            "status": "success",
            "time_steps": TIME_STEPS,
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
