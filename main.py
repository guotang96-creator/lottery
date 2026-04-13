from flask import Flask, jsonify
from flask_cors import CORS
import requests
import threading
import datetime
import time
import os 
import math
import json 
import re # 🔥 引入正則表達式，執行暴力文本掃描

app = Flask(__name__)
CORS(app) 

# =====================================================================
# 🌟 【第一部分：539 / 天天樂 V9 貝氏動態引擎】
# =====================================================================
def calc_ema(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    alpha = 0.12 
    for idx, draw in enumerate(data_list):
        weight = math.exp(alpha * (idx - total_draws)) * 100 
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39: scores[int(n)] += weight
    return scores

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

def calc_reversion(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    gaps = {i: total_draws for i in range(1, 40)}
    for idx, draw in enumerate(reversed(data_list)):
        for n in draw:
            if str(n).isdigit() and 1 <= int(n) <= 39:
                if gaps[int(n)] == total_draws: gaps[int(n)] = idx
    for i in range(1, 40):
        if gaps[i] > 12: scores[i] = math.pow((gaps[i] - 12), 1.6) * 0.8
    return scores

def calc_fourier(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 40)}
    signal_length = min(100, total_draws)
    recent_data = data_list[-signal_length:]
    for num in range(1, 40):
        signal = [1 if str(num).zfill(2) in [str(x).zfill(2) for x in draw] else 0 for draw in recent_data]
        max_power = 0
        best_period = 1
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
        if signal_length % best_period == 0 and max_power > 3.0: scores[num] = max_power * 5.0
    return scores

def bayesian_ensemble_predict(data_list):
    total_draws = len(data_list)
    if total_draws < 5: return [(i, 1.0) for i in range(1, 40)], total_draws
    
    weights = {'ema': 1.0, 'markov': 1.0, 'reversion': 1.0, 'fourier': 1.0}
    train_data = data_list[:-1]
    actual_last_draw = [int(n) for n in data_list[-1] if str(n).isdigit()]
    
    scores_t_minus_1 = {
        'ema': calc_ema(train_data, total_draws - 1),
        'markov': calc_markov(train_data, total_draws - 1),
        'reversion': calc_reversion(train_data, total_draws - 1),
        'fourier': calc_fourier(train_data, total_draws - 1)
    }
    
    for model_name, model_scores in scores_t_minus_1.items():
        max_s = max(model_scores.values()) if model_scores.values() else 1
        if max_s == 0: max_s = 1
        hit_score = sum((model_scores.get(n, 0) / max_s) for n in actual_last_draw)
        weights[model_name] = weights[model_name] * (1.0 + hit_score * 0.5)

    final_scores = {i: 0.0 for i in range(1, 40)}
    current_scores = {
        'ema': calc_ema(data_list, total_draws), 'markov': calc_markov(data_list, total_draws),
        'reversion': calc_reversion(data_list, total_draws), 'fourier': calc_fourier(data_list, total_draws)
    }
    for i in range(1, 40):
        final_scores[i] = (current_scores['ema'][i]*weights['ema'] + current_scores['markov'][i]*weights['markov'] + 
                           current_scores['reversion'][i]*weights['reversion'] + current_scores['fourier'][i]*weights['fourier'])
    for n in actual_last_draw:
        if n in final_scores: final_scores[n] *= 0.1

    return sorted(final_scores.items(), key=lambda x: x[1], reverse=True), total_draws

def extract_history(data_json):
    if isinstance(data_json, dict): return data_json.get("history") or data_json.get("recent50") or data_json.get("data") or []
    if isinstance(data_json, list): return data_json
    return []

# =====================================================================
# ⚡ 【第二部分：台灣賓果 V10 高頻引擎 (雙引擎暴力雷達版)】 
# =====================================================================
BINGO_CACHE = {
    "history": [
        [2, 9, 20, 24, 25, 28, 29, 31, 35, 36, 44, 45, 46, 52, 53, 56, 58, 62, 65, 76],
        [1, 5, 8, 12, 17, 21, 22, 27, 30, 33, 40, 41, 48, 50, 55, 60, 61, 68, 72, 79],
        [3, 7, 10, 14, 18, 19, 23, 26, 32, 34, 38, 42, 47, 49, 51, 57, 63, 67, 70, 75]
    ], 
    "last_update": "", 
    "latest_period": "尋找訊號中", 
    "weights": {'ema': 1.0, 'markov': 1.0, 'co_occurrence': 1.0, 'fourier': 1.0}
}

def calc_ema_bingo(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    for idx, draw in enumerate(data_list):
        weight = math.exp(0.15 * (idx - total_draws)) * 100 
        for n in draw: scores[int(n)] += weight
    return scores

def calc_markov_bingo(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    if total_draws < 2: return scores
    last_draw = set(data_list[-1])
    for i in range(total_draws - 1):
        if last_draw.intersection(set(data_list[i])):
            for n in data_list[i+1]: scores[n] += (len(last_draw.intersection(set(data_list[i]))) * 1.5)
    return scores

def calc_co_occurrence(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    if total_draws < 2: return scores
    last_draw = data_list[-1]
    for draw in data_list[:-1]:
        intersection = set(last_draw).intersection(set(draw))
        if len(intersection) >= 5: 
            for n in draw:
                if n not in last_draw: scores[n] += (len(intersection) * 2.0)
    return scores

def calc_fourier_bingo(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    signal_length = min(80, total_draws) 
    recent_data = data_list[-signal_length:]
    for num in range(1, 81):
        signal = [1 if num in draw else 0 for draw in recent_data]
        max_power = 0
        best_period = 1 
        for period in range(2, 16):
            real = sum(signal[t] * math.cos(2 * math.pi * t / period) for t in range(signal_length))
            imag = -sum(signal[t] * math.sin(2 * math.pi * t / period) for t in range(signal_length))
            power = math.sqrt(real**2 + imag**2)
            if power > max_power: 
                max_power = power
                best_period = period
        if signal_length % best_period == 0 and max_power > 4.0: scores[num] = max_power * 3.0
    return scores

def bayesian_ensemble_bingo():
    data_list = BINGO_CACHE["history"]
    total_draws = len(data_list)
    if total_draws < 2: return [(i, 1.0) for i in range(1, 81)], total_draws

    weights = BINGO_CACHE["weights"]
    train_data = data_list[:-1]
    actual_last_draw = data_list[-1]
    
    scores_t_minus_1 = {
        'ema': calc_ema_bingo(train_data, total_draws - 1), 'markov': calc_markov_bingo(train_data, total_draws - 1),
        'co_occurrence': calc_co_occurrence(train_data, total_draws - 1), 'fourier': calc_fourier_bingo(train_data, total_draws - 1)
    }
    
    for name, model_scores in scores_t_minus_1.items():
        max_s = max(model_scores.values()) if model_scores.values() else 1
        hit_score = sum((model_scores.get(n, 0) / (max_s if max_s > 0 else 1)) for n in actual_last_draw)
        weights[name] = weights[name] * 0.8 + (1.0 + hit_score * 0.2)
        
    BINGO_CACHE["weights"] = weights 

    final_scores = {i: 0.0 for i in range(1, 81)}
    current_scores = {
        'ema': calc_ema_bingo(data_list, total_draws), 'markov': calc_markov_bingo(data_list, total_draws),
        'co_occurrence': calc_co_occurrence(data_list, total_draws), 'fourier': calc_fourier_bingo(data_list, total_draws)
    }
    for i in range(1, 81):
        final_scores[i] = sum(current_scores[k][i] * weights[k] for k in weights)

    return sorted(final_scores.items(), key=lambda x: x[1], reverse=True), total_draws

# 🔥 核心武裝：無視防護網的雙引擎暴力抓取器
def fetch_bingo_multi_source():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    # 策略 A：直接對 Pilio (久久) 網站進行暴力文本破解
    targets_A = [
        "https://www.pilio.idv.tw/bingo/bingo.asp",
        "https://api.allorigins.win/raw?url=https://www.pilio.idv.tw/bingo/bingo.asp",
        "https://api.codetabs.com/v1/proxy?quest=https://www.pilio.idv.tw/bingo/bingo.asp"
    ]
    for url in targets_A:
        try:
            res = requests.get(url, headers=headers, timeout=10)
            text = res.text
            # 尋找所有 115 開頭的 9 位數字期數
            periods = sorted(list(set(re.findall(r'(11[3-9]\d{6})', text))), reverse=True)
            if not periods: continue
            
            draws = []
            # 一次抓下網頁上最新的 20 期！
            for p in periods[:20]:
                idx = text.find(p)
                block = re.sub(r'<[^>]+>', ' ', text[idx:idx+800])
                # 抓取 01~80 的數字
                balls = re.findall(r'\b([0-9]{1,2})\b', block)
                unique_balls = []
                for b in balls:
                    val = int(b)
                    if 1 <= val <= 80 and val not in unique_balls:
                        unique_balls.append(val)
                    if len(unique_balls) == 20: break
                
                if len(unique_balls) == 20:
                    draws.append({"period": p, "numbers": sorted(unique_balls)})
            
            if draws: return draws
        except:
            continue

    # 策略 B：官方 API 備援跳板 (防守用)
    try:
        url_off = f"https://api.taiwanlottery.com/TLCAPIWeB/Lottery/BingoResult?limit=30&t={int(time.time())}"
        targets_B = [f"https://corsproxy.io/?{url_off}", f"https://api.allorigins.win/raw?url={url_off}", url_off]
        for route in targets_B:
            try:
                res = requests.get(route, headers=headers, timeout=10)
                data = res.json()
                if "contents" in data and isinstance(data["contents"], str):
                    data = json.loads(data["contents"])
                if isinstance(data, dict) and "content" in data:
                    results = sorted(data["content"].get("bingoResults", []), key=lambda x: int(x.get("period", 0)), reverse=True)
                    draws = []
                    for item in results:
                        nums = item.get("drawNumbers", [])
                        if len(nums) == 20:
                            draws.append({"period": str(item.get("period", "")), "numbers": sorted([int(n) for n in nums])})
                    if draws: return draws
            except:
                continue
    except:
        pass

    return None

def bingo_heartbeat():
    print("🎯 [系統] 啟動雙引擎暴力雷達，掃描中...")
    while True:
        try:
            now = datetime.datetime.utcnow() + datetime.timedelta(hours=8)
            if 7 <= now.hour <= 23:
                # 呼叫暴力抓取器
                draws_data = fetch_bingo_multi_source()
                
                if draws_data:
                    latest_item = draws_data[0]
                    # 如果抓到的期數比快取的新，直接整批替換！
                    if BINGO_CACHE["latest_period"] == "尋找訊號中" or latest_item["period"] > BINGO_CACHE["latest_period"]:
                        
                        # 把抓到的真實歷史反轉 (從舊到新) 塞進記憶體
                        BINGO_CACHE["history"] = [item["numbers"] for item in reversed(draws_data)]
                        BINGO_CACHE["latest_period"] = latest_item["period"]
                        BINGO_CACHE["last_update"] = now.strftime("%Y-%m-%d %H:%M:%S")
                        
                        print(f"🔥 [雷達命中] 成功取得最新期數: {latest_item['period']} (含 {len(draws_data)} 期真實歷史)")
        except Exception:
            pass
        time.sleep(25) # 掃描頻率加快

# =====================================================================
# 🌐 【第三部分：全端點 API 路由】
# =====================================================================
@app.route('/')
def home():
    return "✅ 系統運作正常 (雙引擎暴力雷達版)"

@app.route('/api/predict')
def predict_539():
    try:
        url = f"https://guotang96-creator.github.io/lottery/latest.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        recent_data = extract_history(res.json())
        data = [item.get("drawNumberSize", item.get("numbers", [])) for item in recent_data if isinstance(item, dict) and len(item.get("drawNumberSize", item.get("numbers", []))) == 5]
        if len(data) < 2: raise Exception("歷史期數不足")
        scores, steps = bayesian_ensemble_predict(data[::-1])
        return jsonify({"status": "success", "type": "539", "time_steps": steps, "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:6]], "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:6]]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/predict_daily')
def predict_daily():
    try:
        url = f"https://guotang96-creator.github.io/lottery/daily.json?t={int(time.time())}"
        res = requests.get(url, timeout=10)
        recent_data = extract_history(res.json())
        data = [item.get("drawNumberSize", item.get("numbers", [])) for item in recent_data if isinstance(item, dict) and len(item.get("drawNumberSize", item.get("numbers", []))) == 5]
        if len(data) < 2: raise Exception("歷史期數不足")
        scores, steps = bayesian_ensemble_predict(data[::-1])
        return jsonify({"status": "success", "type": "DAILY", "time_steps": steps, "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:6]], "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:6]]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/predict_bingo')
def predict_bingo():
    try:
        if len(BINGO_CACHE["history"]) < 4: return jsonify({"status": "waiting", "message": "雷達掃描中..."})
        scores, steps = bayesian_ensemble_bingo()
        return jsonify({"status": "success", "type": "BINGO", "time_steps": steps, "period": BINGO_CACHE["latest_period"], "last_update": BINGO_CACHE["last_update"], "predicted_numbers": [str(s[0]).zfill(2) for s in scores[:10]], "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in scores[:10]]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/latest_bingo')
def latest_bingo():
    try:
        if len(BINGO_CACHE["history"]) < 4: return jsonify({"status": "waiting"})
        return jsonify({"status": "success", "numbers": BINGO_CACHE["history"][-1], "period": BINGO_CACHE["latest_period"], "time": BINGO_CACHE["last_update"]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

heartbeat_thread = threading.Thread(target=bingo_heartbeat, daemon=True)
heartbeat_thread.start()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
