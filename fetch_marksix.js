const fs = require('fs');

async function fetchMarksixData() {
    console.log("🌐 啟動六合彩數據同步 (雙路徑備用雷達版)...");
    try {
        const targetUrl = `https://bet.hkjc.com/contentserver/jcbw/cmc/last30draw.json`;
        const proxyA = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const proxyB = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        let text = null;
        
        // 📡 嘗試路線 A (高速跳板)
        try {
            console.log("嘗試路線 A...");
            const resA = await fetch(proxyA, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (resA.ok) text = await resA.text();
        } catch (e) {}

        // ⚠️ 路線 A 失敗，自動切換路線 B
        if (!text || !text.includes("id")) {
            console.log("路線 A 受阻，自動切換路線 B...");
            const resB = await fetch(proxyB, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (resB.ok) text = await resB.text();
        }

        if (!text || !text.includes("id")) throw new Error("所有跳板皆遭攔截");

        const data = JSON.parse(text.replace(/^\uFEFF/, '')); 
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
        console.log(`✅ 六合彩同步成功！最新期數已更新至：${history[0].date}`);
    } catch (e) {
        console.log(`❌ 六合彩同步失敗: ${e.message}`);
    }
}

fetchMarksixData();
