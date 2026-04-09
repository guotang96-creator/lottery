import requests
import json
from datetime import datetime
import re

def crawl_daily_39():
    # 改抓另一個專門給手機看、完全沒防護的簡單版頁面
    url = "https://www.lotto-8.com/m/Daily39.asp"
    
    try:
        header = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'}
        res = requests.get(url, headers=header, timeout=15)
        res.encoding = 'utf-8'
        
        # 尋找 <li> 標籤內的資料，天天樂手機版通常長這樣
        # 範例: <li>2026/04/09 第115000088期 02,14,25,26,39</li>
        pattern = r'(\d{4}/\d{2}/\d{2}).*?第(\d+)期.*?(\d{2}),(\d{2}),(\d{2}),(\d{2}),(\d{2})'
        matches = re.findall(pattern, res.text)
        
        if not matches:
            print("❌ 手機版也抓不到，確定是被 GitHub IP 完全封鎖。")
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

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 手機版解析成功！產出 {len(recent_data)} 期資料。")

    except Exception as e:
        print(f"💥 錯誤: {e}")

if __name__ == "__main__":
    crawl_daily_39()
