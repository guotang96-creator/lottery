const fs = require('fs');

async function fetchWeiliData() {
    try {
        const now = new Date(); now.setHours(now.getHours() + 8);
        // 💡 pageSize=200 讓台彩 API 吐出一整年的資料
        const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/SuperLotto638Result?period&month=${now.getFullYear()}-01&endMonth=${now.getFullYear()}-12&pageNum=1&pageSize=200`;
        const data = await (await fetch(url)).json();
        
        const history = data.content.superLotto638Res.map(item => {
            const nums = item.drawNumberSize.slice(0, 7).map(n => String(n).padStart(2, '0'));
            const d = item.lotteryDate ? item.lotteryDate.split('T')[0] : "";
            return { issue: String(item.period), date: d, numbers: nums };
        }).sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        
        // 💡 擴充至 150 期
        fs.writeFileSync('weili.json', JSON.stringify({ history: history.slice(0, 150) }, null, 2), 'utf8');
        console.log(`✅ 威力彩抓取成功！(已擴充至 150 期)`);
    } catch (error) { process.exit(1); }
}
fetchWeiliData();
