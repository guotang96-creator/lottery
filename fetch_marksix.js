const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (雙重跳板防禦版)...");
    try {
        // 💡 終極殺招：加入當下時間碼 (bust)，徹底炸毀伺服器快取，強迫抓取最新！
        const targetUrl = `https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50&_bust=${Date.now()}`;
        
        // 準備兩個不同的跳板，A計畫失敗自動切換B計畫
        const proxies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
        ];

        let rawText = "";
        for (let proxy of proxies) {
            try {
                console.log(`📡 嘗試連線跳板...`);
                const res = await fetch(proxy, { headers: { "User-Agent": "Mozilla/5.0" } });
                if (!res.ok) continue;
                rawText = await res.text();
                // 檢查是否真的抓到資料，而不是抓到錯誤網頁
                if (rawText.includes("PastDrawResults")) break; 
            } catch (e) { continue; }
        }

        if (!rawText.includes("PastDrawResults")) throw new Error("所有跳板皆遭攔截，請稍後再試");

        const data = JSON.parse(rawText);
        let history = [];
        
        data.PastDrawResults.forEach(item => {
            const issue = String(item.DrawNumber);
            const d = item.DrawDate.split('T')[0];
            const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
            history.push({ issue, date: d, numbers: nums });
        });
        
        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        fs.writeFileSync('daily.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 天天樂同步成功！最新期數已更新至：${history[0].date}`);
    } catch (e) {
        console.log(`❌ 天天樂同步失敗: ${e.message}`);
    }
}

fetchDailyData();
