const fs = require('fs');
async function fetchWeiliData() {
    try {
        const now = new Date(); now.setHours(now.getHours() + 8);
        const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/SuperLotto638Result?period&month=${now.getFullYear()}-01&endMonth=${now.getFullYear()}-12&pageNum=1&pageSize=50`;
        const data = await (await fetch(url)).json();
        
        const history = data.content.superLotto638Res.map(item => {
            // 💡 改成 slice(0, 7) 把第二區也抓進來！
            const nums = item.drawNumberSize.slice(0, 7).map(n => String(n).padStart(2, '0'));
            return { issue: String(item.period), numbers: nums };
        }).sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        
        fs.writeFileSync('weili.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 威力彩抓取成功！`);
    } catch (error) { process.exit(1); }
}
fetchWeiliData();
