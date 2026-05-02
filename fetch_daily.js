const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (雙路徑備用雷達版)...");
    try {
        const targetUrl = `https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50`;
        const proxyA = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const proxyB = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        let data = null;
        
        // 📡 嘗試路線 A (高速跳板)
        try {
            console.log("嘗試路線 A...");
            const resA = await fetch(proxyA, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (resA.ok) data = await resA.json();
        } catch (e) {}

        // ⚠️ 路線 A 失敗，自動切換路線 B
        if (!data || !data.PastDrawResults) {
            console.log("路線 A 受阻，自動切換路線 B...");
            const resB = await fetch(proxyB, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (resB.ok) data = await resB.json();
        }

        if (!data || !data.PastDrawResults) throw new Error("所有跳板皆遭攔截");

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
