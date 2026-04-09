import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def crawl_daily_39():
    # 💡 換成另一個較易抓取且更新快速的來源
    url = "https://www.99-lotto.com/daily39.php"
    
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
        
        print(f"🌐 嘗試連線至: {url}")
        res = requests.get(url, headers=header, timeout=20)
        res.encoding = 'utf-8'
        
        if res.status_code != 200:
            print(f"❌ 連線失敗，狀態碼: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 尋找所有開獎列表列
        # 該站點結構通常為 <ul> 或 <table>
        rows = soup.find_all('tr')
        recent_data = []

        for row in rows:
            tds = row.find_all('td')
            # 天天樂資料通常包含：期數, 日期, 號碼1~5
            if len(tds) >= 6:
                txt = [t.get_text(strip=True) for t in tds]
                # 尋找包含斜線的日期和數字期數
                if '/' in txt[0] and txt[1].isdigit():
                    try:
                        # 擷取號碼 (有些站在同一格，有些分開，這裡做相容處理)
                        nums = []
                        if len(txt) >= 7: # 號碼分開
                            nums = [int(txt[2]), int(txt[3]), int(txt[4]), int(txt[5]), int(txt[6])]
                        else: # 號碼可能擠在同一格
                            raw_nums = re.findall(r'\d+', txt[2])
                            nums = [int(n) for n in raw_nums[:5]]
                        
                        if len(nums) == 5:
                            recent_data.append({
                                "period": txt[1],
                                "lotteryDate": txt[0].replace('/', '-'),
                                "drawNumberSize": nums
                            })
                    except:
                        continue

        if not recent_data:
            print("❌ 解析資料失敗，請檢查網頁內容片段:")
            print(res.text[:300])
            return

        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data[:50],
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 天天樂資料更新成功，共 {len(recent_data)} 期。")

    except Exception as e:
        print(f"💥 發生錯誤: {str(e)}")

if __name__ == "__main__":
    import re # 補上 re
    crawl_daily_39()
