import requests
import json
import re

def crawl():
    history = []
    # 🌟 專攻無防護老站 (樂透研究院)
    try:
        url = "https://www.lotto-8.com/listltomk.asp"
        res = requests.get(f"https://api.allorigins.win/get?url={url}", timeout=20).json()
        text = res.get("contents", "")
        
        blocks = re.findall(r'<tr.*?>(.*?)</tr>', text, re.DOTALL | re.IGNORECASE)
        for block in blocks:
            if '202' in block and ('balls' in block.lower() or '號碼' in block):
                period_match = re.search(r'(202\d{4})', block)
                if not period_match: continue
                period = period_match.group(1)
                
                balls = re.findall(r'(?<!\d)(0[1-9]|[1-4][0-9])(?!\d)', block)
                unique = []
                for b in balls:
                    if b not in unique: unique.append(b)
                    if len(unique) == 6: break
                    
                if len(unique) == 6:
                    history.append({"issue": period, "numbers": unique})
    except Exception as e:
        print(f"六合彩抓取失敗: {e}")
        
    with open('marksix.json', 'w', encoding='utf-8') as f:
        json.dump({"history": history[:15]}, f, ensure_ascii=False, indent=2)
    print(f"六合彩更新完畢，共抓取 {len(history)} 期。")

if __name__ == "__main__":
    crawl()
