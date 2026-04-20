const fs = require('fs');

async function fetchLottoData() {
    let allHistory = [];
    const currentYear = new Date().getFullYear();
    
    console.log("🌐 啟動大樂透十年大數據掃描...");
    
    for (let year = currentYear; year >= currentYear - 10; year--) {
        try {
            // 大樂透 API 節點與資料陣列名稱
            const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/Lotto649Result?period&month=${year}-01&endMonth=${year}-12&pageNum=1&pageSize=150`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data && data.content && data.content.lotto649Res) {
                const yearlyData = data.content.lotto649Res.map(item => {
                    // 大樂透有 6 個正碼 + 1 個特別號，共抓取 7 碼
                    const nums = item.drawNumberSize.slice(0, 7).map(n => String(n).padStart(2, '0'));
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

    allHistory.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
    
    // 寫入 lotto.json
    fs.writeFileSync('lotto.json', JSON.stringify({ history: allHistory }, null, 2), 'utf8');
    console.log(`🎉 大樂透十年終極資料庫建置完成！總共集結了 ${allHistory.length} 筆大數據！`);
}

fetchLottoData();
