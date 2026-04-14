const fs = require('fs');

async function fetchLottoData() {
    try {
        const now = new Date();
        now.setHours(now.getHours() + 8);
        const currentYear = now.getFullYear();
        
        console.log(`🌐 準備抓取 ${currentYear} 年度 [大樂透] 官方開獎資料...`);
        const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/Lotto649Result?period&month=${currentYear}-01&endMonth=${currentYear}-12&pageNum=1&pageSize=50`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
        const data = await response.json();
        
        const rawData = data.content.lotto649Res;
        const history = rawData.map(item => {
            // 大樂透抽出 6 顆主支 + 1 顆特別號，我們只要前 6 顆，並補零成 "07" 格式
            const nums = item.drawNumberSize.slice(0, 6).map(n => String(n).padStart(2, '0'));
            return { issue: String(item.period), numbers: nums };
        });

        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        
        // 寫入檔案 (只取近 50 期給 AI 算矩陣即可)
        fs.writeFileSync('lotto.json', JSON.stringify({ history: history.slice(0, 50) }, null, 2), 'utf8');
        console.log(`✅ 大樂透資料更新成功！`);
    } catch (error) {
        console.error("💥 抓取大樂透失敗:", error);
        process.exit(1);
    }
}
fetchLottoData();
