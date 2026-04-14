import requests
import json
import re

def crawl():
    history = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    # 目標網站清單 (防護由弱到強排序)
    urls = [
        "https://lotto.auzonet.com/lotto649/list_10.html",
        "https://www.twbb.tw/lotto649/",
        "https://www.pilio.idv.tw/lotto/lotto649/list.asp"
    ]
    
    # 網路通道清單
    proxies = [
        "{}", 
        "https://api.codetabs.com/v1/proxy?quest={}",
        "https://corsproxy.io/?{}",
        "https://api.allorigins.win/raw?url={}"
    ]

    for url in urls:
        if history: break
        for proxy in proxies:
            if history: break
            target_url = proxy.format(url)
            try:
                res = requests.get(target_url, headers=headers, timeout=15)
                res.encoding = 'utf-8'
                text = res.text
                
                # 尋找 113 開頭的 9 位數期數
                periods = re.findall(r'(11[2-9]\d{6})', text)
                if not periods: continue
                
                latest_p = sorted(list(set(periods)), reverse=True)
                for p in latest_p[:15]:
                    idx = text.find(p)
                    if idx == -1: continue
                    # 往下抓 1500 字元區塊
                    block = text[idx:idx+1500]
                    # 精準抓取 HTML 標籤內的 01~49 數字
                    balls = re.findall(r'>\s*(0[1-9]|[1-4][0-9])\s*<', block)
                    
                    unique = []
                    for b in balls:
                        if b not in unique: unique.append(b)
                        if len(unique) == 6: break
                        
                    if len(unique) == 6:
                        history.append({"issue": p, "numbers": unique})
            except:
                pass

    # 寫入檔案
    with open('lotto.json', 'w', encoding='utf-8') as f:
        json.dump({"history": history}, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 大樂透抓取完成，共 {len(history)} 期。")

if __name__ == "__main__":
    crawl()
