const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (Proxy 跳板繞道模式)...");
    try {
        // 透過 AllOrigins 跳板，隱藏 GitHub 伺服器 IP
        const targetUrl = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50";
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" 
            }
        });
        
        const data = await res.json();
        let history = [];
        
        if (data && data.PastDrawResults) {
            data.PastDrawResults.forEach(item => {
                const issue = String(item.DrawNumber);
                const d = item.DrawDate.split('T')[0];
                const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
                history.push({ issue, date: d, numbers: nums });
            });
        }
        
        if (history.length === 0) throw new Error("代理伺服器回傳空資料");

        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        fs.writeFileSync('daily.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 天天樂同步成功！共抓回 ${history.length} 期最新資料。`);
    } catch (e) {
        console.log(`❌ 天天樂同步失敗: ${e.message}`);
    }
}

fetchDailyData();
