/**
 * 539 AI 預測中心 V4.2 - 終極合體邏輯
 */
const API_URL = "https://lottery-k099.onrender.com/api/predict";
let globalHistoryData = []; 

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    loadLatestData();
    
    document.getElementById("btn-run-ai").addEventListener("click", runGeminiAI);
    document.getElementById("btn-reload").addEventListener("click", loadLatestData);
    document.getElementById("btn-clear-fav").addEventListener("click", clearFavorites);
    document.getElementById("btn-run-bt").addEventListener("click", runBacktest);
    document.getElementById("btn-run-drag").addEventListener("click", runDragQuery);
    
    renderFavorites();
});

function pad2(num) { return String(num).padStart(2, "0"); }
function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

function initTabs() {
    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            pages.forEach(p => p.classList.add("hidden"));
            navItems.forEach(n => n.classList.remove("active"));
            document.getElementById(item.getAttribute("data-target")).classList.remove("hidden");
            item.classList.add("active");
        });
    });
}

// ================= 資料載入 =================
async function loadLatestData() {
    try {
        const urls = [`./latest.json?t=${Date.now()}`, `../latest.json?t=${Date.now()}`];
        let data = null;
        for (let url of urls) {
            try { let res = await fetch(url); if (res.ok) { data = await res.json(); break; } } catch (e) {}
        }
        if (!data) throw new Error("找不到 data");

        let latest = data.daily539 || (Array.isArray(data) ? data[0] : data);
        document.getElementById("draw-period").textContent = latest.period || "未知";
        document.getElementById("draw-date").textContent = latest.date || "未知";
        
        let numbers = latest.numbers || latest.drawNumberSize || [];
        document.getElementById("latest-balls").innerHTML = numbers.map(n => `<div class="ball">${pad2(n)}</div>`).join("");

        globalHistoryData = data.recent50 || data.recent5 || [latest];
        renderHistory();
        showToast("開獎資料已同步");
    } catch (err) {
        document.getElementById("latest-balls").innerHTML = `<div style="color: #ef4444; font-size:14px;">資料載入失敗</div>`;
    }
}

// ================= AI 預測 =================
async function runGeminiAI() {
    const btn = document.getElementById("btn-run-ai");
    const outputArea = document.getElementById("ai-output-area");
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 雲端運算中 (約 40 秒)...`;
    outputArea.classList.add("hidden");

    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (data.status === "success") {
            const ballsHtml = data.predicted_numbers.map(n => `<div class="ball ai-ball">${pad2(n)}</div>`).join("");
            const detailsHtml = data.details.map((d, i) => `<div class="ai-row"><span>${i+1}. 號碼 <b>${pad2(d.num)}</b></span><span class="ai-score">權重: ${d.score.toFixed(2)}</span></div>`).join("");
            outputArea.innerHTML = `
                <div style="margin-bottom:10px; font-weight:bold; color:white;">下期預測號碼：</div>
                <div class="balls-display">${ballsHtml}</div>
                <div class="ai-details"><div style="margin-bottom:8px; color:white;">隨機森林權重解析：</div>${detailsHtml}</div>
                <button class="action-btn secondary-btn" style="margin-top:15px; border-color:#3b82f6; color:#60a5fa;" onclick="saveFavorite('${data.predicted_numbers.join(',')}')"><i class="fas fa-star"></i> 收藏這組號碼</button>
            `;
            outputArea.classList.remove("hidden");
            btn.innerHTML = `<i class="fas fa-check"></i> 預測完成`;
        } else throw new Error(data.message);
    } catch (err) {
        outputArea.innerHTML = `<div style="color: #ef4444;">⚠️ 連線超時，伺服器休眠中，請重試。</div>`;
        outputArea.classList.remove("hidden");
        btn.innerHTML = `<i class="fas fa-bolt"></i> 重新啟動 AI`;
    } finally { btn.disabled = false; }
}

// ================= 歷史與收藏 =================
function renderHistory() {
    const container = document.getElementById("history-list");
    if (!globalHistoryData.length) return container.innerHTML = "<p class='desc-text'>暫無歷史資料</p>";
    container.innerHTML = globalHistoryData.map(item => {
        let ballsHtml = (item.numbers || item.drawNumberSize || []).map(n => `<div class="ball" style="width:34px; height:34px; font-size:14px;">${pad2(n)}</div>`).join("");
        return `<div class="list-item"><div class="list-header"><span>${item.date || ""}</span><span>第 ${item.period || ""} 期</span></div><div class="balls-display">${ballsHtml}</div></div>`;
    }).join("");
}

function saveFavorite(numsStr) {
    const favs = JSON.parse(localStorage.getItem('v4_favorites') || '[]');
    const d = new Date();
    favs.unshift({ date: `${d.getMonth()+1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`, numbers: numsStr.split(',').map(Number) });
    localStorage.setItem('v4_favorites', JSON.stringify(favs));
    showToast("已加入收藏！"); renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    const favs = JSON.parse(localStorage.getItem('v4_favorites') || '[]');
    if (!favs.length) return container.innerHTML = "<p class='desc-text'>尚無收藏號碼。</p>";
    container.innerHTML = favs.map(item => {
        let ballsHtml = item.numbers.map(n => `<div class="ball ai-ball" style="width:34px; height:34px; font-size:14px;">${pad2(n)}</div>`).join("");
        return `<div class="list-item"><div class="list-header"><span>收藏時間：${item.date}</span></div><div class="balls-display">${ballsHtml}</div></div>`;
    }).join("");
}

function clearFavorites() {
    if (confirm("確定要清空嗎？")) { localStorage.removeItem('v4_favorites'); renderFavorites(); showToast("已清空收藏", true); }
}

// ================= 第三階段：策略回測 (移植自V3.8) =================
function getFrequency(history) {
    const freq = {}; history.forEach(draw => draw.forEach(n => freq[n] = (freq[n] || 0) + 1)); return freq;
}
function localPredict(mode, history) {
    // 簡易版 V4 演算法 (提取自 V3.8 核心邏輯)
    const freq = getFrequency(history);
    const sorted = Object.keys(freq).sort((a,b) => freq[b] - freq[a]).map(Number);
    let result = [];
    if (mode === "hot") result = sorted.slice(0, 5);
    else if (mode === "cold") result = sorted.slice(-5).reverse();
    else { // balanced
        result = [...sorted.slice(0, 3), ...sorted.slice(-2)].sort((a,b)=>a-b);
    }
    // 防呆：若號碼不滿5個，隨機補齊
    while(result.length < 5) {
        let r = Math.floor(Math.random()*39)+1;
        if(!result.includes(r)) result.push(r);
    }
    return result.slice(0,5).sort((a,b)=>a-b);
}

function runBacktest() {
    if(globalHistoryData.length < 10) return showToast("資料不足無法回測", true);
    const count = Number(document.getElementById("bt-count").value);
    const mode = document.getElementById("bt-mode").value;
    
    // 反轉陣列，讓 index 0 是最舊的，以符合時序模擬
    let sortedData = [...globalHistoryData].reverse(); 
    let testData = sortedData.slice(-count); // 取最近 N 期作為測試目標
    let baseData = sortedData.slice(0, sortedData.length - count); // 之前的資料作為訓練基礎

    let results = [];
    let totalHits = 0, maxHit = 0;

    testData.forEach(targetRow => {
        let historyForThisStep = [...baseData].map(r => r.numbers || r.drawNumberSize);
        let predicted = localPredict(mode, historyForThisStep);
        let actual = targetRow.numbers || targetRow.drawNumberSize || [];
        
        let hits = predicted.filter(n => actual.includes(n)).length;
        totalHits += hits;
        if(hits > maxHit) maxHit = hits;

        results.push({ period: targetRow.period, actual, predicted, hits });
        baseData.push(targetRow); // 推進一格
    });

    // 更新 DOM 數據
    document.getElementById("bt-avg").textContent = (totalHits / count).toFixed(1) + " 顆";
    document.getElementById("bt-max").textContent = maxHit + " 顆";
    document.getElementById("bt-total").textContent = count + " 期";
    
    // 簡易損益 (每期成本50，中2顆50，中3顆300)
    let profit = results.reduce((acc, r) => acc + (r.hits===2?50 : r.hits===3?300 : r.hits===4?8000 : 0) - 50, 0);
    let pEl = document.getElementById("bt-profit");
    pEl.textContent = profit + " 元";
    pEl.style.color = profit >= 0 ? "#10b981" : "#ef4444";

    // 渲染清單
    document.getElementById("bt-list").innerHTML = results.slice().reverse().map(r => {
        let pBalls = r.predicted.map(n => `<span style="display:inline-block; width:22px; height:22px; background:#2563eb; color:white; border-radius:50%; text-align:center; line-height:22px; font-size:12px; margin-right:4px;">${pad2(n)}</span>`).join("");
        let aBalls = r.actual.map(n => `<span style="display:inline-block; width:22px; height:22px; background:#475569; color:white; border-radius:50%; text-align:center; line-height:22px; font-size:12px; margin-right:4px;">${pad2(n)}</span>`).join("");
        return `<div class="list-item" style="font-size:13px;">
            <div class="list-header"><span>第 ${r.period} 期</span><span style="color:#60a5fa; font-weight:bold;">命中 ${r.hits} 顆</span></div>
            <div style="margin-bottom:6px;">預測：${pBalls}</div>
            <div>實際：${aBalls}</div>
        </div>`;
    }).join("");

    document.getElementById("bt-stats-panel").classList.remove("hidden");
    showToast("回測完成！");
}

// ================= 第三階段：拖號查詢 =================
function runDragQuery() {
    const target = Number(document.getElementById("drag-input").value);
    if (!target || target < 1 || target > 39) return showToast("請輸入 01-39 之間的號碼", true);
    
    let rows = globalHistoryData;
    let nextFreq = {};
    let triggerCount = 0;

    // 歷史資料通常 index 0 是最新，所以 i-1 是 i 的「下一期」
    for (let i = 1; i < rows.length; i++) {
        let currentDraw = rows[i].numbers || rows[i].drawNumberSize || [];
        let nextDraw = rows[i-1].numbers || rows[i-1].drawNumberSize || [];
        
        if (currentDraw.includes(target)) {
            triggerCount++;
            nextDraw.forEach(n => { nextFreq[n] = (nextFreq[n] || 0) + 1; });
        }
    }

    const outputArea = document.getElementById("drag-output");
    outputArea.classList.remove("hidden");

    if (triggerCount === 0) {
        outputArea.innerHTML = `<div style="color:#94a3b8; font-size:14px; margin-top:15px;">過去 50 期內，尚未開出過 ${pad2(target)}。</div>`;
        return;
    }

    let sortedTops = Object.keys(nextFreq).map(Number).sort((a,b) => nextFreq[b] - nextFreq[a]).slice(0, 5);
    
    let html = `<div style="margin-top:15px; padding:12px; background:rgba(0,0,0,0.2); border-radius:12px; font-size:14px; color:#cbd5e1;">`;
    html += `<div style="margin-bottom:10px;"><b>${pad2(target)}</b> 曾開出 ${triggerCount} 次，下期最常跟著開出：</div>`;
    sortedTops.forEach((n, idx) => {
        let rate = Math.round((nextFreq[n] / triggerCount) * 100);
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>Top ${idx+1}. 號碼 <b style="color:white; font-size:15px;">${pad2(n)}</b></span>
            <span style="color:#60a5fa;">${nextFreq[n]} 次 (${rate}%)</span>
        </div>`;
    });
    html += `</div>`;
    outputArea.innerHTML = html;
}
