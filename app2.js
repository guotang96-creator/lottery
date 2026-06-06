// 💥 暴力解除 PWA 舊版快取攔截
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
        for(let reg of regs) reg.unregister();
    });
}

let currentGame = '';
let currentHistoryData = []; 
let currentPrediction = []; 
let dynamicWeights = null; 

// 💡 補回被遺忘的 Render 對獎 API 網址
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 

// V15 防呆預設權重
const DEFAULT_WEIGHTS = { ema: 10, mean: 20, gap: 15, cooc: 35, anom: 10, vol: 5, pat: 5 };

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
    
    // 💡 抓回對獎區塊的 HTML 元素
    const vBox = document.getElementById('ai-verify-box');

    sEl.innerText = "⏳ V15 引擎載入中...";
    lBalls.innerHTML = ''; lBallsSpec.innerHTML = ''; pContent.innerHTML = '';
    
    // 預設先隱藏按鈕與對獎區塊
    document.getElementById('save-fav-btn').style.display = 'none'; 
    if(vBox) vBox.style.display = 'none';

    try {
        // 1. 抓取 GitHub 歷史資料
        const gRes = await fetch(`https://guotang96-creator.github.io/lottery/${fileMap[g]}?nocache=${Date.now()}`, { cache: 'no-store' });
        const gh = await gRes.json();
        currentHistoryData = gh.history || [];
        if (currentHistoryData.length === 0) throw new Error("無歷史數據");

        // 2. 抓取 V15 動態權重
        try {
            const wRes = await fetch(`https://guotang96-creator.github.io/lottery/v15_weights.json?nocache=${Date.now()}`, { cache: 'no-store' });
            const wData = await wRes.json();
            dynamicWeights = wData[g] || DEFAULT_WEIGHTS;
        } catch(e) {
            console.log("無法讀取動態權重，使用防呆預設值");
            dynamicWeights = DEFAULT_WEIGHTS;
        }

        // 渲染最新開獎號碼
        const latest = currentHistoryData[0];
        sEl.innerText = `✅ ${latest.issue ? `第 ${latest.issue} 期 ` : ""}(${latest.date})`;

        const nums = (latest.numbers || []).map(n => String(n).padStart(2, '0'));
        if (g === 'weili') {
            lBalls.innerHTML = nums.slice(0, 6).map(n => `<div class="ball">${n}</div>`).join('');
            if(nums[6]) lBallsSpec.innerHTML = `<div class="ball special-weili">${nums[6]}</div>`;
        } else {
            lBalls.innerHTML = nums.map(n => `<div class="ball">${n}</div>`).join('');
        }

        // 💡 3. 補回這段被刪掉的 Render API 對獎邏輯！
        if (vBox) {
            try {
                const rRes = await fetch(`${API_BASE_URL}/${g}`);
                const ai = await rRes.json();
                if (ai.status === "success" && ai.prev_predicted && ai.prev_predicted.length > 0) {
                    vBox.style.display = 'block'; 
                    const hits = ai.hit_nums || [];
                    document.getElementById('verify-hit-count').innerText = `命中 ${hits.length} 顆`;
                    document.getElementById('verify-balls').innerHTML = ai.prev_predicted.map(n => `<div class="ball ${hits.includes(n)?'hit':'miss'}">${String(n).padStart(2, '0')}</div>`).join('');
                }
            } catch (err) { 
                console.log("⚠️ Render 伺服器無回應，略過對獎畫面"); 
            }
        }

        // 4. 啟動 V15 本地即時預測
        runV15AI();

    } catch (e) { 
        sEl.innerText = "❌ 讀取失敗"; 
        lBalls.innerHTML = '<div style="color:#ff4d4f;"><i class="fas fa-exclamation-triangle"></i> 資料庫異常</div>';
    }
}

// 🤖 V15 多因子實時預測引擎
function runV15AI() {
    if(currentHistoryData.length < 30) return;

    const maxNum = (currentGame==='539'||currentGame==='daily') ? 39 : (currentGame==='weili' ? 38 : 49);
    const pickCount = (currentGame==='539'||currentGame==='daily') ? 5 : 6;
    const norm = (num) => String(num).trim().padStart(2, '0');
    const w = dynamicWeights;

    let scores = {};
    for(let n=1; n<=maxNum; n++) scores[norm(n)] = Math.random() * 0.001; 

    const pastData = currentHistoryData;
    let counts = {}, gaps = {};
    for(let n=1; n<=maxNum; n++) {
        counts[norm(n)] = 0;
        gaps[norm(n)] = pastData.slice(0, 50).findIndex(d => (d.numbers||[]).includes(norm(n)));
        if(gaps[norm(n)] === -1) gaps[norm(n)] = 50;
    }
    
    pastData.slice(0, 30).forEach(d => (d.numbers||[]).slice(0, pickCount).forEach(n => {
        if(counts[norm(n)] !== undefined) counts[norm(n)]++;
    }));

    const avgFreq = 30 * (pickCount / maxNum);

    for(let n=1; n<=maxNum; n++) {
        const sn = norm(n);
        let emaScore = 0;
        pastData.slice(0, 5).forEach((d, idx) => { if((d.numbers||[]).includes(sn)) emaScore += (5 - idx); });
        
        scores[sn] += emaScore * (w.ema / 100);
        scores[sn] += (10 - counts[sn]) * (w.mean / 100);
        scores[sn] += gaps[sn] * (w.gap / 100);
        scores[sn] += Math.abs(counts[sn] - avgFreq) * (w.anom / 100);
        scores[sn] += (gaps[sn] > 15 ? 1 : 0) * (w.vol / 100);
    }

    const lastNums = pastData[0].numbers.slice(0, pickCount).map(norm);
    pastData.slice(1, 50).forEach((d, idx, arr) => {
        let intersect = (d.numbers||[]).slice(0, pickCount).map(norm).filter(n => lastNums.includes(n));
        if(intersect.length > 0 && idx > 0) {
            (arr[idx-1].numbers||[]).slice(0, pickCount).map(norm).forEach(n => { if(scores[n] !== undefined) scores[n] += intersect.length * (w.cooc / 100); });
        }
    });

    currentPrediction = Object.keys(scores).sort((a,b)=>scores[b]-scores[a]).slice(0, pickCount);
    let htmlBalls = `<div class="balls-container">${currentPrediction.map(n=>`<div class="ball hit">${n}</div>`).join('')}</div>`;
    
    if (currentGame === 'weili') {
        let z2Counts = {};
        for(let i=1; i<=8; i++) z2Counts[norm(i)] = Math.random() * 0.001;
        pastData.slice(0, 30).forEach(d => {
            if(d.numbers && d.numbers.length >= 7) z2Counts[norm(d.numbers[6])] += 1;
        });
        const z2Pred = Object.keys(z2Counts).sort((a,b)=>z2Counts[a]-z2Counts[b])[0] || '08';
        currentPrediction.push(z2Pred); 
        htmlBalls = `
            <div class="balls-container-v14">
                <div class="balls-container-main">${currentPrediction.slice(0,6).map(n=>`<div class="ball hit">${n}</div>`).join('')}</div>
                <div class="balls-container-special"><div class="ball special-weili">${z2Pred}</div></div>
            </div>`;
    }

    document.getElementById('prediction-content').innerHTML = `
        <div class="ai-reason-box">
            <p style="font-weight:bold; color:var(--text-main); margin-bottom:10px;">🎯 V15 多因子動態推薦：</p>
            ${htmlBalls}
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 0.75rem; color: var(--text-muted);">
                <div style="margin-bottom: 5px; color: var(--primary-blue); font-weight: bold;"><i class="fas fa-network-wired"></i> 今日 AI 最佳化權重配比：</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <div>🔥 熱號 (EMA): ${w.ema}%</div>
                    <div>❄️ 冷號 (Mean): ${w.mean}%</div>
                    <div>📏 距離 (Gap): ${w.gap}%</div>
                    <div>🔗 拖牌 (Cooc): ${w.cooc}%</div>
                    <div>⚠️ 異常 (Anom): ${w.anom}%</div>
                    <div>📈 波動 (Vol): ${w.vol}%</div>
                </div>
            </div>
        </div>`;
    document.getElementById('save-fav-btn').style.display = 'block';
}

function runAnalysis() { alert("V15 分析功能已整合至主頁面。"); }

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
                ${(d.numbers||[]).map((n, i) => `<div class="ball ${i===6 && currentGame==='weili' ? 'special-weili' : ''}" style="width:36px; height:36px; font-size:0.9rem;">${String(n).padStart(2,'0')}</div>`).join('')}
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
                ${f.nums.map((n, i) => `<div class="ball hit ${i===6 && f.game==='威力彩' ? 'special-weili' : ''}" style="width:36px; height:36px; font-size:0.9rem;">${String(n).padStart(2,'0')}</div>`).join('')}
            </div>
        </div>`).join('');
}

function deleteFav(idx) {
    let favs = JSON.parse(localStorage.getItem('lottery_favs') || '[]');
    favs.splice(idx, 1);
    localStorage.setItem('lottery_favs', JSON.stringify(favs));
    renderFavorites();
}

async function clearCache() {
    if (confirm("⚠️ 確定要執行【終極深度清理】嗎？")) {
        localStorage.clear();
        if ('caches' in window) { try { const keys = await caches.keys(); for (let key of keys) await caches.delete(key); } catch(e) {} }
        alert("✅ 深度清理完成！");
        window.location.replace(window.location.pathname + "?refresh=" + Date.now());
    }
}
