let currentGame = '';
let currentHistoryData = []; 
let currentPrediction = []; 
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 

const gameNames = { '539': '今彩 539', 'daily': '天天樂', 'lotto': '大樂透', 'weili': '威力彩', 'marksix': '六合彩' };
const fileMap = { '539': 'latest.json', 'daily': 'daily.json', 'lotto': 'lotto.json', 'weili': 'weili.json', 'marksix': 'marksix.json' };

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
    document.getElementById('current-game-title').innerText = gameNames[g];
    document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    fetchPrediction(g);
}

async function fetchPrediction(g) {
    const sEl = document.getElementById('sync-status');
    const lBalls = document.getElementById('latest-balls');
    const pContent = document.getElementById('prediction-content');
    const vBox = document.getElementById('ai-verify-box');

    sEl.innerText = "⏳ 數據同步中...";
    vBox.style.display = 'none';

    try {
        const [rRes, gRes] = await Promise.all([
            fetch(`${API_BASE_URL}/${g}`),
            fetch(`https://guotang96-creator.github.io/lottery/${fileMap[g]}?t=${Date.now()}`)
        ]);
        const ai = await rRes.json();
        const gh = await gRes.json();

        currentHistoryData = gh.history || gh.recent50 || [];
        const latest = currentHistoryData[0];
        const dStr = (latest.date || latest.lotteryDate || "").split('T')[0];
        sEl.innerText = `✅ 第 ${latest.issue} 期 (${dStr})`;

        const nums = latest.numbers || latest.drawNumberSize || [];
        lBalls.innerHTML = nums.map((n, i) => `<div class="ball ${i===nums.length-1&&nums.length>5?'special':''}">${n}</div>`).join('');

        if (ai.status === "success") {
            if (ai.prev_predicted && ai.prev_predicted.length > 0) {
                vBox.style.display = 'block';
                const hits = ai.hit_nums || [];
                document.getElementById('verify-hit-count').innerText = `命中 ${hits.length} 顆`;
                document.getElementById('verify-balls').innerHTML = ai.prev_predicted.map(n => `<div class="ball ${hits.includes(n)?'hit':'miss'}">${n}</div>`).join('');
            }
            const ballCount = (g === '539' || g === 'daily') ? 5 : 6;
            currentPrediction = ai.predicted.slice(0, ballCount);
            pContent.innerHTML = `<div class="ai-reason-box"><p>🔥 最新主力推薦 (${ballCount} 碼)：</p><div class="balls-container">${currentPrediction.map(n=>`<div class="ball">${n}</div>`).join('')}</div></div>`;
            document.getElementById('save-fav-btn').style.display = 'block';
        }
    } catch (e) { sEl.innerText = "❌ 連線異常"; }
}

function runAnalysis() {
    const container = document.getElementById('analysis-result');
    if(!currentHistoryData.length) return alert("請先選擇彩種");
    let odd = 0, big = 0, counts = {};
    const threshold = (currentGame === '539' || currentGame === 'daily') ? 20 : 25;
    
    currentHistoryData.forEach(d => {
        const nums = (d.numbers || d.drawNumberSize || []).map(Number);
        nums.forEach(n => {
            if(n % 2 !== 0) odd++;
            if(n >= threshold) big++;
            counts[n] = (counts[n] || 0) + 1;
        });
    });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    container.innerHTML = `
        <div class="ai-reason-box">
            📊 10 年大數據深度統計：<br>
            • 樣本期數：${currentHistoryData.length} 期<br>
            • 單數比例：${(odd/(currentHistoryData.length*5)*100).toFixed(1)}%<br>
            • 大號比例：${(big/(currentHistoryData.length*5)*100).toFixed(1)}%<br>
            • 歷史最熱：${sorted.slice(0,5).map(x=>x[0]).join(', ')}<br>
            • 歷史最冷：${sorted.slice(-5).map(x=>x[0]).join(', ')}
        </div>`;
}

function saveFavorite() {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.push({ g: gameNames[currentGame], d: new Date().toLocaleString(), n: currentPrediction });
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    alert("已成功加入收藏！");
}

function renderHistory() {
    const container = document.getElementById('history-list-container');
    container.innerHTML = currentHistoryData.slice(0, 50).map(d => `
        <div class="history-item">
            第 ${d.issue} 期 (${(d.date||"").split('T')[0]})
            <div class="balls-container">${(d.numbers||[]).map(n=>`<div class="ball">${n}</div>`).join('')}</div>
        </div>`).join('');
}

function renderFavorites() {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    document.getElementById('favorite-list').innerHTML = favs.reverse().map((f, idx) => `
        <div class="history-item">
            <div style="display:flex; justify-content:space-between;">
                <span>${f.g} (${f.d})</span>
                <button onclick="deleteFav(${favs.length-1-idx})" style="background:none; border:none; color:#ff4d4f;"><i class="fas fa-trash"></i></button>
            </div>
            <div class="balls-container">${f.n.map(n=>`<div class="ball">${n}</div>`).join('')}</div>
        </div>`).join('');
}

function deleteFav(idx) {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.splice(idx, 1);
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    renderFavorites();
}

function clearCache() {
    if (confirm("⚠️ 確定要清除系統快取嗎？\n這將會刪除您所有『收藏的號碼』並重新載入網頁。")) {
        localStorage.clear();
        alert("✅ 快取已清除！系統即將重新啟動。");
        location.reload();
    }
}
