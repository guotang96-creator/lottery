const fs = require('fs');

async function fetchMarksixData() {
    console.log("🌐 啟動六合彩 (五星級混合萬能爬蟲)...");
    let history = [];

    // 策略一：透過多個代理通道抓取香港馬會官方
    const officialUrl = "https://bet.hkjc.com/contentserver/jcbw/cmc/last30draw.json";
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(officialUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(officialUrl + "&bust=" + Date.now())}`
    ];

    for (let i = 0; i < proxies.length; i++) {
        console.log(`📡 嘗試官方 API 路線 ${i + 1}...`);
        try {
            const res = await fetch(proxies[i], { headers: { "User-Agent": "Mozilla/5.0" } });
            if (!res.ok) continue;
            const text = await res.text();
            
            if (text.includes("id") && text.includes("date")) {
                const data = JSON.parse(text.replace(/^\uFEFF/, '')); 
                data.forEach(item => {
                    const issue = "20" + item.id.replace('/', '');
                    const d = item.date.split('/').reverse().join('-');
                    const nums = item.no.split('+').map(n => String(n).padStart(2, '0'));
                    nums.push(String(item.sno).padStart(2, '0'));
                    history.push({ issue, date: d, numbers: nums });
                });
                console.log(`✅ 路線 ${i + 1} 成功取得官方數據！`);
                break;
            }
        } catch (e) {
            console.log(`⚠️ 路線 ${i + 1} 失敗: ${e.message}`);
        }
    }

    // 策略二：如果官方全掛，改用 AllOrigins 跳板抓台灣大A網
    if (history.length === 0) {
        console.log("⚠️ 官方通道全數陣亡，啟動台灣民間站台 (大A網 + 代理刮削模式)...");
        try {
            const backupUrl = "https://www.lotto-8.com/listltohk.asp";
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
                    
                    const issueMatch = row.replace(/<[^>]+>/g, ' ').match(/(?:第\s*)(\d+)(?:\s*期)/);
                    const issueStr = issueMatch ? issueMatch[1] : d.replace(/-/g, '');

                    const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dateMatch[0], '');
                    const nums = [...cleanText.matchAll(/\b(\d{1,2})\b/g)].map(m => m[1].padStart(2, '0'));
                    
                    if (nums.length >= 7) {
                        history.push({ issue: issueStr, date: d, numbers: nums.slice(0, 7) });
                    }
                });
                if (history.length > 0) console.log(`✅ 備用雷達刮削成功！`);
            }
        } catch (e) {
            console.log(`❌ 備用雷達也失敗了: ${e.message}`);
        }
    }

    if (history.length > 0) {
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync('marksix.json', JSON.stringify({ history }, null, 2));
        console.log(`🎉 六合彩數據寫入成功！最新資料日期：${history[0].date}`);
    } else {
        console.log("💀 所有通道皆被封鎖，無法更新資料。");
    }
}

fetchMarksixData();
