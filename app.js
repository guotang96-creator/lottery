/**
 * 今彩539 AI 分析中心 V5.0 - 專業數據對接版
 */
const API_URL = "https://lottery-k099.onrender.com/api/predict";
let globalHistoryData = []; 

// 內建備用歷史庫 (防呆機制)
const MOCK_HISTORY = [
    { period: "115000084", lotteryDate: "2026-04-04T00:00:00", drawNumberSize: [4, 17, 25, 31, 36] },
    { period: "115000083", lotteryDate: "2026-04-03T00:00:00", drawNumberSize: [6, 8, 9, 25, 35] },
    { period: "115000082", lotteryDate: "2026-04-02T00:00:00", drawNumberSize: [1, 9, 13, 18, 21] },
    { period: "115000081", lotteryDate: "2026-04-01T00:00:00", drawNumberSize: [3, 10, 11, 13, 23] },
    { period: "115000080", lotteryDate: "2026-03-31T00:00:00", drawNumberSize: [9, 16, 23, 35, 39] }
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

// 💡 核心修正：日期清洗函數，處理 T00:00:00 問題
function cleanDateStr(d) {
    if (!d) return "";
    // 先處理 ISO 格式的 T，再處理空白
    return d.split('T')[0].split(' ')[0];
}

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

async function loadLatestData() {
    try {
        const urls = [`./latest.json?t=${Date.now()}`, `../latest.json?t=${Date.now()}`];
        let data = null;
        for (let url of urls) {
            try { let res = await fetch(url); if (res.ok) { data = await res.json(); break; } } catch (e) {}
        }
        if (!data) throw new Error("找不到資料");

        // 💡 核心修正：適應新版 JSON 結構 (daily539)
        let latest = data.daily539 || (Array.isArray(data) ? data[0] : data);
        
        // 💡 核心修正：相容所有可能的期數與日期欄位名
        let p = latest.period || latest.Period || latest.drawTerm || latest.issue;
        let d = latest.lotteryDate || latest.date || latest.Date || latest.drawDate;
        
        document.getElementById("draw-period").textContent = p ? p : "最新一期";
        
        const dateBadge = document.getElementById("draw-date");
        if (d) {
            dateBadge.textContent = cleanDateStr(d);
            dateBadge.style.display = "inline-block";
        } else {
            dateBadge.style.display = "none";
        }
        
        // 💡 核心修正：適應新版號碼欄位 drawNumberSize
        let numbers = latest.drawNumberSize || latest.numbers || [];
        document.getElementById("latest-balls").innerHTML = numbers.map(n => `<div class="ball">${pad2(n)}</div>`).join("");

        // 💡 核心修正：處理歷史清單 recent50
        let loadedHistory = data.recent50 || data.recent5 || (Array.isArray(data) ? data : [latest]);
        
        if (loadedHistory.length < 15) {
            const existingPeriods = new Set(loadedHistory.map(r => r.period));
            const padding = MOCK_HISTORY.filter(r => !existingPeriods.has(r.period));
            globalHistoryData = [...loadedHistory, ...padding];
        } else {
            globalHistoryData = loadedHistory;
        }

        renderHistory();
        showToast("數據分析庫同步成功");
    } catch (err) {
        console.error(err);
        document.getElementById("latest-balls").innerHTML = `<div style="color: #ef4444; font-size:14px;">資料連線失敗，請稍後重試</div>`;
    }
}

async function runGeminiAI() {
    const btn = document.getElementById("btn-run-ai");
    const outputArea = document.getElementById("ai-output-area");
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 數據分析中 (約 40 秒)...`;
    outputArea.classList.add("hidden");

    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (data.status === "success") {
            const ballsHtml = data.predicted_numbers.map(n => `<div class="ball ai-ball">${pad2(n)}</div>`).join("");
            const detailsHtml = data.details.map((d, i) => `<div class="ai-row"><span>${i+1}. 號碼 <b>${pad2(d.num)}</b></span><span class="ai-score">權重: ${d.score.toFixed(2)}</span></div>`).join("");
            
            let memoryText = data.time_steps ? `<span style="color:#fbbf24; margin-left:5px; font-size:12px;">(回溯 ${data.time_steps} 期走勢)</span>` : "";

            outputArea.innerHTML = `
                <div style="margin-bottom:10px; font-weight:bold; color:white;">AI 推薦號碼建議：</div>
                <div class="balls-display">${ballsHtml}</div>
                <div class="ai-details"><div style="margin-bottom:8px; color:white;">深度神經網路解析${memoryText}：</div>${detailsHtml}</div>
                <button class="action-btn secondary-btn" style="margin-top:15px; border-color:#3b82f6; color:#60a5fa;" onclick="saveFavorite('${data.predicted_numbers.join(',')}')"><i class="fas fa-star"></i> 收藏此組分析</button>
            `;
            outputArea.classList.remove("hidden");
            btn.innerHTML = `<i class="fas fa-check"></i> 分析完成`;
        } else throw new Error(data.message);
    } catch (err) {
        outputArea.innerHTML = `<div style="color: #ef4444; font-size:14px;">⚠️ 伺服器運算超時。AI 正在暖機中，請再次點擊下方按鈕。</div>`;
        outputArea.classList.remove("hidden");
        btn.innerHTML = `<i class="fas fa-bolt"></i> 重新啟動 AI 分析`;
    } finally { btn.disabled = false; }
}

function renderHistory() {
    const container = document.getElementById("history-list");
    if (!globalHistoryData.length) return container.innerHTML = "<p class='desc-text'>暫無歷史資料</p>";
    
    container.innerHTML = globalHistoryData.map(item => {
        let nums = item.drawNumberSize || item.numbers || [];
        let ballsHtml = nums.map(n => `<div class="ball" style="width:34px; height:34px; font-size:14px;">${pad2(n)}</div>`).join("");
        
        // 💡 歷史紀錄日期修正
        let rawDate = item.lotteryDate || item.date || item.Date || "";
        let cleanDate = cleanDateStr(rawDate);
        
        return `
            <div class="list-item">
                <div class="list-header">
                    <span style="color:#94a3b8;">${cleanDate}</span>
                    <span style="font-weight:bold;">第 ${item.period || ""} 期</span>
                </div>
                <div class="balls-display">${ballsHtml}</div>
            </div>`;
    }).join("");
}

function saveFavorite(numsStr) {
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    const d = new Date();
    favs.unshift({ 
        date: `${d.getMonth()+1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`, 
        numbers: numsStr.split(',').map(Number) 
    });
    localStorage.setItem('v5_favorites', JSON.stringify(favs));
    showToast("分析結果已收藏"); renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    if (!favs.length) return container.innerHTML = "<p class='desc-text'>尚無收藏紀錄。</p>";
    container.innerHTML = favs.map(item => {
        let ballsHtml = item.numbers.map(n => `<div class="ball ai-ball" style="width:34px; height:34px; font-size:14px;">${pad2(n)}</div>`).join("");
        return `<div class="list-item"><div class="list-header"><span>收藏時間：${item.date}</span></div><div class="balls-display">${ballsHtml}</div></div>`;
    }).join("");
}

function clearFavorites() {
    if (confirm("確定要清空所有收藏紀錄嗎？")) { 
        localStorage.removeItem('v5_favorites'); 
        renderFavorites(); 
        showToast("已清空", true); 
    }
}

// ---------------- 策略回測邏輯 (保持原有功能) ----------------

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
    if(globalHistoryData.length <= count) return showToast(`資料不足 ${count} 期無法回測`, true);
    
    let sortedData = [...globalHistoryData].reverse(); 
    let testData = sortedData.slice(-count); 
    let baseData = sortedData.slice(0, sortedData.length - count); 

    let results = [];
    let totalHits = 0, maxHit = 0;

    testData.forEach(targetRow => {
        let historyForThisStep = [...baseData].map(r => r.drawNumberSize || r.numbers);
        let predicted = localPredict(mode, historyForThisStep);
        let actual = targetRow.drawNumberSize || targetRow.numbers || [];
        
        let hits = predicted.filter(n => actual.includes(n)).length;
        totalHits += hits;
        if(hits > maxHit) maxHit = hits;

        results.push({ period: targetRow.period, actual, predicted, hits });
        baseData.push(targetRow); 
    });

    document.getElementById("bt-avg").textContent = (totalHits / count).toFixed(1);
    document.getElementById("bt-max").textContent = maxHit;
    document.getElementById("bt-total").textContent = count;
    
    let profit = results.reduce((acc, r) => acc + (r.hits===2?50 : r.hits===3?300 : r.hits===4?8000 : 0) - 50, 0);
    let pEl = document.getElementById("bt-profit");
    pEl.textContent = (profit >= 0 ? "+" : "") + profit + " 元";
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
    showToast("回測分析完成");
}

function runDragQuery() {
    const target = Number(document.getElementById("drag-input").value);
    if (!target || target < 1 || target > 39) return showToast("請輸入有效號碼 (01-39)", true);
    
    let rows = globalHistoryData;
    let nextFreq = {};
    let triggerCount = 0;

    for (let i = 1; i < rows.length; i++) {
        let currentDraw = rows[i].drawNumberSize || rows[i].numbers || [];
        let nextDraw = rows[i-1].drawNumberSize || rows[i-1].numbers || [];
        
        if (currentDraw.includes(target)) {
            triggerCount++;
            nextDraw.forEach(n => { nextFreq[n] = (nextFreq[n] || 0) + 1; });
        }
    }

    const outputArea = document.getElementById("drag-output");
    outputArea.classList.remove("hidden");

    if (triggerCount === 0) {
        outputArea.innerHTML = `<div style="color:#94a3b8; font-size:14px; margin-top:15px;">數據庫中近 50 期尚未開出過 ${pad2(target)}。</div>`;
        return;
    }

    let sortedTops = Object.keys(nextFreq).map(Number).sort((a,b) => nextFreq[b] - nextFreq[a]).slice(0, 5);
    
    let html = `<div style="margin-top:15px; padding:12px; background:rgba(0,0,0,0.2); border-radius:12px; font-size:14px; color:#cbd5e1;">`;
    html += `<div style="margin-bottom:10px;">數據顯示：<b>${pad2(target)}</b> 曾開出 ${triggerCount} 次，下期最常帶出：</div>`;
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
