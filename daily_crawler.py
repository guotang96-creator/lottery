import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def crawl_daily_39():
    url = "https://www.lotto-8.com/list_Daily39.asp"
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
        res = requests.get(url, headers=header, timeout=15)
        res.encoding = 'utf-8'
        
        if res.status_code != 200:
            print(f"❌ 伺服器回傳錯誤狀態碼: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 尋找所有 class 為 td_a, td_b 的儲存格 (這是該網站常用的格式)
        # 或者直接找表格中的行
        rows = soup.find_all('tr')
        recent_data = []

        for row in rows:
            tds = row.find_all('td')
            # 天天樂一列通常有 7 個欄位: 日期, 期數, 號1, 號2, 號3, 號4, 號5
            if len(tds) == 7:
                date_str = tds[0].get_text(strip=True)
                period_str = tds[1].get_text(strip=True)
                # 檢查是否為正確的日期格式 (YYYY/MM/DD)
                if '/' in date_str and period_str.isdigit():
                    nums = [
                        int(tds[2].get_text(strip=True)),
                        int(tds[3].get_text(strip=True)),
                        int(tds[4].get_text(strip=True)),
                        int(tds[5].get_text(strip=True)),
                        int(tds[6].get_text(strip=True))
                    ]
                    recent_data.append({
                        "period": period_str,
                        "lotteryDate": date_str.replace('/', '-'),
                        "drawNumberSize": nums
                    })

        if not recent_data:
            print("❌ 解析 HTML 後找不到任何符合格式的資料行")
            return

        # 封裝成標準格式
        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data[:50],
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 成功解析 {len(recent_data)} 期天天樂資料，已寫入 daily.json")

    except Exception as e:
        print(f"💥 發生錯誤: {str(e)}")

if __name__ == "__main__":
    crawl_daily_39()
