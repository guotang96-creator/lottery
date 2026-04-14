@app.route('/api/predict/<game>')
def get_prediction(game):
    # 🌟 所有彩種全部走 GitHub JSON 模式
    filename = {
        '539': 'latest.json',
        'daily': 'daily.json',
        'lotto': 'lotto.json',
        'weili': 'weili.json',
        'marksix': 'marksix.json'
    }.get(game)
    
    if not filename:
        return jsonify({"status": "error", "message": "未知彩種"})

    # 讀取您 GitHub 上的 JSON 檔案
    json_url = f"https://guotang96-creator.github.io/lottery/{filename}?t={int(time.time())}"
    
    try:
        res = requests.get(json_url, timeout=10)
        data = res.json()
        raw_history = data.get("history", [])
        
        # 轉換成 AI 需要的數字矩陣 [ [1,2,3,4,5], ... ]
        history = []
        for item in raw_history:
            nums = [int(n) for n in item.get("numbers", [])]
            if len(nums) >= 5:
                history.append(nums)
        
        # 貝氏 AI 運算 (由舊到新傳入)
        max_num = 38 if game == 'weili' else (39 if game in ['539', 'daily'] else 49)
        scores = bayesian_engine(history[::-1], max_num)
        
        return jsonify({
            "status": "success",
            "game": game,
            "latest_period": raw_history[0].get("issue") if raw_history else "N/A",
            "latest_numbers": raw_history[0].get("numbers") if raw_history else [],
            "predicted": [s["num"] for s in scores[:10]],
            "details": scores[:10]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
