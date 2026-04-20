const fs = require('fs');

async function fetch539Data() {
    let allHistory = [];
    const currentYear = new Date().getFullYear();
    
    console.log("🌐 啟動 539 十年大數據掃描...");
    
    // 從今年開始，一年一年往前抓 (抓過去 10 年)
    for (let year = currentYear; year >= currentYear - 10; year--) {
        try {
            const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/Daily539Result?period&month=${year}-01&endMonth=${year}-12&pageNum=1&pageSize=350`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data && data.content && data.content.daily539Res) {
                const yearlyData = data.content.daily539Res.map(item => {
                    const nums = item.drawNumberSize.slice(0, 5).map(n => String(n).padStart(2, '0'));
                    const d = item.lotteryDate ? item.lotteryDate.split('T')[0] : "";
                    return { issue: String(item.period), date: d, numbers: nums };
                });
                allHistory = allHistory.concat(yearlyData);
                console.log(`✅ ${year} 年資料抓取成功 (${yearlyData.length} 筆)`);
            }
        } catch (e) {
            console.log(`❌ ${year} 年資料抓取失敗: ${e.message}`);
        }
    }

    // 將 10 年的資料依照期數從大到小排好
    allHistory.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
    
    // 寫入 latest.json
    fs.writeFileSync('latest.json', JSON.stringify({ history: allHistory }, null, 2), 'utf8');
    console.log(`🎉 539 十年終極資料庫建置完成！總共集結了 ${allHistory.length} 筆大數據！`);
}

fetch539Data();
