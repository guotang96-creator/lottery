import requests
import json
import re

def crawl():
    history = []
    # 🌟 策略 1: 官方 API + 跳板直連
    try:
        url = "https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Lotto649Result?limit=15"
        res = requests.get(f"https://api.allorigins.win/get?url={url}", timeout=20).json()
        data = json.loads(res["contents"])
        
        def find_draws(obj):
            draws = []
            if isinstance(obj, list):
                for item in obj:
                    if isinstance(item, dict) and 'period' in item and ('drawNumberSize' in item or 'drawNumbers' in item):
                        draws.append(item)
                    else: draws.extend(find_draws(item))
            elif isinstance(obj, dict):
                if 'period' in obj and ('drawNumberSize' in obj or 'drawNumbers' in obj):
                    draws.append(obj)
                else:
                    for k, v in obj.items(): draws.extend(find_draws(v))
            return draws
            
        results = find_draws(data)
        results.sort(key=lambda x: int(x['period']), reverse=True)
        for r in results[:15]:
            nums = r.get('drawNumberSize') or r.get('drawNumbers') or []
            valid_nums = [str(n).zfill(2) for n in nums if str(n).isdigit()]
            if len(valid_nums) >= 6:
                history.append({"issue": str(r['period']), "numbers": valid_nums[:6]})
    except Exception as e:
        print(f"官方 API 失敗: {e}")

    # 🌟 策略 2: 民間網站備援
    if not history:
        try:
            url = "https://www.twbb.tw/lotto649/"
            res = requests.get(f"https://api.allorigins.win/raw?url={url}", timeout=20)
            content = re.sub(r'<[^>]+>', ' ', res.text)
            periods = re.findall(r'(11[3-9]\d{6})', content)
            latest_p = sorted(list(set(periods)), reverse=True)
            for p in latest_p[:15]:
                idx = content.find(p)
                balls = re.findall(r'\b(0[1-9]|[1-4][0-9])\b', content[idx:idx+500])
                unique = []
                for b in balls:
                    if b not in unique: unique.append(b)
                    if len(unique) == 6: break
                if len(unique) == 6:
                    history.append({"issue": p, "numbers": unique})
        except: pass
    
    with open('lotto.json', 'w', encoding='utf-8') as f:
        json.dump({"history": history}, f, ensure_ascii=False, indent=2)
    print(f"大樂透更新完畢，共抓取 {len(history)} 期。")

if __name__ == "__main__":
    crawl()
