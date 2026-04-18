const fs = require('fs');

async function fetch539Data() {
    let allHistory = [];
    const currentYear = new Date().getFullYear();
    console.log("🌐 開始抓取 539 十年大數據...");
    for (let year = currentYear; year >= currentYear - 10; year--) {
        try {
            const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/Daily539Result?period&month=${year}-01&endMonth=${year}-12&pageNum=1&pageSize=350`;
            const data = await (await fetch(url)).json();
            if (data && data.content && data.content.daily539Res) {
                const yearly = data.content.daily539Res.map(item => ({
                    issue: String(item.period),
                    date: item.lotteryDate.split('T')[0],
                    numbers: item.drawNumberSize.slice(0, 5).map(n => String(n).padStart(2, '0'))
                }));
                allHistory = allHistory.concat(yearly);
                console.log(`✅ ${year} 年資料成功 (${yearly.length} 筆)`);
            }
        } catch (e) {}
    }
    allHistory.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
    fs.writeFileSync('latest.json', JSON.stringify({ history: allHistory }, null, 2), 'utf8');
}
fetch539Data();
