const fs = require('fs');

async function fetchMarksixData() {
    console.log("🌐 啟動六合彩數據同步 (突破防火牆模式)...");
    try {
        // 💡 關鍵修復：加入 headers 偽裝成真人瀏覽器，避免被 Cloudflare 擋下
        const res = await fetch("https://bet.hkjc.com/contentserver/jcbw/cmc/last30draw.json", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        });
        
        if (!res.ok) throw new Error(`HTTP 狀態碼 ${res.status}`);
        
        let text = await res.text();
        const data = JSON.parse(text.replace(/^\uFEFF/, '')); // 移除檔案頭的隱藏 BOM 字元
        
        let history = [];
        data.forEach(item => {
            const issue = "20" + item.id.replace('/', '');
            const d = item.date.split('/').reverse().join('-');
            const nums = item.no.split('+').map(n => String(n).padStart(2, '0'));
            nums.push(String(item.sno).padStart(2, '0'));
            history.push({ issue, date: d, numbers: nums });
        });
        
        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        fs.writeFileSync('marksix.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 六合彩同步成功！共抓回 ${history.length} 期最新資料。`);
    } catch (e) {
        console.log(`❌ 六合彩同步失敗: ${e.message}`);
    }
}

fetchMarksixData();
