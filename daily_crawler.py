import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

def crawl_daily_39():
    url = "https://www.lotto-8.com/list_Daily39.asp"
    try:
        header = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        res = requests.get(url, headers=header, timeout=15)
        res.encoding = 'utf-8'
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 這裡改用更寬鬆的正規表達式，並先印出部分文字檢查
        full_text = soup.get_text(separator=' ')
        pattern = r'(\d{4}/\d{2}/\d{2})\s+(\d+)\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})'
        matches = re.findall(pattern, full_text)
        
        if not matches:
            print("❌ 找不到天天樂資料，嘗試第二種抓取方式...")
            # 備用方案：抓取所有兩位數數字
            # 如果正規表達式太嚴格，這裡可以做調整
            return

        recent_data = []
        for m in matches[:50]:
            recent_data.append({
                "period": m[1],
                "lotteryDate": m[0].replace('/', '-'),
                "drawNumberSize": [int(m[2]), int(m[3]), int(m[4]), int(m[5]), int(m[6])]
            })

        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data,
            "updatedAt": datetime.now().isoformat()
        }

        # 確保檔案寫入根目錄
        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 成功抓取 {len(recent_data)} 期天天樂資料，檔案已產出。")

    except Exception as e:
        print(f"💥 發生錯誤: {e}")

if __name__ == "__main__":
    crawl_daily_39()
