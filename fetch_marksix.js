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
                const ballsRegex = /(?<!\d)(0[1-9]|[1-4][0-9])(?!\d)/g;
                const balls = []; let bMatch;
                while ((bMatch = ballsRegex.exec(block)) !== null) {
                    if (!balls.includes(bMatch[1])) {
                        balls.push(bMatch[1]);
                        if (balls.length === 7) break; // 💡 改成 7 顆 (包含特別號)
                    }
                }
                if (balls.length === 7) history.push({ issue: periodMatch[1], numbers: balls });
            }
        }
        fs.writeFileSync('marksix.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 六合彩抓取成功！`);
    } catch (error) { process.exit(1); }
}
fetchMarksixData();
