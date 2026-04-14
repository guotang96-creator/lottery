import requests
import json
import re

def crawl():
    url = "https://www.pilio.idv.tw/lotto/superlotto/list.asp"
    res = requests.get(url)
    res.encoding = 'utf-8'
    content = re.sub(r'<[^>]+>', ' ', res.text)
    periods = re.findall(r'(11[3-9]\d{6})', content)
    history = []
    if periods:
        latest_p = sorted(list(set(periods)), reverse=True)
        for p in latest_p[:15]:
            idx = content.find(p)
            balls = re.findall(r'\b(0[1-9]|[1-3][0-9])\b', content[idx:idx+500])
            unique = []
            for b in balls:
                if b not in unique: unique.append(b)
                if len(unique) == 6: break
            if len(unique) == 6:
                history.append({"issue": p, "numbers": unique})
    with open('weili.json', 'w', encoding='utf-8') as f:
        json.dump({"history": history}, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    crawl()
