const fs = require('fs');

async function fetchDailyData() {
    console.log("🌐 啟動天天樂 (換源強攻版：直接擷取台灣彩券資訊網)...");
    try {
        // 放棄加州官方 API，改抓台灣民間開獎網站的 HTML
        const res = await fetch("https://www.lotto-8.com/listltodaily.asp", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const html = await res.text();

        // 鎖定表格中的每一行 (tr)
        const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        let history = [];

        rows.forEach(row => {
            // 尋找日期格式 YYYY/MM/DD
            const dateMatch = row.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
            if (!dateMatch) return;

            const d = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            
            // 剝除 HTML 標籤，並把日期移除，避免干擾抓數字
            const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dateMatch[0], '');
            
            // 抓出所有獨立的 2 位數號碼 (01~39)
            const nums = [...cleanText.matchAll(/\b(\d{2})\b/g)].map(m => m[1]);

            // 天天樂有 5 顆球，只要找到 5 顆以上就算成功
            if (nums.length >= 5) {
                history.push({
                    issue: d.replace(/-/g, ''), // 民間網站沒期數，用日期當期數
                    date: d,
                    numbers: nums.slice(0, 5)
                });
            }
        });

        if (history.length === 0) throw new Error("新來源無法解析，可能網頁結構改變");

        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync('daily.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 天天樂換源成功！最新開獎日期已推進至：${history[0].date}`);
    } catch (e) {
        console.log(`❌ 天天樂換源失敗: ${e.message}`);
    }
}

fetchDailyData();
