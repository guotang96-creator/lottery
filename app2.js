let currentGame = '';
let currentHistoryData = []; // 用來存放抓回來的歷史資料
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 

const gameNames = {
    '539': '今彩 539', 'daily': '天天樂', 'lotto': '大樂透', 'weili': '威力彩', 'marksix': '六合彩'
};
const fileMap = { '539': 'latest.json', 'daily': 'daily.json', 'lotto': 'lotto.json', 'weili': 'weili.json', 'marksix': 'marksix.json' };

function switchPage(targetPageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`page-${targetPageId}`)?.classList.add('active');
    document.getElementById(`nav-${targetPageId}`)?.classList.add('active');

    // 💡 當切換到歷史頁面時，立刻畫出歷史表格
    if (targetPageId === 'history') {
        renderHistoryPage();
    }
}

function setGame(gameCode) {
    currentGame = gameCode;
    document.getElementById('current-game-title').innerText = gameNames[gameCode];
    document.getElementById('history-game-title').innerText = `(${gameNames[gameCode]})`;
    
    document.querySelectorAll('.game-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    fetchPrediction(gameCode);
}

async function fetchPrediction(gameCode) {
    if (!gameCode) return;

    const statusEl = document.getElementById('sync-status');
    const latestBallsEl = document.getElementById('latest-balls');
    const predictionContentEl = document.getElementById('prediction-content');

    statusEl.innerText = "🔄 雙向資料庫同步中...";
    latestBallsEl.innerHTML = '<div class="loading-text">連線至 GitHub 數據庫...</div>';
    predictionContentEl.innerHTML = '<div class="loading-text">AI 矩陣運算中...</div>';

    try {
        // 💡 神級並行處理：同時去 Render 算 AI，也去 GitHub 拿包含 7 顆球的真實開獎資料
        const jsonUrl = `https://guotang96-creator.github.io/lottery/${fileMap[gameCode]}?t=${Date.now()}`;
        const [renderRes, githubRes] = await Promise.all([
            fetch(`${API_BASE_URL}/${gameCode}`),
            fetch(jsonUrl)
        ]);

        const aiData = await renderRes.json();
        const ghData = await githubRes.json();

        // 1. 處理 GitHub 抓回來的真實歷史資料
        const historyArray = ghData.history || ghData.recent50 || ghData.data || [];
        currentHistoryData = historyArray; // 存到全域變數給歷史頁面用
        
        if (historyArray.length > 0) {
            const latestDraw = historyArray[0];
            const latestNums = latestDraw.numbers || latestDraw.drawNumberSize || [];
            statusEl.innerText = `✅ 第 ${latestDraw.issue || latestDraw.period} 期`;
            
            // 💡 繪製最新開獎球，並判斷是不是威力彩/大樂透的「第二區/特別號」
            let html = '';
            latestNums.forEach((num, index) => {
                // 如果是最後一顆球，且總球數大於 5 (代表不是 539/天天樂)，就給它紅色的 special 樣式
                if (index === latestNums.length - 1 && latestNums.length > 5) {
                    html += `<div class="ball special">${num}</div>`;
                } else {
                    html += `<div class="ball">${num}</div>`;
                }
            });
            latestBallsEl.innerHTML = html;
        }

        // 2. 處理 Render 算出來的 AI 預測資料 (維持不變)
        if (aiData.status === "success") {
            const mainPredict = aiData.predicted.slice(0, 6);
            predictionContentEl.innerHTML = `
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">🔥 主力推薦區：</p>
                <div class="balls-container" style="margin-top:0;">
                    ${mainPredict.map(num => `<div class="ball">${num}</div>`).join('')}
                </div>
            `;
        }
        
        // 如果此時人剛好停在歷史頁面，順便更新歷史畫面
        renderHistoryPage();

    } catch (error) {
        statusEl.innerText = "❌ 連線失敗";
        latestBallsEl.innerHTML = `<div class="error-text">同步異常</div>`;
        predictionContentEl.innerHTML = `<div class="error-text">請重新整理</div>`;
    }
}

// 💡 專門用來繪製「歷史頁面」的函數
function renderHistoryPage() {
    const container = document.getElementById('history-list-container');
    if (!container) return;

    if (!currentGame || currentHistoryData.length === 0) {
        container.innerHTML = '<div class="loading-text">請先在首頁選擇彩種，並等待資料載入</div>';
        return;
    }

    let html = '';
    currentHistoryData.forEach(item => {
        const issue = item.issue || item.period;
        const date = item.lotteryDate || item.date || "最新";
        const nums = item.numbers || item.drawNumberSize || [];

        let ballsHtml = '';
        nums.forEach((num, index) => {
            if (index === nums.length - 1 && nums.length > 5) {
                ballsHtml += `<div class="ball special">${num}</div>`;
            } else {
                ballsHtml += `<div class="ball">${num}</div>`;
            }
        });

        html += `
            <div class="history-item">
                <div class="history-info">第 <strong>${issue}</strong> 期 (${date})</div>
                <div class="balls-container history-balls" style="justify-content: flex-start; margin: 5px 0;">
                    ${ballsHtml}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
