import requests
import json
import re

def crawl():
    history = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    urls = [
        "https://lotto.auzonet.com/marksix/list_10.html",
        "https://www.twbb.tw/marksix/",
        "https://www.pilio.idv.tw/lotto/hk6/list.asp"
    ]
    
    proxies = ["{}", "https://api.codetabs.com/v1/proxy?quest={}", "https://corsproxy.io/?{}", "https://api.allorigins.win/raw?url={}"]

    for url in urls:
        if history: break
        for proxy in proxies:
            if history: break
            target_url = proxy.format(url)
            try:
                res = requests.get(target_url, headers=headers, timeout=15)
                res.encoding = 'utf-8'
                text = res.text
                
                # 六合彩期數通常是 7 位數 (例如 2024045)
                periods = re.findall(r'(202\d{4})', text)
                if not periods: continue
                
                latest_p = sorted(list(set(periods)), reverse=True)
                for p in latest_p[:15]:
                    idx = text.find(p)
                    if idx == -1: continue
                    block = text[idx:idx+1500]
                    # 六合彩是 01~49
                    balls = re.findall(r'>\s*(0[1-9]|[1-4][0-9])\s*<', block)
                    
                    unique = []
                    for b in balls:
                        if b not in unique: unique.append(b)
                        if len(unique) == 6: break
                        
                    if len(unique) == 6:
                        history.append({"issue": p, "numbers": unique})
            except:
                pass

    with open('marksix.json', 'w', encoding='utf-8') as f:
        json.dump({"history": history}, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 六合彩抓取完成，共 {len(history)} 期。")

if __name__ == "__main__":
    crawl()
