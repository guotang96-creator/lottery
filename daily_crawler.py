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
        
        # 抓取表格中的期數、日期與號碼
        # 格式通常為: 2026/04/09 115000088 02 14 25 26 39
        pattern = r'(\d{4}/\d{2}/\d{2})\s+(\d+)\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})'
        matches = re.findall(pattern, soup.get_text(separator=' '))
        
        if not matches:
            print("❌ 找不到天天樂資料")
            return

        recent_data = []
        for m in matches[:50]:  # 抓取最近 50 期
            recent_data.append({
                "period": m[1],
                "lotteryDate": m[0].replace('/', '-'),
                "drawNumberSize": [int(m[2]), int(m[3]), int(m[4]), int(m[5]), int(m[6])]
            })

        # 封裝成與 539 相同的 JSON 格式
        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data,
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print("✅ 天天樂資料更新成功！")

    except Exception as e:
        print(f"💥 發生錯誤: {e}")

if __name__ == "__main__":
    crawl_daily_39()
