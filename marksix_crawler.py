import requests
import json
import re

def crawl():
    url = "https://www.pilio.idv.tw/lotto/hk6/list.asp"
    res = requests.get(url)
    res.encoding = 'utf-8'
    content = re.sub(r'<[^>]+>', ' ', res.text)
    periods = re.findall(r'(\d{5,7})', content)
    history = []
    if periods:
        latest_p = sorted(list(set(periods)), reverse=True)
        for p in latest_p[:15]:
            if len(p) < 5: continue
            idx = content.find(p)
            balls = re.findall(r'\b(0[1-9]|[1-4][0-9])\b', content[idx:idx+500])
            unique = []
            for b in balls:
                if b not in unique: unique.append(b)
                if len(unique) == 6: break
            if len(unique) == 6:
                history.append({"issue": p, "numbers": unique})
    with open('marksix.json', 'w', encoding='utf-8') as f:
        json.dump({"history": history}, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    crawl()
