const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (五星級混合萬能爬蟲)...");
    let history = [];

    // 策略一：透過多個代理通道抓取加州官方 API
    const officialUrl = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50";
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(officialUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(officialUrl + "&bust=" + Date.now())}`
    ];

    for (let i = 0; i < proxies.length; i++) {
        console.log(`📡 嘗試官方 API 路線 ${i + 1}...`);
        try {
            const res = await fetch(proxies[i], { headers: { "User-Agent": "Mozilla/5.0" } });
            if (!res.ok) continue;
            const data = await res.json();
            
            if (data && data.PastDrawResults && data.PastDrawResults.length > 0) {
                data.PastDrawResults.forEach(item => {
                    const issue = String(item.DrawNumber);
                    const d = item.DrawDate.split('T')[0];
                    const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
                    history.push({ issue, date: d, numbers: nums });
                });
                console.log(`✅ 路線 ${i + 1} 成功取得官方數據！`);
                break;
            }
        } catch (e) {
            console.log(`⚠️ 路線 ${i + 1} 失敗: ${e.message}`);
        }
    }

    // 策略二：如果官方通道全掛，改用 AllOrigins 跳板抓台灣大A網
    if (history.length === 0) {
        console.log("⚠️ 官方通道全數陣亡，啟動台灣民間站台 (大A網 + 代理刮削模式)...");
        try {
            const backupUrl = "https://www.lotto-8.com/listltodaily.asp";
            // 使用 get 端點，它會回傳包裝好的 JSON，避免直接回傳 HTML 被防火牆阻斷
            const backupProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(backupUrl + "?bust=" + Date.now())}`;
            
            const res = await fetch(backupProxy);
            const json = await res.json();
            
            if (json && json.contents) {
                const html = json.contents; 
                const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                
                rows.forEach(row => {
                    const dateMatch = row.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                    if (!dateMatch) return;
                    const d = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                    const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dateMatch[0], '');
                    
                    // 抓取 1~2 位數的號碼並補零
                    const nums = [...cleanText.matchAll(/\b(\d{1,2})\b/g)].map(m => m[1].padStart(2, '0'));
                    if (nums.length >= 5) {
                        history.push({ issue: d.replace(/-/g, ''), date: d, numbers: nums.slice(0, 5) });
                    }
                });
                if (history.length > 0) console.log(`✅ 備用雷達刮削成功！`);
            }
        } catch (e) {
            console.log(`❌ 備用雷達也失敗了: ${e.message}`);
        }
    }

    // 最終寫入檔案
    if (history.length > 0) {
        history.sort((a, b) => new Date(b.date) - new Date(a.date)); // 依照日期降冪排序
        fs.writeFileSync('daily.json', JSON.stringify({ history }, null, 2));
        console.log(`🎉 天天樂數據寫入成功！最新資料日期：${history[0].date}`);
    } else {
        console.log("💀 所有通道皆被封鎖，無法更新資料。");
    }
}

fetchDailyData();
