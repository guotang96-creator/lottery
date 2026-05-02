const fs = require('fs');

async function fetchMarksixData() {
    console.log("🌐 啟動六合彩 (換源強攻版：直接擷取台灣彩券資訊網)...");
    try {
        // 放棄香港馬會嚴格的防火牆，改抓台灣民間開獎網
        const res = await fetch("https://www.lotto-8.com/listltohk.asp", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const html = await res.text();

        const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        let history = [];

        rows.forEach(row => {
            const dateMatch = row.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
            if (!dateMatch) return;

            const d = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            
            // 嘗試抓取期數 (例如：第 2026048 期)
            const issueMatch = row.replace(/<[^>]+>/g, ' ').match(/(?:第\s*)(\d+)(?:\s*期)/);
            const issueStr = issueMatch ? issueMatch[1] : d.replace(/-/g, '');

            const cleanText = row.replace(/<[^>]+>/g, ' ').replace(dateMatch[0], '');
            const nums = [...cleanText.matchAll(/\b(\d{2})\b/g)].map(m => m[1]);

            // 六合彩有 6 顆正碼 + 1 顆特別號 = 7 顆
            if (nums.length >= 7) {
                history.push({
                    issue: issueStr,
                    date: d,
                    numbers: nums.slice(0, 7)
                });
            }
        });

        if (history.length === 0) throw new Error("新來源無法解析，可能網頁結構改變");

        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        fs.writeFileSync('marksix.json', JSON.stringify({ history }, null, 2));
        console.log(`✅ 六合彩換源成功！最新開獎日期已推進至：${history[0].date}`);
    } catch (e) {
        console.log(`❌ 六合彩換源失敗: ${e.message}`);
    }
}

fetchMarksixData();
