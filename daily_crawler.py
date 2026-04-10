import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

def crawl_daily_39():
    url = "https://www.99-lotto.com/daily39.php"
    
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        print(f"🌐 嘗試連線至: {url}")
        res = requests.get(url, headers=header, timeout=20)
        res.encoding = 'utf-8'
        
        if res.status_code != 200:
            print(f"❌ 連線失敗，狀態碼: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        
        rows = soup.find_all('tr')
        recent_data = []

        for row in rows:
            tds = row.find_all('td')
            if len(tds) >= 6:
                txt = [t.get_text(strip=True) for t in tds]
                if '/' in txt[0] and txt[1].isdigit():
                    try:
                        nums = []
                        if len(txt) >= 7:
                            nums = [int(txt[2]), int(txt[3]), int(txt[4]), int(txt[5]), int(txt[6])]
                        else:
                            nums = [int(n) for n in re.findall(r'\d+', txt[2])[:5]]
                        
                        if len(nums) == 5:
                            recent_data.append({
                                "period": txt[1],
                                "lotteryDate": txt[0].replace('/', '-'),
                                "drawNumberSize": nums
                            })
                    except:
                        continue

        if not recent_data:
            print("❌ 解析失敗，請檢查網頁結構。")
            return

        # 💡 升級點：解開 50 期的限制，只要網頁上有多少期，我們最高就吃下 500 期
        output = {
            "daily_latest": recent_data[0],
            "history": recent_data[:500], 
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 天天樂自動更新成功！共抓取 {len(output['history'])} 期歷史大數據。")

    except Exception as e:
        print(f"💥 發生錯誤: {str(e)}")

if __name__ == "__main__":
    crawl_daily_39()
