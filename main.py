from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
from sklearn.neural_network import MLPRegressor # 引入神經網路模型
import re

app = Flask(__name__)
CORS(app) # 允許網頁跨網域連線

@app.route('/')
def home():
    return "✅ 539 AI 深度學習神經網路 (版路分析大腦) 已啟動！"

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

        # 將資料反轉，讓「最舊的在前面，最新的在最後面」，這對學習版路很重要！
        data_list = [[m[0]] + [int(n) for n in m[1:6]] for m in matches][::-1]

        # 轉換為 39 維的陣列 (0 或 1)
        def to_vector(nums):
            m = np.zeros(39)
            for n in nums: 
                m[int(n) - 1] = 1
            return m

        sequences = np.array([to_vector(row[1:6]) for row in data_list])

        # ==========================================
        # 2. 準備「時間序列 (版路)」特徵 (Time-Series)
        # ==========================================
        # 我們把「過去 3 期」的號碼串接成一個超級特徵，用來預測「下一期」
        # 這樣 AI 就能學會「第一期開X、第二期開Y、第三期開Z -> 第四期就會拖出W」的版路！
        TIME_STEPS = 3
        X, y = [], []
        for i in range(len(sequences) - TIME_STEPS):
            # 將過去 3 期攤平串聯 (3 x 39 = 117 個神經網路輸入節點)
            X.append(sequences[i : i + TIME_STEPS].flatten()) 
            y.append(sequences[i + TIME_STEPS]) # 目標是預測下一期
            
        X = np.array(X)
        y = np.array(y)

        # ==========================================
        # 3. 建立並訓練深度學習神經網路 (Deep Learning)
        # ==========================================
        # 設定隱藏層 (128個神經元 -> 64個神經元)，模擬大腦突觸的思考過程
        model = MLPRegressor(hidden_layer_sizes=(128, 64), activation='relu', max_iter=500, random_state=42)
        model.fit(X, y)

        # ==========================================
        # 4. 根據最新版路，產出預測結果
        # ==========================================
        # 抓取真實世界「最新的 3 期」當作線索，餵給訓練好的神經網路
        last_sequence = sequences[-TIME_STEPS:].flatten().reshape(1, -1)
        predicted_probs = model.predict(last_sequence)[0]

        # 將 AI 算出的各號碼強度排序 (將機率放大為 0~100 的指數)
        scores = sorted([(i+1, float(predicted_probs[i]) * 100) for i in range(39)], key=lambda x: x[1], reverse=True)
        
        return jsonify({
            "status": "success",
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
