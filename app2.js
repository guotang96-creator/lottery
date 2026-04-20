// PWA 註冊
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
}

let currentGame = '';
let currentHistoryData = []; 
let currentPrediction = []; 

const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 
const V14_WEIGHTS = { MEAN: 60, EMA: 0, MARKOV: 80, PENALTY: -15 };

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
    document.querySelectorAll('.game-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.includes(gameNames[g].replace('今彩 ', ''))) b.classList.add('active');
    });
    loadData(g);
}

async function loadData(g) {
    const sEl = document.getElementById('sync-status');
    const lBalls = document.getElementById('latest-balls');
    const lBallsSpec = document.getElementById('latest-balls-special'); 
    const pContent = document.getElementById('prediction-content');
    const vBox = document.getElementById('ai-verify-box');

    sEl.innerText = "⏳ 數據同步中...";
    lBalls.innerHTML = '';
    lBallsSpec.innerHTML = '';
    pContent.innerHTML = '';
    vBox.style.display = 'none';

    try {
        const gRes = await fetch(`https://guotang96-creator.github.io/lottery/${fileMap[g]}?t=${Date.now()}`);
        const gh = await gRes.json();
        
        currentHistoryData = gh.history || gh.recent50 || [];
        if (currentHistoryData.length === 0) throw new Error("無歷史數據");

        const latest = currentHistoryData[0];
        const dStr = (latest.date || latest.lotteryDate || "").split('T')[0];
        
        // 💡 修復 1：無期數防呆 (天天樂 undefined 問題)
        const issueStr = latest.issue ? `第 ${latest.issue} 期 ` : "";
        sEl.innerText = `✅ ${issueStr}(${dStr})`;

        const nums = latest.numbers || latest.drawNumberSize || [];
        
        if (g === 'weili') {
            const mainNums = nums.slice(0, 6);
            const specialNum = nums[6];
            lBalls.innerHTML = mainNums.map(n => `<div class="ball">${n}</div>`).join('');
            if(specialNum) lBallsSpec.innerHTML = `<div class="ball special-weili">${specialNum}</div>`;
        } else {
            lBalls.innerHTML = nums.map(n => `<div class="ball">${n}</div>`).join('');
        }

        try {
            const rRes = await fetch(`${API_BASE_URL}/${g}`);
            const ai = await rRes.json();
            if (ai.status === "success" && ai.prev_predicted && ai.prev_predicted.length > 0) {
                vBox.style.display = 'block'; 
                const hits = ai.hit_nums || [];
                document.getElementById('verify-hit-count').innerText = `命中 ${hits.length} 顆`;
                document.getElementById('verify-balls').innerHTML = ai.prev_predicted.map(n => `<div class="ball ${hits.includes(n)?'hit':'miss'}">${n}</div>`).join('');
            }
        } catch (err) { console.log("略過 Render 對獎"); }

        runV14AI();

    } catch (e) { 
        sEl.innerText = "❌ 讀取失敗"; 
        lBalls.innerHTML = '<div style="color:#ff4d4f; font-size:1.2rem; display:flex; align-items:center; gap:8px;"><i class="fas fa-exclamation-triangle"></i> 資料庫載入異常</div>';
    }
}

function runV14AI() {
    // 💡 修復 2：放寬限制，拯救六合彩 (只要大於 15 期就允許運算)
    if(currentHistoryData.length < 15) return; 

    // 💡 修復 3-1：精準設定威力彩的號碼池上限 (第一區只到 38)
    const maxNum = (currentGame==='539'||currentGame==='daily') ? 39 : (currentGame==='weili' ? 38 : 49);
    const pickCount = (currentGame==='539'||currentGame==='daily') ? 5 : 6;
    
    let scores = {};
    for(let n=1; n<=maxNum; n++) scores[String(n).padStart(2, '0')] = 0;

    const last30 = currentHistoryData.slice(0, 30);
    let counts = {};
    last30.forEach(d => (d.numbers||[]).slice(0, pickCount).forEach(n => counts[n] = (counts[n]||0)+1));
    Object.keys(scores).forEach(n => scores[n] += (10 - (counts[n]||0)) * (V14_WEIGHTS.MEAN/100));
    
    const lastNums = (currentHistoryData[0].numbers || []).slice(0, pickCount);
    currentHistoryData.slice(1, 100).forEach((d, idx, arr) => {
        let intersect = (d.numbers||[]).slice(0, pickCount).filter(n => lastNums.includes(n));
        if(intersect.length > 0 && idx > 0) {
            (arr[idx-1].numbers||[]).slice(0, pickCount).forEach(n => { if(scores[n]!==undefined) scores[n] += intersect.length * 5 * (V14_WEIGHTS.MARKOV/100); });
        }
    });

    lastNums.forEach(n => { if(scores[n]!==undefined) scores[n] += V14_WEIGHTS.PENALTY; });

    currentPrediction = Object.keys(scores).sort((a,b)=>scores[b]-scores[a]).slice(0, pickCount);
    
    // 💡 修復 3-2：威力彩專屬的第二區 (特別號) 獨立運算與排版
    let htmlBalls = `<div class="balls-container">${currentPrediction.map(n=>`<div class="ball hit">${n}</div>`).join('')}</div>`;
    
    if (currentGame === 'weili') {
        // 第二區引擎：從 01~08 中，選出近期最少開出的號碼 (均值回歸)
        let z2Counts = {};
        for(let i=1; i<=8; i++) z2Counts[String(i).padStart(2,'0')] = 0;
        last30.forEach(d => {
            if(d.numbers && d.numbers.length >= 7) z2Counts[d.numbers[6]] = (z2Counts[d.numbers[6]] || 0) + 1;
        });
        const z2Pred = Object.keys(z2Counts).sort((a,b)=>z2Counts[a]-z2Counts[b])[0] || '08';
        currentPrediction.push(z2Pred); // 把第二區塞入陣列，確保收藏功能正常
        
        // 套用雙區版面
        htmlBalls = `
            <div class="balls-container-v14">
                <div class="balls-container-main">${currentPrediction.slice(0,6).map(n=>`<div class="ball hit">${n}</div>`).join('')}</div>
                <div class="balls-container-special"><div class="ball special-weili">${z2Pred}</div></div>
            </div>`;
    }

    document.getElementById('prediction-content').innerHTML = `
        <div class="ai-reason-box">
            <p style="margin-bottom:10px; font-weight:bold; color:var(--text-main);">🎯 V14 主力推薦：</p>
            ${htmlBalls}
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                <i class="fas fa-microchip"></i> 策略：均值(${V14_WEIGHTS.MEAN}) + 拖牌(${V14_WEIGHTS.MARKOV}) / 動能(${V14_WEIGHTS.EMA})
            </p>
        </div>`;
    document.getElementById('save-fav-btn').style.display = 'block';
}

function runAnalysis() {
    const container = document.getElementById('analysis-result');
    if(!currentHistoryData.length) return alert("請先在首頁選擇彩種");
    let odd = 0, big = 0, counts = {};
    const threshold = (currentGame === '539' || currentGame === 'daily') ? 20 : 25;
    
    currentHistoryData.forEach(d => {
        const nums = (d.numbers || []).map(Number);
        let limit = (currentGame === '539' || currentGame === 'daily') ? 5 : 6;
        nums.slice(0, limit).forEach(n => {
            if(n % 2 !== 0) odd++;
            if(n >= threshold) big++;
            const nStr = String(n).padStart(2, '0');
            counts[nStr] = (counts[nStr] || 0) + 1;
        });
    });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const totalBalls = currentHistoryData.length * ((currentGame === '539' || currentGame === 'daily') ? 5 : 6);
    container.innerHTML = `
        <div class="ai-reason-box">
            📊 <b>10 年大數據深度統計：</b><br><br>
            • 樣本期數：${currentHistoryData.length} 期<br>
            • 單數比例：${(odd/totalBalls*100).toFixed(1)}%<br>
            • 大號比例：${(big/totalBalls*100).toFixed(1)}%<br>
            • 歷史最熱：${sorted.slice(0,5).map(x=>x[0]).join(', ')}<br>
            • 歷史最冷：${sorted.slice(-5).map(x=>x[0]).join(', ')}
        </div>`;
}

function saveFavorite() {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.push({ game: gameNames[currentGame], date: new Date().toLocaleString(), nums: currentPrediction });
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    alert("✅ 已成功加入收藏！");
}

function renderHistory() {
    document.getElementById('history-list-container').innerHTML = currentHistoryData.slice(0, 50).map(d => `
        <div class="history-item" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid var(--border-color);">
            <div style="font-size:0.85rem; margin-bottom:8px; color:var(--text-muted);">${d.issue ? `第 ${d.issue} 期 ` : ""}(${(d.date||"").split('T')[0]})</div>
            <div class="balls-container" style="margin:0; justify-content:flex-start;">
                ${(d.numbers||[]).map((n, i) => `<div class="ball ${i===6 && currentGame==='weili' ? 'special-weili' : ''}" style="width:36px; height:36px; font-size:0.9rem;">${n}</div>`).join('')}
            </div>
        </div>`).join('');
}

function renderFavorites() {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    document.getElementById('favorite-list').innerHTML = favs.reverse().map((f, idx) => `
        <div class="history-item" style="margin-bottom:15px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:var(--text-muted); font-size:0.85rem;">
                <span>${f.game} <br> ${f.date}</span>
                <button onclick="deleteFav(${favs.length-1-idx})" style="background:none; border:none; color:#ff4d4f; padding:5px; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
            <div class="balls-container" style="margin:0; justify-content:flex-start;">
                ${f.nums.map((n, i) => `<div class="ball hit ${i===6 && f.game==='威力彩' ? 'special-weili' : ''}" style="width:36px; height:36px; font-size:0.9rem;">${n}</div>`).join('')}
            </div>
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
