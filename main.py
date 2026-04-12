from flask import Flask, jsonify
from flask_cors import CORS
import threading
import datetime
import time
import os 
import traceback
import math
import random # 僅用於模擬官方高頻資料流，預測引擎絕對不使用亂數

app = Flask(__name__)
CORS(app) 

# ==========================================
# ⚡ 高頻記憶體快取 (High-Frequency In-Memory Cache)
# 為了應付每 5 分鐘的極速開獎，資料直接存在記憶體，不讀寫硬碟
# ==========================================
BINGO_CACHE = {
    "history": [], # 存放近 500 期歷史，每期包含 20 個號碼
    "last_update": None,
    "weights": {'ema': 1.0, 'markov': 1.0, 'co_occurrence': 1.0, 'fourier': 1.0}
}

# ==========================================
# 🧠 V10 高頻數學模組 1：EMA 動能 (80球版)
# ==========================================
def calc_ema_bingo(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    alpha = 0.15 # 高頻衰減更快
    for idx, draw in enumerate(data_list):
        weight = math.exp(alpha * (idx - total_draws)) * 100 
        for n in draw:
            scores[int(n)] += weight
    return scores

# ==========================================
# 🧠 V10 高頻數學模組 2：馬可夫鏈狀態轉移
# ==========================================
def calc_markov_bingo(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    if total_draws < 2: return scores
    last_draw = set(data_list[-1])
    
    for i in range(total_draws - 1):
        current = set(data_list[i])
        nxt = data_list[i+1]
        matches = last_draw.intersection(current)
        if matches:
            weight = len(matches) * 1.5 # 20球交集機率大，單一權重調低
            for n in nxt:
                scores[n] += weight
    return scores

# ==========================================
# 🧠 V10 高頻數學模組 3：共變異數聚類 (Co-occurrence)
# 取代均值回歸，尋找高頻雜訊中「喜歡一起出現的兄弟牌」
# ==========================================
def calc_co_occurrence(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    if total_draws < 2: return scores
    last_draw = data_list[-1]
    
    for draw in data_list[:-1]:
        # 如果歷史上這一期，包含了我們上一期開出的多顆號碼
        intersection = set(last_draw).intersection(set(draw))
        if len(intersection) >= 5: # 高度相似的歷史軌跡
            for n in draw:
                if n not in last_draw: # 給那些"跟著開出"的號碼加分
                    scores[n] += (len(intersection) * 2.0)
    return scores

# ==========================================
# 🧠 V10 高頻數學模組 4：傅立葉低通濾波 (週期波浪)
# ==========================================
def calc_fourier_bingo(data_list, total_draws):
    scores = {i: 0.0 for i in range(1, 81)}
    signal_length = min(80, total_draws) # 高頻市場只看最近 80 期波浪
    recent_data = data_list[-signal_length:]
    
    for num in range(1, 81):
        signal = [1 if num in draw else 0 for draw in recent_data]
        max_power = 0
        best_period = 1
        
        # 賓果節奏快，尋找 2 到 15 期的短波週期
        for period in range(2, 16):
            real, imag = 0.0, 0.0
            for t in range(signal_length):
                angle = 2 * math.pi * t / period
                real += signal[t] * math.cos(angle)
                imag -= signal[t] * math.sin(angle)
            power = math.sqrt(real**2 + imag**2)
            if power > max_power:
                max_power = power
                best_period = period
                
        expected_phase = signal_length % best_period
        if expected_phase == 0 and max_power > 4.0: 
            scores[num] = max_power * 3.0
    return scores

# ==========================================
# 👑 V10 大腦：高頻貝氏動態集成
# ==========================================
def bayesian_ensemble_bingo():
    data_list = BINGO_CACHE["history"]
    total_draws = len(data_list)
    if total_draws < 20:
        return [(i, 1.0) for i in range(1, 81)], total_draws

    weights = BINGO_CACHE["weights"]
    train_data = data_list[:-1]
    actual_last_draw = data_list[-1]
    
    # 模擬考：測試上一期的準確度
    scores_t_minus_1 = {
        'ema': calc_ema_bingo(train_data, total_draws - 1),
        'markov': calc_markov_bingo(train_data, total_draws - 1),
        'co_occurrence': calc_co_occurrence(train_data, total_draws - 1),
        'fourier': calc_fourier_bingo(train_data, total_draws - 1)
    }
    
    # 貝氏更新：根據昨天表現微調今天的信任度
    for model_name, model_scores in scores_t_minus_1.items():
        max_s = max(model_scores.values()) if model_scores.values() else 1
        if max_s == 0: max_s = 1
        
        hit_score = sum((model_scores.get(n, 0) / max_s) for n in actual_last_draw)
        # 高頻系統衰減記憶，每次只微調 20% 權重，避免神經質反應
        weights[model_name] = weights[model_name] * 0.8 + (1.0 + hit_score * 0.2)
        
    BINGO_CACHE["weights"] = weights # 儲存更新後的權重

    # 正式預測今天
    final_scores = {i: 0.0 for i in range(1, 81)}
    current_scores = {
        'ema': calc_ema_bingo(data_list, total_draws),
        'markov': calc_markov_bingo(data_list, total_draws),
        'co_occurrence': calc_co_occurrence(data_list, total_draws),
        'fourier': calc_fourier_bingo(data_list, total_draws)
    }
    
    for i in range(1, 81):
        final_scores[i] = (current_scores['ema'][i] * weights['ema'] + 
                           current_scores['markov'][i] * weights['markov'] + 
                           current_scores['co_occurrence'][i] * weights['co_occurrence'] + 
                           current_scores['fourier'][i] * weights['fourier'])

    return sorted(final_scores.items(), key=lambda x: x[1], reverse=True), total_draws

# ==========================================
# 🩸 高頻心臟：背景爬蟲執行緒 (每 5 分鐘跳動)
# ==========================================
def bingo_heartbeat():
    print("💓 [系統] V10 賓果高頻心臟已啟動！")
    
    # 初始化：先灌入 500 期模擬的高頻歷史資料，讓 V10 引擎有東西可以算
    if not BINGO_CACHE["history"]:
        print("📥 [系統] 正在灌入 500 期基礎高頻數據...")
        for _ in range(500):
            mock_draw = random.sample(range(1, 81), 20)
            BINGO_CACHE["history"].append(mock_draw)
            
    while True:
        try:
            now = datetime.datetime.utcnow() + datetime.timedelta(hours=8)
            current_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
            
            # 模擬每 5 分鐘官方開出一期新資料 (實戰中這裡會改成 requests.get 去抓台彩 API)
            print(f"🕒 [{current_time_str}] 接收最新一期高頻數據...")
            new_draw = random.sample(range(1, 81), 20)
            
            # 將最新開獎推入快取，並保持最多 500 期的長度
            BINGO_CACHE["history"].append(new_draw)
            if len(BINGO_CACHE["history"]) > 500:
                BINGO_CACHE["history"].pop(0)
                
            BINGO_CACHE["last_update"] = current_time_str
            print(f"✅ [{current_time_str}] 數據更新完畢。目前 V10 權重狀態: {BINGO_CACHE['weights']}")

        except Exception as e:
            print(f"💥 [心臟異常] {e}")
        
        # 設定為 60 秒檢查一次 (為了讓您馬上看到效果，設定較短。實戰改為 300 秒)
        time.sleep(60)

# ==========================================
# 🌐 Web API 端點
# ==========================================
@app.route('/')
def home():
    return "✅ 系統運作正常 (V10 賓果高頻量化引擎 - 心臟跳動中)"

@app.route('/api/predict_bingo')
def predict_bingo():
    try:
        if not BINGO_CACHE["history"]:
            return jsonify({"status": "waiting", "message": "高頻資料庫初始化中，請稍後..."})
            
        scores, steps = bayesian_ensemble_bingo()
        
        # 賓果通常看前 10 顆最具爆發力的星號
        top_10 = scores[:10]
        
        return jsonify({
            "status": "success", 
            "type": "BINGO", 
            "time_steps": steps,
            "last_update": BINGO_CACHE["last_update"],
            "predicted_numbers": [str(s[0]).zfill(2) for s in top_10],
            "details": [{"num": str(s[0]).zfill(2), "score": round(s[1], 2)} for s in top_10]
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    # 啟動高頻心臟 (Daemon 背景執行)
    heartbeat_thread = threading.Thread(target=bingo_heartbeat, daemon=True)
    heartbeat_thread.start()
    
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
