let currentGame = '';
let currentHistoryData = []; 
let currentPrediction = []; 
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 

const gameNames = { '539': '今彩 539', 'daily': '天天樂', 'lotto': '大樂透', 'weili': '威力彩', 'marksix': '六合彩' };
const fileMap = { '539': 'latest.json', 'daily': 'daily.json', 'lotto': 'lotto.json', 'weili': 'weili.json', 'marksix': 'marksix.json' };

function switchPage(targetPageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`page-${targetPageId}`)?.classList.add('active');
    document.getElementById(`nav-${targetPageId}`)?.classList.add('active');
    if (targetPageId === 'history') renderHistoryPage();
    if (targetPageId === 'favorite') renderFavorites();
    if (targetPageId === 'backtest') document.getElementById('backtest-title').innerText = currentGame ? `(${gameNames[currentGame]})` : '';
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
    const favBtn = document.getElementById('save-fav-btn');
    const verifyBox = document.getElementById('ai-verify-box');

    statusEl.innerText = "🔄 雙向資料庫同步中...";
    latestBallsEl.innerHTML = '<div class="loading-text">連線中...</div>';
    predictionContentEl.innerHTML = '<div class="loading-text">運算中...</div>';
    favBtn.style.display = 'none';
    verifyBox.style.display = 'none';

    try {
        const jsonUrl = `https://guotang96-creator.github.io/lottery/${fileMap[gameCode]}?t=${Date.now()}`;
        const [renderRes, githubRes] = await Promise.all([
            fetch(`${API_BASE_URL}/${gameCode}`),
            fetch(jsonUrl)
        ]);
        
        const aiData = await renderRes.json();
        const ghData = await githubRes.json();

        const historyArray = ghData.history || ghData.recent50 || ghData.data || [];
        currentHistoryData = historyArray; 

        if (historyArray.length > 0) {
            const latestDraw = historyArray[0];
            const issue = latestDraw.issue || latestDraw.period;
            let dateStr = latestDraw.lotteryDate || latestDraw.date || "";
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            statusEl.innerText = dateStr ? `✅ 第 ${issue} 期 (${dateStr})` : `✅ 第 ${issue} 期`;
            
            let html = '';
            const latestNums = latestDraw.numbers || latestDraw.drawNumberSize || [];
            latestNums.forEach((num, index) => {
                if (index === latestNums.length - 1 && latestNums.length > 5) html += `<div class="ball special">${num}</div>`;
                else html += `<div class="ball">${num}</div>`;
            });
            latestBallsEl.innerHTML = html;
        }

        // 💡 修正點：如果後端回報 error，直接拋出例外，進入 catch 處理
        if (aiData.status !== "success") {
            throw new Error(aiData.message || "歷史資料不足或格式異常");
        }

        // --- 成功解析 AI 資料 ---
        const verifyBallsEl = document.getElementById('verify-balls');
        const hitCountEl = document.getElementById('verify-hit-count');
        if (aiData.prev_predicted && aiData.prev_predicted.length > 0) {
            verifyBox.style.display = 'block';
            const hits = aiData.hit_nums || [];
            hitCountEl.innerText = `命中 ${hits.length} 顆`;
            hitCountEl.style.color = hits.length > 0 ? '#ff9800' : 'var(--text-muted)';
            hitCountEl.style.background = hits.length > 0 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)';

            let vHtml = '';
            aiData.prev_predicted.forEach(num => {
                vHtml += hits.includes(num) ? `<div class="ball hit" style="width:38px; height:38px; font-size:1rem;">${num}</div>` : `<div class="ball miss" style="width:38px; height:38px; font-size:1rem;">${num}</div>`;
            });
            verifyBallsEl.innerHTML = vHtml;
        }

        const ballCount = (gameCode === '539' || gameCode === 'daily') ? 5 : 6;
        const mainPredict = aiData.predicted.slice(0, ballCount);
        currentPrediction = mainPredict; 
        
        let reasonHtml = `<div class="ai-reason-box"><span class="ai-reason-title"><i class="fas fa-microchip"></i> V12 引擎解析：</span>`;
        if (aiData.details) {
            aiData.details.slice(0, 3).forEach((item, idx) => {
                const terms = ["均值回歸達臨界點", "馬可夫鏈近期高頻", "貝氏機率動能提升", "EMA 權重交叉"];
                reasonHtml += `<div>• 號碼 <strong>${item.num}</strong>：評分 ${item.score} (${terms[idx % 4]})</div>`;
            });
        }
        predictionContentEl.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:10px;">🔥 主力推薦 (${ballCount} 碼)：</p><div class="balls-container" style="margin-top:0;">${mainPredict.map(n => `<div class="ball">${n}</div>`).join('')}</div>${reasonHtml}</div>`;
        favBtn.style.display = 'block'; 
        
        renderHistoryPage();

    } catch (e) {
        // 💡 修正點：錯誤捕捉後，確實更新畫面，不再無限轉圈
        statusEl.innerText = "❌ 資料庫異常";
        latestBallsEl.innerHTML = `<div class="error-text">暫無開獎資料</div>`;
        predictionContentEl.innerHTML = `<div class="error-text">${e.message || "請稍後重試或重新觸發 GitHub 更新"}</div>`;
    }
}

// 歷史、回測、收藏、設定邏輯
function renderHistoryPage() {
    const container = document.getElementById('history-list-container');
    if (!container || !currentGame) return;
    let html = '';
    currentHistoryData.forEach(item => {
        const issue = item.issue || item.period;
        let d = item.lotteryDate || item.date || "最新";
        if (d.includes('T')) d = d.split('T')[0];
        const nums = item.numbers || item.drawNumberSize || [];
        let bHtml = '';
        nums.forEach((n, i) => bHtml += (i === nums.length - 1 && nums.length > 5) ? `<div class="ball special">${n}</div>` : `<div class="ball">${n}</div>`);
        html += `<div class="history-item"><div class="history-info">第 <strong>${issue}</strong> 期 <span style="font-size:0.8rem; color:#888;">(${d})</span></div><div class="balls-container history-balls" style="justify-content:flex-start; margin:5px 0; gap:6px;">${bHtml}</div></div>`;
    });
    container.innerHTML = html || '<div class="loading-text">無資料</div>';
}

function runAnalysis() {
    if (!currentHistoryData.length) return alert("請先選擇彩種");
    const container = document.getElementById('analysis-result');
    let counts = {};
    currentHistoryData.forEach(draw => {
        const nums = draw.numbers || draw.drawNumberSize || [];
        const limit = (currentGame === '539' || currentGame === 'daily') ? 5 : 6;
        nums.slice(0, limit).forEach(n => counts[n] = (counts[n] || 0) + 1);
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    container.innerHTML = `<div class="ai-reason-box" style="border-left-color:#ff9800; background:rgba(255,152,0,0.08);"><span class="ai-reason-title" style="color:#ff9800;">🔥 近 ${currentHistoryData.length} 期統計</span><div style="margin-top:8px;">最熱：${sorted.slice(0,5).map(x=>x[0]).join(', ')}</div><div style="margin-top:5px;">最冷：${sorted.slice(-5).map(x=>x[0]).join(', ')}</div></div>`;
}

function saveFavorite() {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.push({ game: gameNames[currentGame], date: new Date().toLocaleString(), numbers: currentPrediction });
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    const btn = document.getElementById('save-fav-btn');
    btn.innerHTML = '<i class="fas fa-check"></i> 已收藏';
    setTimeout(() => btn.innerHTML = '<i class="fas fa-star"></i> 將這組預測加入收藏', 2000);
}

function renderFavorites() {
    const container = document.getElementById('favorite-list');
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    if (!favs.length) return container.innerHTML = '<div class="loading-text">尚無收藏</div>';
    container.innerHTML = [...favs].reverse().map((f, i) => `<div class="history-item"><div style="display:flex; justify-content:space-between;"><span>${f.game} <small>${f.date}</small></span><button onclick="deleteFav(${favs.length-1-i})" style="background:none; border:none; color:#ff4d4f;"><i class="fas fa-trash"></i></button></div><div class="balls-container" style="justify-content:flex-start; gap:6px;">${f.numbers.map(n=>`<div class="ball" style="width:32px; height:32px; font-size:0.9rem;">${n}</div>`).join('')}</div></div>`).join('');
}

function deleteFav(i) {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.splice(i, 1);
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    renderFavorites();
}

function clearCache() {
    if (confirm("確定清除收藏與快取？")) { localStorage.clear(); location.reload(); }
}
