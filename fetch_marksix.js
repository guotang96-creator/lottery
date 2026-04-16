const fs = require('fs');
async function fetchMarksixData() {
    try {
        const text = await (await fetch("https://www.lotto-8.com/listltomk.asp", {headers: {"User-Agent": "Mozilla/5.0"}})).text();
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let match, history = [];
        
        while ((match = trRegex.exec(text)) !== null) {
            const block = match[1];
            if (block.includes('202') && (block.toLowerCase().includes('balls') || block.includes('號碼'))) {
                const periodMatch = block.match(/(202\d{4})/);
                if (!periodMatch) continue;
                
                // 💡 新增：用正則表達式找出網頁中的日期 (例如 2024/04/16)
                const dateMatch = block.match(/202\d[-/]\d{1,2}[-/]\d{1,2}/);
                const dateStr = dateMatch ? dateMatch[0].replace(/\//g, '-') : "";

                const ballsRegex = /(?<!\d)(0[1-9]|[1-4][0-9])(?!\d)/g;
                const balls = []; let bMatch;
                while ((bMatch = ballsRegex.exec(block)) !== null) {
                    if (!balls.includes(bMatch[1])) {
                        balls.push(bMatch[1]);
                        if (balls.length === 7) break;
                    }
                }
                // 把 date 存進 JSON 裡
                if (balls.length === 7) history.push({ issue: periodMatch[1], date: dateStr, numbers: balls });
            }
        }
        fs.writeFileSync('marksix.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 六合彩抓取成功！`);
    } catch (error) { process.exit(1); }
}
fetchMarksixData();
