import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def crawl_daily_39():
    url = "https://www.lotto-8.com/list_Daily39.asp"
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
        }
        
        print(f"🌐 正在連線至: {url}")
        res = requests.get(url, headers=header, timeout=20)
        res.encoding = 'utf-8'
        
        if res.status_code != 200:
            print(f"❌ 狀態碼異常: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 尋找所有行
        rows = soup.find_all('tr')
        print(f"📊 找到表格列數: {len(rows)}")
        
        recent_data = []
        for row in rows:
            tds = row.find_all('td')
            # 偵錯：如果列數接近 7，印出來看看
            if 6 <= len(tds) <= 8:
                txt_list = [td.get_text(strip=True) for td in tds]
                # 判斷是否為天天樂資料行 (日期, 期數, 1, 2, 3, 4, 5)
                if '/' in txt_list[0] and txt_list[1].isdigit():
                    try:
                        recent_data.append({
                            "period": txt_list[1],
                            "lotteryDate": txt_list[0].replace('/', '-'),
                            "drawNumberSize": [int(txt_list[2]), int(txt_list[3]), int(txt_list[4]), int(txt_list[5]), int(txt_list[6])]
                        })
                    except:
                        continue

        if not recent_data:
            print("❌ 解析失敗。抓取到的部分 HTML 內容摘要:")
            print(res.text[:500]) # 印出前 500 字幫助判斷是否被擋或導向
            return

        output = {
            "daily_latest": recent_data[0],
            "recent50": recent_data[:50],
            "updatedAt": datetime.now().isoformat()
        }

        with open('daily.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 成功產出 daily.json，共 {len(recent_data)} 期")

    except Exception as e:
        print(f"💥 程式崩潰: {str(e)}")

if __name__ == "__main__":
    crawl_daily_39()
