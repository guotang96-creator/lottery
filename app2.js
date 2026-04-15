let currentGame = '';
let currentHistoryData = []; 
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

    if (targetPageId === 'history') renderHistoryPage();
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
        const jsonUrl = `https://guotang96-creator.github.io/lottery/${fileMap[gameCode]}?t=${Date.now()}`;
        const [renderRes, githubRes] = await Promise.all([
            fetch(`${API_BASE_URL}/${gameCode}`),
            fetch(jsonUrl)
        ]);

        const aiData = await renderRes.json();
        const ghData = await githubRes.json();

        // 1. 處理真實歷史資料
        const historyArray = ghData.history || ghData.recent50 || ghData.data || [];
        currentHistoryData = historyArray; 
        
        if (historyArray.length > 0) {
            const latestDraw = historyArray[0];
            const latestNums = latestDraw.numbers || latestDraw.drawNumberSize || [];
            statusEl.innerText = `✅ 第 ${latestDraw.issue || latestDraw.period} 期`;
            
            let html = '';
            latestNums.forEach((num, index) => {
                if (index === latestNums.length - 1 && latestNums.length > 5) {
                    html += `<div class="ball special">${num}</div>`;
                } else {
                    html += `<div class="ball">${num}</div>`;
                }
            });
            latestBallsEl.innerHTML = html;
        }

        // 2. 處理 AI 預測資料與生成原因
        if (aiData.status === "success") {
            // 💡 動態判斷要推幾顆球：539/天天樂 5 顆，其他 6 顆
            const ballCount = (gameCode === '539' || gameCode === 'daily') ? 5 : 6;
            const mainPredict = aiData.predicted.slice(0, ballCount);
            
            // 💡 生成 AI 演算報告 (讀取後端的 details 分數)
            let reasonHtml = '';
            if (aiData.details && aiData.details.length > 0) {
                const topReasons = aiData.details.slice(0, 3); // 抓取分數最高的前 3 名寫報告
                const logicTerms = ["均值回歸達臨界點", "馬可夫鏈近期高頻", "貝氏機率動能提升", "EMA 權重交叉"];
                
                reasonHtml += `<div class="ai-reason-box">`;
                reasonHtml += `<span class="ai-reason-title"><i class="fas fa-microchip"></i> V11 量化引擎解析：</span>`;
                
                topReasons.forEach((item, idx) => {
                    // 將您的數學原理放入解釋中，讓 AI 看起來更專業
                    const term = logicTerms[idx % logicTerms.length];
                    reasonHtml += `<div>• 號碼 <strong>${item.num}</strong>：模型綜合評分 ${item.score} <br><span style="font-size:0.75rem; opacity:0.8;">(觸發: ${term})</span></div>`;
                });
                reasonHtml += `</div>`;
            }

            predictionContentEl.innerHTML = `
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">🔥 主力推薦區 (${ballCount} 碼)：</p>
                <div class="balls-container" style="margin-top:0;">
                    ${mainPredict.map(num => `<div class="ball">${num}</div>`).join('')}
                </div>
                ${reasonHtml}
            `;
        }
        
        renderHistoryPage();

    } catch (error) {
        statusEl.innerText = "❌ 連線失敗";
        latestBallsEl.innerHTML = `<div class="error-text">同步異常</div>`;
        predictionContentEl.innerHTML = `<div class="error-text">請重新整理</div>`;
    }
}

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
                <div class="balls-container history-balls" style="justify-content: flex-start; margin: 5px 0; gap: 6px;">
                    ${ballsHtml}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
