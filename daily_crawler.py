import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

def crawl_daily_39():
    # 💡 已經幫您換成左邊螢幕的「速彩開獎」加州天天樂網址！
    # ⚠️ 請將這行引號內的網址，換成您左邊瀏覽器實際最完整的網址
    url = "https://sc888.net/index.php?s=/LotteryFan/index" 
    
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
        }
        
        print(f"🌐 嘗試連線至加州天天樂: {url}")
        res = requests.get(url, headers=header, timeout=20)
        res.encoding = 'utf-8'
        
        if res.status_code != 200:
            print(f"❌ 連線失敗，狀態碼: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 尋找所有的表格行 (tr)
        rows = soup.find_all('tr')
        recent_data = []

        for row in rows:
            tds = row.find_all('td')
            # 根據您左邊的螢幕：期數與時間在第一格(tds[0])，號碼在第二格(tds[1])
            if len(tds) >= 2:
                col1 = tds[0].get_text(separator=' ', strip=True)
                col2 = tds[1].get_text(separator=' ', strip=True)
                
                # 抓取期數 (至少4位數，例如 11842)
                period_match = re.search(r'(\d{4,})', col1)
                # 抓取日期 (支援 2026 04 10 或 2026-04-10 或 2026/04/10)
                date_match = re.search(r'(20\d{2})\s*[-/]?\s*(\d{2})\s*[-/]?\s*(\d{2})', col1)
                
                # 從第二格抓取號碼 (抓出剛好 5 顆球)
                nums = [int(n) for n in re.findall(r'\b\d{1,2}\b', col2)[:5]]
                
                if period_match and date_match and len(nums) == 5:
                    period = period_match.group(1)
                    year, month, day = date_match.groups()
                    date_str = f"{year}-{month}-{day}"
                    
                    recent_data.append({
                        "period": period,
                        "lotteryDate": date_str,
                        "drawNumberSize": nums
                    })

        # 去除重複並確保順序 (依照期數由大到小排序)
        seen = set()
        unique_data = []
        for item in recent_data:
            if item["period"] not in seen:
                seen.add(item["period"])
                unique_data.append(item)
                
        unique_data.sort(key=lambda x: int(x["period"]), reverse=True)

        if not unique_data:
            print("❌ 解析失敗，請確認網址是否正確，或網站結構是否改變。")
            return

        # 整理輸出 JSON (抓好抓滿最高 500 期)
        output = {
            "daily_latest": unique_data[0],
            "history": unique_data[:500],
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 天天樂自動更新成功！共抓取 {len(output['history'])} 期歷史大數據。")

    except Exception as e:
        print(f"💥 發生錯誤: {str(e)}")

if __name__ == "__main__":
    crawl_daily_39()
