let currentGame = '';
let currentHistoryData = [];
let currentPrediction = [];

// [V14 黃金權重參數]
const V14_WEIGHTS = { MEAN: 60, EMA: 0, MARKOV: 80, PENALTY: -15 };

function switchPage(pId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`page-${pId}`).classList.add('active');
    document.getElementById(`nav-${pId}`).classList.add('active');
    if(pId === 'history') renderHistory();
    if(pId === 'favorite') renderFavorites();
}

function setGame(g) {
    currentGame = g;
    const names = { '539':'今彩 539', 'daily':'天天樂', 'lotto':'大樂透', 'weili':'威力彩', 'marksix':'六合彩' };
    document.getElementById('current-game-title').innerText = names[g];
    document.querySelectorAll('.game-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.includes(names[g].slice(-3))) b.classList.add('active');
    });
    loadData(g);
}

async function loadData(g) {
    const files = { '539':'latest.json', 'daily':'daily.json', 'lotto':'lotto.json', 'weili':'weili.json', 'marksix':'marksix.json' };
    const sEl = document.getElementById('sync-status');
    sEl.innerText = "⏳ 運算中...";
    
    try {
        const res = await fetch(`https://guotang96-creator.github.io/lottery/${files[g]}?t=${Date.now()}`);
        const data = await res.json();
        currentHistoryData = data.history || [];
        const latest = currentHistoryData[0];
        sEl.innerText = `✅ 第 ${latest.issue} 期 (${latest.date})`;
        
        document.getElementById('latest-balls').innerHTML = latest.numbers.map(n => `<div class="ball">${n}</div>`).join('');
        
        // 執行 V14 AI 預測運算
        runV14AI();
    } catch (e) { sEl.innerText = "❌ 讀取失敗"; }
}

function runV14AI() {
    if(currentHistoryData.length < 50) return;
    const maxNum = (currentGame==='539'||currentGame==='daily') ? 39 : 49;
    const pickCount = (currentGame==='539'||currentGame==='daily') ? 5 : 6;
    let scores = {};
    for(let n=1; n<=maxNum; n++) scores[String(n).padStart(2, '0')] = 0;

    // 1. 均值回歸 (權重 60)
    const last30 = currentHistoryData.slice(0, 30);
    let counts = {};
    last30.forEach(d => d.numbers.forEach(n => counts[n] = (counts[n]||0)+1));
    Object.keys(scores).forEach(n => scores[n] += (10 - (counts[n]||0)) * (V14_WEIGHTS.MEAN/100));

    // 2. EMA 動能 (權重 0) - V14 已實證歸零，維持邏輯但不加分
    
    // 3. 馬可夫鏈 (權重 80)
    const lastNums = currentHistoryData[0].numbers;
    currentHistoryData.slice(1, 100).forEach((d, idx, arr) => {
        let intersect = d.numbers.filter(n => lastNums.includes(n));
        if(intersect.length > 0 && idx > 0) {
            arr[idx-1].numbers.forEach(n => { if(scores[n]!==undefined) scores[n] += intersect.length * 5 * (V14_WEIGHTS.MARKOV/100); });
        }
    });

    // 4. 連莊懲罰
    lastNums.forEach(n => { if(scores[n]!==undefined) scores[n] += V14_WEIGHTS.PENALTY; });

    currentPrediction = Object.keys(scores).sort((a,b)=>scores[b]-scores[a]).slice(0, pickCount);
    
    document.getElementById('prediction-content').innerHTML = `
        <div class="ai-reason-box">
            <p>🎯 V14 推薦號碼：</p>
            <div class="balls-container">${currentPrediction.map(n=>`<div class="ball hit">${n}</div>`).join('')}</div>
            <p style="font-size:0.7rem; color:gray; margin-top:10px;">策略：均值(60) + 拖牌(80) / 動能(0)</p>
        </div>`;
    document.getElementById('save-fav-btn').style.display = 'block';
}

function saveFavorite() {
    let favs = JSON.parse(localStorage.getItem('lottery_favs')||'[]');
    favs.push({ game: currentGame, date: new Date().toLocaleString(), nums: currentPrediction });
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    alert("已加入收藏！");
}

function clearCache() {
    if(confirm("確定要清除所有快取與收藏嗎？")) { localStorage.clear(); location.reload(); }
}

function renderHistory() {
    document.getElementById('history-list-container').innerHTML = currentHistoryData.slice(0, 50).map(d => `
        <div class="history-item">
            <div style="font-size:0.8rem; margin-bottom:5px;">第 ${d.issue} 期 (${d.date})</div>
            <div class="balls-container">${d.numbers.map(n=>`<div class="ball">${n}</div>`).join('')}</div>
        </div>`).join('');
}
