const fs = require('fs');

async function fetchWeiliData() {
    try {
        const now = new Date();
        now.setHours(now.getHours() + 8);
        const currentYear = now.getFullYear();
        
        console.log(`🌐 準備抓取 ${currentYear} 年度 [威力彩] 官方開獎資料...`);
        const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/SuperLotto638Result?period&month=${currentYear}-01&endMonth=${currentYear}-12&pageNum=1&pageSize=50`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
        const data = await response.json();
        
        const rawData = data.content.superLotto638Res;
        const history = rawData.map(item => {
            // 威力彩第一區 6 顆，第二區 1 顆，我們只要第一區的 6 顆
            const nums = item.drawNumberSize.slice(0, 6).map(n => String(n).padStart(2, '0'));
            return { issue: String(item.period), numbers: nums };
        });

        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        
        fs.writeFileSync('weili.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 威力彩資料更新成功！`);
    } catch (error) {
        console.error("💥 抓取威力彩失敗:", error);
        process.exit(1);
    }
}
fetchWeiliData();
