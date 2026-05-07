const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (幽靈無頭爬蟲：避開跳板封鎖)...");
    let history = [];

    // 路線：優先直攻台灣老牌資訊網 (通常無防火牆)，最後才依賴代理
    const routes = [
        "https://www.pilio.idv.tw/ltodaily/list.asp",
        "https://www.lotto-8.com/listltodaily.asp",
        "https://api.codetabs.com/v1/proxy?quest=https://www.lotto-8.com/listltodaily.asp",
        "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50"
    ];

    for (let i = 0; i < routes.length; i++) {
        console.log(`📡 嘗試路線 ${i + 1}: ${routes[i].split('/')[2]}...`);
        try {
            const res = await fetch(routes[i], { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
            const text = await res.text();

            // 1. 解析加州官方 JSON 格式
            if (text.includes('PastDrawResults')) {
                const data = JSON.parse(text);
                data.PastDrawResults.forEach(item => {
                    const issue = String(item.DrawNumber);
                    const d = item.DrawDate.split('T')[0];
                    const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
                    history.push({ issue, date: d, numbers: nums });
                });
            } 
            // 2. 暴力解析台灣民間網頁 HTML 格式
            else if (text.includes('<table') || text.includes('<tr')) {
                const rows = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                rows.forEach(row => {
                    // 尋找日期 (支援西元年 2026/05/08 或 民國年 115/05/08)
                    let dMatch = row.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                    let dateStr = "";
                    if (dMatch) {
                        dateStr = `${dMatch[1]}-${dMatch[2].padStart(2,'0')}-${dMatch[3].padStart(2,'0')}`;
                    } else {
                        dMatch = row.match(/(\d{3})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                        if (dMatch) dateStr = `${parseInt(dMatch[1])+1911}-${dMatch[2].padStart(2,'0')}-${dMatch[3].padStart(2,'0')}`;
                    }
                    if (!dateStr) return;

                    // 尋找期數與號碼
                    const iMatch = row.replace(/<[^>]+>/g, ' ').match(/第\s*(\d+)\s*期/);
                    const issueStr = iMatch ? iMatch[1] : dateStr.replace(/-/g, '');
                    const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dMatch[0], '');
                    
                    const nums = [...cleanText.matchAll(/\b(\d{1,2})\b/g)]
                        .map(m => m[1].padStart(2, '0'))
                        .filter(n => parseInt(n) > 0 && parseInt(n) <= 39); // 天天樂最大39
                    
                    // 去除重複號碼，確保至少抓到 5 顆球
                    const uniqueNums = [...new Set(nums)];
                    if (uniqueNums.length >= 5) {
                        history.push({ issue: issueStr, date: dateStr, numbers: uniqueNums.slice(0, 5) });
                    }
                });
            }

            // 只要抓到 5 期以上的資料，就判定此路線成功，中斷搜尋
            if (history.length > 5) {
                console.log(`✅ 路線 ${i + 1} 成功取得數據！`);
                break;
            }
        } catch (e) {
            console.log(`⚠️ 路線 ${i + 1} 失敗: ${e.message}`);
        }
    }

    // 歷史資料去重與防呆寫入
    const uniqueHistory = [];
    const seenDates = new Set();
    history.forEach(item => {
        if (!seenDates.has(item.date)) {
            seenDates.add(item.date);
            uniqueHistory.push(item);
        }
    });

    if (uniqueHistory.length > 0) {
        uniqueHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync('daily.json', JSON.stringify({ history: uniqueHistory }, null, 2));
        console.log(`🎉 天天樂數據更新成功！最新日期：${uniqueHistory[0].date}`);
    } else {
        // [重要防呆] 如果全軍覆沒，絕對不要寫入空陣列，保留舊檔案才不會讓前端跳紅字
        console.log("💀 所有通道皆被封鎖。拒絕覆寫，保留系統舊有資料。");
    }
}

fetchDailyData();
