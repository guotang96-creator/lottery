const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (Fantasy 5) 官方數據同步...");
    try {
        // 💡 遊戲 ID 7 代表加州的 Fantasy 5 (天天樂)
        const url = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50";
        const res = await fetch(url, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
            }
        });
        
        const data = await res.json();
        let history = [];
        
        if (data && data.PastDrawResults) {
            data.PastDrawResults.forEach(item => {
                const issue = String(item.DrawNumber);
                const d = item.DrawDate.split('T')[0];
                // 取得前 5 個中獎號碼
                const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
                history.push({ issue, date: d, numbers: nums });
            });
        }
        
        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        fs.writeFileSync('daily.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 天天樂同步成功！共抓回 ${history.length} 期最新資料。`);
    } catch (e) {
        console.log(`❌ 天天樂同步失敗: ${e.message}`);
    }
}

fetchDailyData();
