const fs = require('fs');

async function fetchMarksixData() {
    console.log("🌐 啟動六合彩 (幽靈無頭爬蟲：避開跳板封鎖)...");
    let history = [];

    const routes = [
        "https://www.pilio.idv.tw/ltohk/list.asp",
        "https://www.lotto-8.com/listltohk.asp",
        "https://api.codetabs.com/v1/proxy?quest=https://www.lotto-8.com/listltohk.asp",
        "https://bet.hkjc.com/contentserver/jcbw/cmc/last30draw.json"
    ];

    for (let i = 0; i < routes.length; i++) {
        console.log(`📡 嘗試路線 ${i + 1}: ${routes[i].split('/')[2]}...`);
        try {
            const res = await fetch(routes[i], { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
            const text = await res.text();

            if (text.includes('"id"') && text.includes('"no"')) {
                const data = JSON.parse(text.replace(/^\uFEFF/, '')); 
                data.forEach(item => {
                    const issue = "20" + item.id.replace('/', '');
                    const d = item.date.split('/').reverse().join('-');
                    const nums = item.no.split('+').map(n => String(n).padStart(2, '0'));
                    nums.push(String(item.sno).padStart(2, '0'));
                    history.push({ issue, date: d, numbers: nums });
                });
            }
            else if (text.includes('<table') || text.includes('<tr')) {
                const rows = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                rows.forEach(row => {
                    let dMatch = row.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                    let dateStr = "";
                    if (dMatch) {
                        dateStr = `${dMatch[1]}-${dMatch[2].padStart(2,'0')}-${dMatch[3].padStart(2,'0')}`;
                    } else {
                        dMatch = row.match(/(\d{3})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                        if (dMatch) dateStr = `${parseInt(dMatch[1])+1911}-${dMatch[2].padStart(2,'0')}-${dMatch[3].padStart(2,'0')}`;
                    }
                    if (!dateStr) return;

                    const iMatch = row.replace(/<[^>]+>/g, ' ').match(/第\s*(\d+)\s*期/);
                    const issueStr = iMatch ? iMatch[1] : dateStr.replace(/-/g, '');

                    const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dMatch[0], '');
                    const nums = [...cleanText.matchAll(/\b(\d{1,2})\b/g)]
                        .map(m => m[1].padStart(2, '0'))
                        .filter(n => parseInt(n) > 0 && parseInt(n) <= 49); // 六合彩最大49
                    
                    const uniqueNums = [...new Set(nums)];
                    if (uniqueNums.length >= 7) { // 6正碼 + 1特別號
                        history.push({ issue: issueStr, date: dateStr, numbers: uniqueNums.slice(0, 7) });
                    }
                });
            }

            if (history.length > 5) {
                console.log(`✅ 路線 ${i + 1} 成功取得數據！`);
                break;
            }
        } catch (e) {
            console.log(`⚠️ 路線 ${i + 1} 失敗: ${e.message}`);
        }
    }

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
        fs.writeFileSync('marksix.json', JSON.stringify({ history: uniqueHistory }, null, 2));
        console.log(`🎉 六合彩數據更新成功！最新日期：${uniqueHistory[0].date}`);
    } else {
        console.log("💀 所有通道皆被封鎖。拒絕覆寫，保留系統舊有資料。");
    }
}

fetchMarksixData();
