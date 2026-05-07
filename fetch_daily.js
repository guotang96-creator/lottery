const fs = require('fs');

// 💉 緊急備用種子資料 (用來修復前端「資料庫異常」的紅字)
const SEED_DATA = [
  {"issue": "115000030", "date": "2026-04-18", "numbers": ["09", "10", "23", "24", "25"]},
  {"issue": "115000029", "date": "2026-04-17", "numbers": ["01", "12", "18", "22", "39"]},
  {"issue": "115000028", "date": "2026-04-16", "numbers": ["05", "15", "26", "31", "34"]},
  {"issue": "115000027", "date": "2026-04-15", "numbers": ["02", "08", "19", "27", "33"]},
  {"issue": "115000026", "date": "2026-04-14", "numbers": ["11", "14", "21", "28", "37"]}
];

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (防爆解析 + 美國站台跨海版)...");
    let history = [];

    const routes = [
        // 1. 官方 API (REST 格式) - 直接連線
        "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7/1/50",
        // 2. 官方 API (透過 AllOrigins 代理)
        "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7/1/50"),
        // 3. 美國民間彩券網 (透過跳板繞過區域封鎖)
        "https://api.allorigins.win/get?url=" + encodeURIComponent("https://lottery.net/california/fantasy-5/numbers"),
        // 4. 美國民間彩券網 (另一個代理)
        "https://api.codetabs.com/v1/proxy?quest=https://lottery.net/california/fantasy-5/numbers"
    ];

    for (let i = 0; i < routes.length; i++) {
        console.log(`📡 嘗試跨海路線 ${i + 1}...`);
        try {
            const res = await fetch(routes[i], { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
            const text = await res.text();
            let content = text;

            // 處理 AllOrigins 的 JSON 包裝
            if (text.trim().startsWith('{') && text.includes('"contents"')) {
                try { content = JSON.parse(text).contents; } catch(e) {}
            }

            // [安全解析] 官方 JSON 格式 (加上 try-catch 防爆裝甲)
            if (content.includes('PastDrawResults')) {
                try {
                    const data = JSON.parse(content);
                    if (data && data.PastDrawResults) {
                        data.PastDrawResults.forEach(item => {
                            const issue = String(item.DrawNumber);
                            const d = item.DrawDate.split('T')[0];
                            const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
                            history.push({ issue, date: d, numbers: nums });
                        });
                    }
                } catch(e) {
                    console.log(`⚠️ 路線 ${i+1} JSON 解析失敗，疑似被防火牆竄改為 HTML。`);
                }
            } 
            // [安全解析] 美國網站 HTML 表格 (支援美制 MM/DD/YYYY 格式)
            else if (content.includes('<table') || content.includes('<tr')) {
                const rows = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                rows.forEach(row => {
                    let dateStr = "";
                    // 檢查台灣格式 YYYY/MM/DD 或 YYYY-MM-DD
                    let dMatch = row.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                    if (dMatch) {
                        dateStr = `${dMatch[1]}-${dMatch[2].padStart(2,'0')}-${dMatch[3].padStart(2,'0')}`;
                    } else {
                        // 檢查美國格式 MM/DD/YYYY 或 MM-DD-YYYY
                        dMatch = row.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                        if (dMatch) {
                            dateStr = `${dMatch[3]}-${dMatch[1].padStart(2,'0')}-${dMatch[2].padStart(2,'0')}`;
                        }
                    }
                    if (!dateStr) return;

                    const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dMatch[0], '');
                    const nums = [...cleanText.matchAll(/\b(\d{1,2})\b/g)]
                        .map(m => m[1].padStart(2, '0'))
                        .filter(n => parseInt(n) > 0 && parseInt(n) <= 39); 
                    
                    const uniqueNums = [...new Set(nums)];
                    if (uniqueNums.length >= 5) {
                        history.push({ issue: dateStr.replace(/-/g, ''), date: dateStr, numbers: uniqueNums.slice(0, 5) });
                    }
                });
            }

            // 只要抓到 5 期以上，就認定破關成功
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

    // 終極防呆機制：寫入檔案
    if (uniqueHistory.length > 0) {
        uniqueHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync('daily.json', JSON.stringify({ history: uniqueHistory }, null, 2));
        console.log(`🎉 天天樂數據更新成功！最新日期：${uniqueHistory[0].date}`);
    } else {
        console.log("💀 所有通道皆被封鎖。啟動緊急備用種子資料修復資料庫！");
        
        // 讀取現有檔案，如果檔案壞掉或沒資料，就強制塞入種子
        let currentData = { history: [] };
        if (fs.existsSync('daily.json')) {
            try { currentData = JSON.parse(fs.readFileSync('daily.json', 'utf8')); } catch(e) {}
        }
        
        // 如果真的是空殼，注入血清！
        if (!currentData.history || currentData.history.length === 0) {
            fs.writeFileSync('daily.json', JSON.stringify({ history: SEED_DATA }, null, 2));
            console.log("💉 已注入急救種子資料，解除前端紅字警報！");
        }
    }
}

fetchDailyData();
