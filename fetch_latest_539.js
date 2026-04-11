const fs = require('fs');
const path = require('path');

async function fetch539Data() {
    try {
        // 💡 升級1：動態取得「當前年份」，徹底解除跨年當機的未爆彈
        const now = new Date();
        // 加上 8 小時轉換為台灣時間 (UTC+8)，避免跨年交界那一晚產生時差 Bug
        now.setHours(now.getHours() + 8);
        const currentYear = now.getFullYear();
        
        console.log(`🌐 準備抓取 ${currentYear} 年度 539 官方開獎資料...`);

        // 💡 升級2：網址動態帶入 currentYear
        const url = `https://api.taiwanlottery.com/TLCAPIWEB/Lottery/Daily539Result?period&month=${currentYear}-01&endMonth=${currentYear}-12&pageNum=1&pageSize=500`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
        
        const data = await response.json();
        
        if (!data.content || !data.content.daily539Res) {
            throw new Error("台灣彩券 API 回傳格式異常或無資料");
        }

        const rawData = data.content.daily539Res;
        
        // 整理資料格式
        const history = rawData.map(item => ({
            period: item.period,
            lotteryDate: item.lotteryDate.split('T')[0], // 裁切時間，只保留 YYYY-MM-DD
            drawNumberSize: item.drawNumberSize
        }));

        // 確保依照期數由大到小排序 (最新期數排在最上面)
        history.sort((a, b) => parseInt(b.period) - parseInt(a.period));

        // 💡 升級3：產生完美的台灣時間 updatedAt，讓前端顯示不會錯亂
        const taiwanTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

        const output = {
            daily_latest: history[0], // 最新一期 (統一名稱，與天天樂對齊)
            history: history.slice(0, 500), // 精準擷取近 500 期給 AI 當大數據庫
            updatedAt: taiwanTime.toISOString()
        };

        // 寫入主要的 latest.json
        fs.writeFileSync('latest.json', JSON.stringify(output, null, 2), 'utf8');
        console.log(`✅ 539 資料更新成功！共寫入 ${output.history.length} 期。最後更新時間(台灣): ${taiwanTime.toISOString()}`);

        // 防呆機制：如果專案裡有 docs 資料夾，也順便寫一份進去
        if (fs.existsSync('docs')) {
            fs.writeFileSync(path.join('docs', 'latest.json'), JSON.stringify(output, null, 2), 'utf8');
            console.log(`✅ docs/latest.json 備用檔案同步更新成功！`);
        }

    } catch (error) {
        console.error("💥 抓取 539 資料時發生嚴重錯誤:", error);
        process.exit(1); // 讓 GitHub Actions 知道這次任務失敗
    }
}

fetch539Data();
