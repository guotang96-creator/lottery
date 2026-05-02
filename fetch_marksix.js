const fs = require('fs');

async function fetchMarksixData() {
    console.log("🌐 啟動六合彩數據同步 (Proxy 跳板繞道模式)...");
    try {
        // 透過 AllOrigins 跳板，破解 403 Forbidden 封鎖
        const targetUrl = "https://bet.hkjc.com/contentserver/jcbw/cmc/last30draw.json";
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        });
        
        let text = await res.text();
        const data = JSON.parse(text.replace(/^\uFEFF/, '')); 
        
        let history = [];
        data.forEach(item => {
            const issue = "20" + item.id.replace('/', '');
            const d = item.date.split('/').reverse().join('-');
            const nums = item.no.split('+').map(n => String(n).padStart(2, '0'));
            nums.push(String(item.sno).padStart(2, '0'));
            history.push({ issue, date: d, numbers: nums });
        });
        
        if (history.length === 0) throw new Error("代理伺服器回傳空資料");

        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        fs.writeFileSync('marksix.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 六合彩同步成功！共抓回 ${history.length} 期最新資料。`);
    } catch (e) {
        console.log(`❌ 六合彩同步失敗: ${e.message}`);
    }
}

fetchMarksixData();
