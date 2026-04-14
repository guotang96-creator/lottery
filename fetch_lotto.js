const fs = require('fs');
async function fetchLottoData() {
    try {
        const now = new Date(); now.setHours(now.getHours() + 8);
        const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/Lotto649Result?period&month=${now.getFullYear()}-01&endMonth=${now.getFullYear()}-12&pageNum=1&pageSize=50`;
        const data = await (await fetch(url)).json();
        
        const history = data.content.lotto649Res.map(item => {
            // 💡 改成 slice(0, 7) 抓取特別號！
            const nums = item.drawNumberSize.slice(0, 7).map(n => String(n).padStart(2, '0'));
            return { issue: String(item.period), numbers: nums };
        }).sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        
        fs.writeFileSync('lotto.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 大樂透抓取成功！`);
    } catch (error) { process.exit(1); }
}
fetchLottoData();
