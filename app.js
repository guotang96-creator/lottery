/**
 * 539 AI 預測中心 V4.3 - 終極防呆合體版
 */
const API_URL = "https://lottery-k099.onrender.com/api/predict";
let globalHistoryData = []; 

// 💡 內建備用歷史庫：當 latest.json 資料不足時自動補齊，保證回測不崩潰
const MOCK_HISTORY = [
    { period: "115000084", date: "2026-04-04", numbers: [4, 17, 25, 31, 36] },
    { period: "115000083", date: "2026-04-03", numbers: [6, 8, 9, 25, 35] },
    { period: "115000082", date: "2026-04-02", numbers: [1, 9, 13, 18, 21] },
    { period: "115000081", date: "2026-04-01", numbers: [3, 10, 11, 13, 23] },
    { period: "115000080", date: "2026-03-31", numbers: [9, 16, 23, 35, 39] },
    { period: "115000079", date: "2026-03-30", numbers: [6, 8, 20, 22, 32] },
    { period: "115000078", date: "2026-03-28", numbers: [6, 9, 11, 16, 17] },
    { period: "115000077", date: "2026-03-27", numbers: [8, 18, 24, 34, 35] },
    { period: "115000076", date: "2026-03-26", numbers: [14, 17, 20, 24, 37] },
    { period: "115000075", date: "2026-03-25", numbers: [3, 13, 31, 33, 36] },
    { period: "115000074", date: "2026-03-24", numbers: [10, 20, 28, 29, 36] },
    { period: "115000073", date: "2026-03-23", numbers: [7, 12, 24, 29, 35] },
    { period: "115000072", date: "2026-03-21", numbers: [7, 14, 15, 19, 22] },
    { period: "115000071", date: "2026-03-20", numbers: [3, 11, 15, 33, 39] },
    { period: "115000070", date: "2026-03-19", numbers: [5, 23, 25, 30, 37] },
    { period: "115000069", date: "2026-03-18", numbers: [21, 22, 31, 32, 35] },
    { period: "115000068", date: "2026-03-17", numbers: [11, 13, 19, 22, 27] },
    { period: "115000067", date: "2026-03-16", numbers: [17, 19, 21, 29, 34] },
    { period: "115000066", date: "2026-03-14", numbers: [8, 10, 18, 20, 34] },
    { period: "115000065", date: "2026-03-13", numbers: [2, 5, 11, 12, 15] },
    { period: "115000064", date: "2026-03-12", numbers: [4, 5, 7, 23, 35] },
    { period: "115000063", date: "2026-03-11", numbers: [5, 15, 26, 37, 38] },
    { period: "115000062", date: "2026-03-10", numbers: [11, 12, 14, 17, 32] },
    { period: "115000061", date: "2026-03-09", numbers: [7, 12, 15, 32, 38] },
    { period: "115000060", date: "2026-03-07", numbers: [15, 17, 18, 34, 36] },
    { period: "115000059", date: "2026-03-06", numbers: [19, 24, 29, 32, 34] },
    { period: "115000058", date: "2026-03-05", numbers: [1, 4, 8, 12, 36] },
    { period: "115000057", date: "2026-03-04", numbers: [4, 8, 12, 16, 17] },
    { period: "115000056", date: "2026-03-03", numbers: [2, 19, 21, 32, 35] },
    { period: "115000055", date: "2026-03-02", numbers: [3, 12, 20, 21, 27] }
];

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

        // 💡 防呆機制：如果 JSON 的歷史資料不夠，自動從 MOCK_HISTORY 補齊
        let loadedHistory = data.recent50 || data.recent5 || [latest];
        if (loadedHistory.length < 30) {
            const existingPeriods = new Set(loadedHistory.map(r => r.period));
            const padding = MOCK_HISTORY.filter(r => !existingPeriods.has(r.period));
            globalHistoryData = [...loadedHistory, ...padding];
        } else {
            globalHistoryData = loadedHistory;
        }

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

// ================= 策略回測 =================
function getFrequency(history) {
    const freq = {}; history.forEach(draw => draw.forEach(n => freq[n] = (freq[n] || 0) + 1)); return freq;
}
function localPredict(mode, history) {
    const freq = getFrequency(history);
    const sorted = Object.keys(freq).sort((a,b) => freq[b] - freq[a]).map(Number);
    let result = [];
    if (mode === "hot") result = sorted.slice(0, 5);
    else if (mode === "cold") result = sorted.slice(-5).reverse();
    else result = [...sorted.slice(0, 3), ...sorted.slice(-2)].sort((a,b)=>a-b);
    
    while(result.length < 5) {
        let r = Math.floor(Math.random()*39)+1;
        if(!result.includes(r)) result.push(r);
    }
    return result.slice(0,5).sort((a,b)=>a-b);
}

function runBacktest() {
    const count = Number(document.getElementById("bt-count").value);
    const mode = document.getElementById("bt-mode").value;
    
    // 防呆檢查
    if(globalHistoryData.length <= count) {
        return showToast(`資料不足 ${count} 期無法回測`, true);
    }
    
    let sortedData = [...globalHistoryData].reverse(); 
    let testData = sortedData.slice(-count); 
    let baseData = sortedData.slice(0, sortedData.length - count); 

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
        baseData.push(targetRow); 
    });

    document.getElementById("bt-avg").textContent = (totalHits / count).toFixed(1) + " 顆";
    document.getElementById("bt-max").textContent = maxHit + " 顆";
    document.getElementById("bt-total").textContent = count + " 期";
    
    let profit = results.reduce((acc, r) => acc + (r.hits===2?50 : r.hits===3?300 : r.hits===4?8000 : 0) - 50, 0);
    let pEl = document.getElementById("bt-profit");
    pEl.textContent = profit + " 元";
    pEl.style.color = profit >= 0 ? "#10b981" : "#ef4444";

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

// ================= 拖號查詢 =================
function runDragQuery() {
    const target = Number(document.getElementById("drag-input").value);
    if (!target || target < 1 || target > 39) return showToast("請輸入 01-39 之間的號碼", true);
    
    let rows = globalHistoryData;
    let nextFreq = {};
    let triggerCount = 0;

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
        outputArea.innerHTML = `<div style="color:#94a3b8; font-size:14px; margin-top:15px;">資料庫中尚未開出過 ${pad2(target)}。</div>`;
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
