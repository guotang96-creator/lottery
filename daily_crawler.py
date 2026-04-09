import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

def crawl_daily_39():
    # 💡 換成另一個較易抓取的來源：久久樂
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
        
        # 尋找所有表格行
        rows = soup.find_all('tr')
        recent_data = []

        for row in rows:
            tds = row.find_all('td')
            # 尋找包含日期和號碼的行 (通常日期在第一格，期數第二格)
            if len(tds) >= 6:
                txt = [t.get_text(strip=True) for t in tds]
                # 匹配日期格式 (例如 2026/04/09)
                if '/' in txt[0] and txt[1].isdigit():
                    try:
                        # 號碼處理：相容不同站點的號碼顯示方式
                        nums = []
                        # 如果號碼分開在後面的格子
                        if len(txt) >= 7:
                            nums = [int(txt[2]), int(txt[3]), int(txt[4]), int(txt[5]), int(txt[6])]
                        else:
                            # 如果號碼擠在同一格
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

        # 整理輸出 JSON
        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data[:50],
            "updatedAt": datetime.now().isoformat()
        }

        # 寫入檔案
        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 天天樂自動更新成功！共抓取 {len(recent_data)} 期。")

    except Exception as e:
        print(f"💥 發生錯誤: {str(e)}")

if __name__ == "__main__":
    crawl_daily_39()
