const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動加州天天樂 (終極防爆裝甲爬蟲)...");
    let history = [];

    // 策略一：嘗試多個代理通道抓取加州官方 API
    const officialUrl = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/7?page=1&draws=50";
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(officialUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(officialUrl + "&bust=" + Date.now())}`
    ];

    for (let i = 0; i < proxies.length; i++) {
        console.log(`📡 嘗試官方 API 路線 ${i + 1}...`);
        try {
            const res = await fetch(proxies[i], { headers: { "User-Agent": "Mozilla/5.0" } });
            const text = await res.text(); // 先轉成純文字，防止 JSON 解析炸彈
            
            // 防呆：如果回傳的是 HTML (代表被防火牆擋了)，直接跳過
            if (text.trim().startsWith('<')) {
                console.log(`⚠️ 路線 ${i + 1} 遭防火牆攔截 (回傳了 HTML)`);
                continue;
            }
            
            const data = JSON.parse(text);
            if (data && data.PastDrawResults && data.PastDrawResults.length > 0) {
                data.PastDrawResults.forEach(item => {
                    const issue = String(item.DrawNumber);
                    const d = item.DrawDate.split('T')[0];
                    const nums = item.WinningNumbers.map(n => String(n.Number).padStart(2, '0'));
                    history.push({ issue, date: d, numbers: nums });
                });
                console.log(`✅ 路線 ${i + 1} 成功取得官方數據！`);
                break;
            }
        } catch (e) {
            console.log(`⚠️ 路線 ${i + 1} 失敗: ${e.message}`);
        }
    }

    // 策略二：官方通道全掛，改用民間站台 (加入安全解析防爆機制)
    if (history.length === 0) {
        console.log("⚠️ 官方通道全數陣亡，啟動台灣民間站台 (安全解析模式)...");
        const backupUrl = "https://www.lotto-8.com/listltodaily.asp";
        const backupProxies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(backupUrl)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(backupUrl + "?bust=" + Date.now())}`
        ];

        for (let i = 0; i < backupProxies.length; i++) {
            console.log(`📡 嘗試備用雷達路線 ${i + 1}...`);
            try {
                const res = await fetch(backupProxies[i]);
                const text = await res.text(); // 統統先當成字串處理
                let html = "";

                // 判斷是 AllOrigins 的 JSON 包裝，還是 CodeTabs 的純 HTML
                if (text.trim().startsWith('{') && text.includes('"contents"')) {
                    html = JSON.parse(text).contents;
                } else {
                    html = text;
                }

                // 如果解出來根本沒有表格標籤，代表抓錯網頁了，直接跳過
                if (!html || !html.includes("tr")) continue; 

                const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                rows.forEach(row => {
                    const dateMatch = row.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                    if (!dateMatch) return;
                    const d = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                    const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dateMatch[0], '');
                    
                    const nums = [...cleanText.matchAll(/\b(\d{1,2})\b/g)].map(m => m[1].padStart(2, '0'));
                    if (nums.length >= 5) {
                        history.push({ issue: d.replace(/-/g, ''), date: d, numbers: nums.slice(0, 5) });
                    }
                });

                if (history.length > 0) {
                    console.log(`✅ 備用雷達 ${i + 1} 刮削成功！`);
                    break;
                }
            } catch (e) {
                console.log(`❌ 備用雷達 ${i + 1} 解析失敗: ${e.message}`);
            }
        }
    }

    if (history.length > 0) {
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync('daily.json', JSON.stringify({ history }, null, 2));
        console.log(`🎉 天天樂數據寫入成功！最新資料日期：${history[0].date}`);
    } else {
        console.log("💀 所有通道皆被封鎖，無法更新資料。");
        // 防呆：就算都失敗，也要寫入空陣列，不要讓前端讀到壞檔而跳出「資料庫異常」紅字
        if (!fs.existsSync('daily.json')) {
            fs.writeFileSync('daily.json', JSON.stringify({ history: [] }, null, 2));
        }
    }
}

fetchDailyData();
