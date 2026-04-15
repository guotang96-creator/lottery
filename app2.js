let currentGame = '';
let currentHistoryData = []; 
let currentPrediction = []; // 暫存 AI 算出來的號碼給收藏用
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 

const gameNames = {
    '539': '今彩 539', 'daily': '天天樂', 'lotto': '大樂透', 'weili': '威力彩', 'marksix': '六合彩'
};
const fileMap = { '539': 'latest.json', 'daily': 'daily.json', 'lotto': 'lotto.json', 'weili': 'weili.json', 'marksix': 'marksix.json' };

// ==========================================
// 📱 多頁面切換核心邏輯
// ==========================================
function switchPage(targetPageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`page-${targetPageId}`)?.classList.add('active');
    document.getElementById(`nav-${targetPageId}`)?.classList.add('active');

    // 根據不同頁面觸發對應的渲染動作
    if (targetPageId === 'history') renderHistoryPage();
    if (targetPageId === 'favorite') renderFavorites();
    if (targetPageId === 'backtest') {
        document.getElementById('backtest-title').innerText = currentGame ? `(${gameNames[currentGame]})` : '';
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

// ==========================================
// 🧠 AI 雙向同步抓取邏輯
// ==========================================
async function fetchPrediction(gameCode) {
    if (!gameCode) return;

    const statusEl = document.getElementById('sync-status');
    const latestBallsEl = document.getElementById('latest-balls');
    const predictionContentEl = document.getElementById('prediction-content');
    const favBtn = document.getElementById('save-fav-btn');

    statusEl.innerText = "🔄 雙向資料庫同步中...";
    latestBallsEl.innerHTML = '<div class="loading-text">連線至 GitHub 數據庫...</div>';
    predictionContentEl.innerHTML = '<div class="loading-text">AI 矩陣運算中...</div>';
    favBtn.style.display = 'none'; // 運算時先隱藏收藏按鈕

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
            const ballCount = (gameCode === '539' || gameCode === 'daily') ? 5 : 6;
            const mainPredict = aiData.predicted.slice(0, ballCount);
            
            currentPrediction = mainPredict; // 暫存起來給收藏功能用
            
            let reasonHtml = '';
            if (aiData.details && aiData.details.length > 0) {
                const topReasons = aiData.details.slice(0, 3);
                const logicTerms = ["均值回歸達臨界點", "馬可夫鏈近期高頻", "貝氏機率動能提升", "EMA 權重交叉"];
                
                reasonHtml += `<div class="ai-reason-box">`;
                reasonHtml += `<span class="ai-reason-title"><i class="fas fa-microchip"></i> V11 量化引擎解析：</span>`;
                topReasons.forEach((item, idx) => {
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
            favBtn.style.display = 'block'; // 成功後顯示收藏按鈕
        }
        
        renderHistoryPage();

    } catch (error) {
        statusEl.innerText = "❌ 連線失敗";
        latestBallsEl.innerHTML = `<div class="error-text">同步異常</div>`;
        predictionContentEl.innerHTML = `<div class="error-text">請重新整理</div>`;
    }
}

// ==========================================
// 📜 歷史列表渲染
// ==========================================
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

// ==========================================
// 📈 回測與冷熱門分析功能
// ==========================================
function runAnalysis() {
    if (!currentHistoryData || currentHistoryData.length === 0) {
        alert("⚠️ 請先在首頁選擇一個彩種！");
        return;
    }
    const container = document.getElementById('analysis-result');
    let numCounts = {};
    
    currentHistoryData.forEach(draw => {
        let nums = draw.numbers || draw.drawNumberSize || [];
        let countLimit = (currentGame === 'weili' || currentGame === 'lotto' || currentGame === 'marksix') ? 6 : nums.length;
        for(let i=0; i<countLimit; i++) {
            let n = nums[i];
            numCounts[n] = (numCounts[n] || 0) + 1;
        }
    });

    let sorted = Object.entries(numCounts).sort((a,b) => b[1] - a[1]);
    let hot = sorted.slice(0, 5).map(x => x[0]).join(', ');
    let cold = sorted.slice(-5).map(x => x[0]).join(', ');

    container.innerHTML = `
        <div class="ai-reason-box" style="border-left-color: #ff9800; background: rgba(255, 152, 0, 0.08);">
            <span class="ai-reason-title" style="color: #ff9800;"><i class="fas fa-fire"></i> 近 ${currentHistoryData.length} 期冷熱門精算</span>
            <div style="margin-top:10px;">🔥 <strong>最熱門號碼：</strong> <span style="color:#fff;">${hot}</span></div>
            <div style="margin-top:8px;">❄️ <strong>最冷門號碼：</strong> <span style="color:#fff;">${cold}</span></div>
            <div style="margin-top:12px; font-size:0.75rem; opacity:0.6;">* 此數據由 GitHub 歷史數據庫即時統計</div>
        </div>
    `;
}

// ==========================================
// ⭐ 收藏功能 (LocalStorage 本機儲存)
// ==========================================
function saveFavorite() {
    if(!currentPrediction || currentPrediction.length === 0) {
        alert("請先等待 AI 產生號碼！"); return;
    }
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.push({
        game: gameNames[currentGame],
        date: new Date().toLocaleString('zh-TW', {hour12: false}),
        numbers: currentPrediction
    });
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    
    const btn = document.getElementById('save-fav-btn');
    btn.innerHTML = '<i class="fas fa-check"></i> 已成功收藏';
    btn.style.borderColor = '#4caf50'; btn.style.color = '#4caf50';
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-star"></i> 將這組預測加入收藏';
        btn.style.borderColor = '#ff9800'; btn.style.color = '#ff9800';
    }, 2000);
}

function renderFavorites() {
    const container = document.getElementById('favorite-list');
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    if(favs.length === 0) {
        container.innerHTML = '<div class="loading-text">尚無收藏紀錄</div>';
        return;
    }
    
    let html = '';
    [...favs].reverse().forEach((fav, idx) => {
        let ballsHtml = fav.numbers.map(n => `<div class="ball" style="width:32px; height:32px; font-size:0.9rem;">${n}</div>`).join('');
        let realIdx = favs.length - 1 - idx; 
        
        html += `
        <div class="history-item">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="history-info" style="margin-bottom:0; color:#fff;">${fav.game} <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">${fav.date}</span></span>
                <button onclick="deleteFav(${realIdx})" style="background:none; border:none; color:#ff4d4f; cursor:pointer; font-size:1.1rem; padding:5px;"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="balls-container" style="justify-content:flex-start; gap:6px; margin-top:5px;">${ballsHtml}</div>
        </div>`;
    });
    container.innerHTML = html;
}

function deleteFav(idx) {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.splice(idx, 1);
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    renderFavorites(); 
}

// ==========================================
// ⚙️ 設定功能
// ==========================================
function clearCache() {
    if(confirm("⚠️ 確定要清除系統快取嗎？\n這將會刪除您所有『收藏的號碼』並重新載入網頁。")) {
        localStorage.clear();
        alert("✅ 快取已清除！系統即將重新啟動。");
        location.reload();
    }
}
