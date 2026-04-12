from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import os 
import traceback
import math

app = Flask(__name__)
CORS(app) 

# --- 核心數學模組 1：EMA 動能 ---
def calc_ema(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    alpha = 0.12 
    for idx, draw in enumerate(data_list):
        weight = math.exp(alpha * (idx - total_draws)) * 100 
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                scores[int(n)] += weight
    return scores

# --- 核心數學模組 2：馬可夫鏈 (拖牌) ---
def calc_markov(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    if total_draws < 2: return scores
    last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    
    for i in range(total_draws - 1):
        current = [int(n) for n in data_list[i] if str(n).isdigit()]
        nxt = [int(n) for n in data_list[i+1] if str(n).isdigit()]
        matches = set(last_draw).intersection(set(current))
        if matches:
            weight = len(matches) * 3.0
            for n in nxt:
                if 1 <= n <= 39: scores[n] += weight
    return scores

# --- 核心數學模組 3：均值回歸 (反彈) ---
def calc_reversion(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    gaps = {i: total_draws for i in range(1, 40)}
    for idx, draw in enumerate(reversed(data_list)):
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                if gaps[int(n)] == total_draws: gaps[int(n)] = idx
                
    for i in range(1, 40):
        if gaps[i] > 12: # 超過 12 期未開開始計算非線性反彈
            scores[i] = math.pow((gaps[i] - 12), 1.6) * 0.8
    return scores

# --- 核心數學模組 4：傅立葉轉換 (週期波浪) ---
def calc_fourier(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    # 取近 100 期作為波浪訊號分析 (避免過度雜訊)
    signal_length = min(100, total_draws)
    recent_data = data_list[-signal_length:]
    
    for num in range(1, 40):
        # 建立該號碼的二進位時間序列 (有開=1, 沒開=0)
        signal = [1 if str(num).zfill(2) in [str(x).zfill(2) for x in draw] else 0 for draw in recent_data]
        
        max_power = 0
        best_period = 1
        # 尋找 3 到 20 期的隱藏週期
        for period in range(3, 21):
            real, imag = 0.0, 0.0
            for t in range(signal_length):
                angle = 2 * math.pi * t / period
                real += signal[t] * math.cos(angle)
                imag -= signal[t] * math.sin(angle)
            power = math.sqrt(real**2 + imag**2)
            if power > max_power:
                max_power = power
                best_period = period
                
        # 計算相位：預測下一期是否剛好落在該號碼的「最佳週期波峰」上
        expected_phase = signal_length % best_period
        if expected_phase == 0 and max_power > 3.0: 
            # 剛好滿一個週期，且波浪強度夠，給予極高爆發分
            scores[num] = max_power * 5.0
            
    return scores

# --- V9 大腦：貝氏動態集成 (Bayesian Dynamic Ensemble) ---
def bayesian_ensemble_predict(data_list):
    total_draws = len(data_list)
    if total_draws < 50:
        # 資料不足以回測，給予平均權重
        return [(i, 1.0) for i in range(1, 40)], total_draws

    # 1. 初始化貝氏先驗權重 (Prior Weights)
    weights = {'ema': 1.0, 'markov': 1.0, 'reversion': 1.0, 'fourier': 1.0}
    
    # 2. 進行貝氏後驗更新 (Backtesting on t-1)
    # 取出除去最後一期的歷史資料
    train_data = data_list[:-1]
    actual_last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    
    # 計算各模組在「預測昨天」時的分數
    scores_t_minus_1 = {
        'ema': calc_ema(train_data, total_draws - 1),
        'markov': calc_markov(train_data, total_draws - 1),
        'reversion': calc_reversion(train_data, total_draws - 1),
        'fourier': calc_fourier(train_data, total_draws - 1)
    }
    
    # 評估各模組表現：如果昨天開出的號碼，該模組給了高分，就大幅增加它的權重
    for model_name, model_scores in scores_t_minus_1.items():
        # 正規化該模組的分數 (0~1)
        max_s = max(model_scores.values()) if model_scores.values() else 1
        if max_s == 0: max_s = 1
        
        hit_score = 0
        for n in actual_last_draw:
            hit_score += (model_scores.get(n, 0) / max_s)
            
        # 貝氏更新：根據命中品質動態調整權重 (Posterior)
        weights[model_name] = weights[model_name] * (1.0 + hit_score * 0.5)

    # 3. 使用更新後的黃金比例權重，預測「今天」
    final_scores = {i: 0.0 for i in range(1, 40)}
    
    current_scores = {
        'ema': calc_ema(data_list, total_draws),
        'markov': calc_markov(data_list, total_draws),
        'reversion': calc_reversion(data_list, total_draws),
        'fourier': calc_fourier(data_list, total_draws)
    }
    
    for i in range(1, 40):
        s_ema = current_scores['ema'][i] * weights['ema']
        s_mar = current_scores['markov'][i] * weights['markov']
        s_rev = current_scores['reversion'][i] * weights['reversion']
        s_fou = current_scores['fourier'][i] * weights['fourier']
        
        final_scores[i] = s_ema + s_mar + s_rev + s_fou

    # 4. 防連莊極端懲罰
    for n in actual_last_draw:
        if n in final_scores:
            final_scores[n] *= 0.1

    sorted_scores = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_scores, total_draws, weights

def extract_history(data_json):
    if isinstance(data_json, dict): return data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
    if isinstance(data_json, list): return data_json
    return []

@app.route('/')
def home():
    return "✅ V9 終極動態集成引擎運作中 (Fourier Transform + Bayesian Inference)"

@app.route('/api/predict')
def predict_539():
    try:
        url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        recent_data = extract_history(res.json())
        
        data = [item.get("drawNumberSize", item.get("numbers", [])) for item in recent_data if isinstance(item, dict) and len(item.get("drawNumberSize", item.get("numbers", []))) == 5]
        if len(data) < 2: raise Exception("歷史期數不足")
            
        data = data[::-1]
        scores, steps, weights = bayesian_ensemble_predict(data)
        
        # 將權重狀態印在後台以供監控
        print(f"[539] 今日 AI 動態權重分配: {weights}")
        
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
        
        data = [item.get("drawNumberSize", item.get("numbers", [])) for item in recent_data if isinstance(item, dict) and len(item.get("drawNumberSize", item.get("numbers", []))) == 5]
        if len(data) < 2: raise Exception("歷史期數不足")
            
        data = data[::-1]
        scores, steps, weights = bayesian_ensemble_predict(data)
        
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
