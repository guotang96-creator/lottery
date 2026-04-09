import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def crawl_daily_39():
    # 改用另一個資料來源，通常這個比較不會擋 GitHub IP
    url = "https://www.lotto-8.com/list_Daily39.asp"
    
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
        
        print(f"🌐 正在連線: {url}")
        # 加入 allow_redirects=True 處理可能的跳轉
        res = requests.get(url, headers=header, timeout=20, allow_redirects=True)
        res.encoding = 'utf-8'
        
        # 偵錯：印出前 200 字，看看是不是被擋 (如果是 <html><head><title>Just a moment...</title> 就是被擋)
        print(f"📄 網頁內容片段: {res.text[:200].strip()}")

        soup = BeautifulSoup(res.text, 'html.parser')
        recent_data = []

        # 針對 lotto-8 的表格特徵進行精準抓取
        # 該站的天天樂號碼通常放在 class 為 "td_a" 或 "td_b" 的 tr 裡面
        rows = soup.find_all('tr')
        
        for row in rows:
            tds = row.find_all('td')
            if len(tds) >= 7:
                # 取得文字並清理
                txt = [t.get_text(strip=True) for t in tds]
                # 判斷格式：第一格是日期 (2026/04/09)，第二格是期數 (115000088)
                if '/' in txt[0] and txt[1].isdigit() and len(txt[1]) > 5:
                    try:
                        recent_data.append({
                            "period": txt[1],
                            "lotteryDate": txt[0].replace('/', '-'),
                            "drawNumberSize": [int(txt[2]), int(txt[3]), int(txt[4]), int(txt[5]), int(txt[6])]
                        })
                    except:
                        continue

        if not recent_data:
            print("❌ 解析後未發現資料，可能是結構改變或被導向驗證頁面。")
            # 建立一個空的但格式正確的檔案，避免 Workflow 報錯，方便偵錯
            return 

        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data[:50],
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 成功產出 daily.json，包含 {len(recent_data)} 期資料。")

    except Exception as e:
        print(f"💥 錯誤原因: {str(e)}")

if __name__ == "__main__":
    crawl_daily_39()
