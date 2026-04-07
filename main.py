from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import re

app = Flask(__name__)
CORS(app) # 允許您的網頁跨網域連線

@app.route('/')
def home():
    return "✅ 539 AI 終極大腦已啟動！"

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
        
        data_list = [[m[0]] + [int(n) for n in m[1:6]] for m in matches]
        df = pd.DataFrame(data_list, columns=['Date', 'B1', 'B2', 'B3', 'B4', 'B5']).iloc[::-1]

        # 2. 隨機森林模型訓練
        def to_matrix(row):
            m = np.zeros(39)
            for i in range(1, 6): m[int(row[f'B{i}']) - 1] = 1
            return m

        all_draws = np.array([to_matrix(r) for _, r in df.iterrows()])
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(all_draws[:-1], all_draws[1:])

        # 3. 產出預測結果
        probs = model.predict_proba(all_draws[-1].reshape(1, -1))
        scores = sorted([(i+1, probs[i][0][1]) for i in range(39)], key=lambda x: x[1], reverse=True)
        
        return jsonify({
            "status": "success",
            "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:5]],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:5]]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
