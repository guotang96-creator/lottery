const fs = require('fs');

async function fetchMarksixData() {
    try {
        console.log(`🌐 準備抓取 [六合彩] 樂透研究院資料...`);
        const url = "https://www.lotto-8.com/listltomk.asp";
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const text = await response.text();
        
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let match;
        const history = [];
        
        while ((match = trRegex.exec(text)) !== null) {
            const block = match[1];
            if (block.includes('202') && (block.toLowerCase().includes('balls') || block.includes('號碼'))) {
                const periodMatch = block.match(/(202\d{4})/);
                if (!periodMatch) continue;
                
                const period = periodMatch[1];
                const ballsRegex = /(?<!\d)(0[1-9]|[1-4][0-9])(?!\d)/g;
                const balls = [];
                let bMatch;
                
                while ((bMatch = ballsRegex.exec(block)) !== null) {
                    if (!balls.includes(bMatch[1])) {
                        balls.push(bMatch[1]);
                        if (balls.length === 6) break; // 只要前 6 顆主支
                    }
                }
                
                if (balls.length === 6) {
                    history.push({ issue: period, numbers: balls });
                }
            }
        }
        
        fs.writeFileSync('marksix.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 六合彩資料更新成功！`);
    } catch (error) {
        console.error("💥 抓取六合彩失敗:", error);
        process.exit(1);
    }
}
fetchMarksixData();
