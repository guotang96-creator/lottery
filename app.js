/**
 * 彩券 AI 分析中心 V5.2.2 - 雙核心引擎 & 完整回測版
 */
const API_BASE = "https://lottery-k099.onrender.com";
let currentType = "539"; 
let globalHistoryData = []; 

const MOCK_HISTORY = [
    { period: "載入中...", lotteryDate: "", drawNumberSize: [0, 0, 0, 0, 0] }
];

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initTypeSelector();
    loadLatestData();
    
    // 綁定所有按鈕事件
    document.getElementById("btn-run-ai").addEventListener("click", runGeminiAI);
    document.getElementById("btn-reload").addEventListener("click", loadLatestData);
    document.getElementById("btn-clear-fav").addEventListener("click", clearFavorites);
    
    // 綁定回測按鈕
    const btnBt = document.getElementById("btn-run-bt");
    if(btnBt) btnBt.addEventListener("click", runBacktest);
    
    renderFavorites();
});

function pad2(num) { return String(num).padStart(2, "0"); }
function cleanDateStr(d) { return d ? d.split('T')[0].split(' ')[0] : ""; }

function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

// --- 雙核心切換邏輯 ---
function initTypeSelector() {
    const btn539 = document.getElementById("tab-539");
    const btnDaily = document.getElementById("tab-daily");
    const descText = document.getElementById("ai-desc");
    const placeholderText = document.getElementById("ai-placeholder-text");

    const updateUIState = (type) => {
        currentType = type;
        const label = type === "539" ? "今彩 539" : "加州天天樂";
        
        // 切換按鈕顏色
        if(type === "539") {
            btn539.style.background = "rgba(59,130,246,0.2)"; btn539.style.borderColor = "#3b82f6"; btn539.style.color = "white";
            btnDaily.style.background = "rgba(255,255,255,0.05)"; btnDaily.style.borderColor = "rgba(255,255,255,0.1)"; btnDaily.style.color = "#94a3b8";
        } else {
            btnDaily.style.background = "rgba(59,130,246,0.2)"; btnDaily.style.borderColor = "#3b82f6"; btnDaily.style.color = "white";
            btn539.style.background = "rgba(255,255,255,0.05)"; btn539.style.borderColor = "rgba(255,255,255,0.1)"; btn539.style.color = "#94a3b8";
        }

        // 更新介面文字
        if(descText) descText.textContent = `目前針對 [${label}] 執行深度學習趨勢分析。`;
        if(placeholderText) placeholderText.textContent = `${label} 分析引擎就緒，準備產生推薦號碼`;
        
        const titleEl = document.querySelector(".glass-card h2");
        if(titleEl) titleEl.innerHTML = `<i class="fas fa-trophy"></i> 最新開獎結果 (${label})`;
        
        // 更新回測頁面的標題
        const btLabel = document.getElementById("bt-type-label");
        if(btLabel) btLabel.textContent = label;
        
        // 載入對應資料
        loadLatestData();
    };

    if(btn539) btn539.addEventListener("click", () => updateUIState("539"));
    if(btnDaily) btnDaily.addEventListener("click", () => updateUIState("daily"));
}

// --- 抓取資料庫 ---
async function loadLatestData() {
    const ballsContainer = document.getElementById("latest-balls");
    if(ballsContainer) ballsContainer.innerHTML = `<div style="font-size: 12px; color: #475569;"><i class="fas fa-sync fa-spin"></i> 同步 ${currentType} 資料中...</div>`;

    try {
        const fileName = currentType === "539" ? "latest.json" : "daily.json";
        const res = await fetch(`./${fileName}?t=${Date.now()}`);
        if (!res.ok) throw new Error("尚未生成資料庫");
        
        const data = await res.json();
        let latest = data.daily_latest || data.daily539 || (Array.isArray(data) ? data[0] : data);
        
        document.getElementById("draw-period").textContent = latest.period || "---";
        document.getElementById("draw-date").textContent = cleanDateStr(latest.lotteryDate || latest.date);
        
        if (data.updatedAt) {
            const d = new Date(data.updatedAt);
            document.getElementById("update-time").textContent = `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }

        let nums = latest.drawNumberSize || latest.numbers || [];
        if(ballsContainer) ballsContainer.innerHTML = nums.map(n => `<div class="ball">${pad2(n)}</div>`).join("");

        globalHistoryData = data.recent50 || [];
        renderHistory();

    } catch (err) {
        if(ballsContainer) ballsContainer.innerHTML = `<div style="color:#64748b; font-size:12px;">${currentType} 數據載入中或尚未建立</div>`;
        globalHistoryData = MOCK_HISTORY;
        renderHistory();
    }
}

// --- 呼叫 Render AI 引擎 ---
async function runGeminiAI() {
    const btn = document.getElementById("btn-run-ai");
    const outputArea = document.getElementById("ai-output-area");
    if(!btn || !outputArea) return;
    
    btn.disabled = true;
    const apiPath = currentType === "539" ? "/api/predict" : "/api/predict_daily";
    const label = currentType === "539" ? "539" : "天天樂";

    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在分析 ${label} 大數據...`;
    outputArea.innerHTML = `<div style="text-align:center; padding:25px; color:#60a5fa;"><i class="fas fa-microchip fa-spin"></i> 正在回溯神經網路模型...</div>`;

    try {
        const res = await fetch(`${API_BASE}${apiPath}`);
        const data = await res.json();
        if (data.status === "success") {
            const ballsHtml = data.predicted_numbers.map(n => `<div class="ball ai-ball">${pad2(n)}</div>`).join("");
            const detailsHtml = data.details.map((d, i) => `
                <div class="ai-row"><span>${i+1}. 號碼 <b>${pad2(d.num)}</b></span><span class="ai-score">權重: ${d.score.toFixed(2)}</span></div>`).join("");
            
            outputArea.innerHTML = `
                <div style="padding: 15px; background: rgba(0,0,0,0.2); border-radius: 16px;">
                    <div style="margin-bottom:12px; font-weight:bold; color:#e2e8f0; font-size:14px;">[${label}] 智能分析建議：</div>
                    <div class="balls-display">${ballsHtml}</div>
                    <div class="ai-details" style="margin-top:15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">
                        ${detailsHtml}
                    </div>
                    <button class="action-btn secondary-btn" style="margin-top:15px;" onclick="saveFavorite('${data.predicted_numbers.join(',')}', '${label}')">
                        <i class="fas fa-save"></i> 儲存分析結果
                    </button>
                </div>`;
            btn.innerHTML = `<i class="fas fa-check-circle"></i> 分析完成`;
        } else throw new Error();
    } catch (err) {
        outputArea.innerHTML = `<div style="color:#fca5a5; padding:15px; text-align:center; font-size:13px;">⚠️ 伺服器暖機中，請再次點擊下方按鈕。</div>`;
        btn.innerHTML = `<i class="fas fa-redo"></i> 再次啟動智能分析`;
    } finally { btn.disabled = false; }
}

// --- 歷史紀錄渲染 ---
function renderHistory() {
    const container = document.getElementById("history-list");
    if(!container) return;
    if (!globalHistoryData.length || globalHistoryData === MOCK_HISTORY) return container.innerHTML = "<p class='desc-text'>暫無資料</p>";
    
    container.innerHTML = globalHistoryData.map(item => {
        let nums = item.drawNumberSize || item.numbers || [];
        let date = cleanDateStr(item.lotteryDate || item.date);
        return `<div class="list-item">
            <div class="list-header"><span>${date}</span><span>第 ${item.period} 期</span></div>
            <div class="balls-display" style="gap:8px;">${nums.map(n=>`<div class="ball" style="width:30px;height:30px;font-size:12px;">${pad2(n)}</div>`).join("")}</div>
        </div>`;
    }).join("");
}

// --- 收藏功能 ---
function saveFavorite(numsStr, label) {
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    const d = new Date();
    favs.unshift({ 
        date: `${d.getMonth()+1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`, 
        label: label, 
        numbers: numsStr.split(',').map(Number) 
    });
    localStorage.setItem('v5_favorites', JSON.stringify(favs));
    showToast(`已收藏 ${label} 分析結果`);
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    if(!container) return;
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    if (!favs.length) return container.innerHTML = "<p class='desc-text'>尚無收藏。</p>";
    container.innerHTML = favs.map(item => `
        <div class="list-item">
            <div class="list-header"><span>[${item.label}] ${item.date}</span></div>
            <div class="balls-display" style="gap:8px;">${item.numbers.map(n=>`<div class="ball ai-ball" style="width:30px;height:30px;font-size:12px;">${pad2(n)}</div>`).join("")}</div>
        </div>`).join("");
}

function clearFavorites() {
    if (confirm("確定清空所有紀錄？")) { localStorage.removeItem('v5_favorites'); renderFavorites(); showToast("已清空", true); }
}

// --- 頁面切換 ---
function initTabs() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
            document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
            
            const targetId = item.getAttribute("data-target");
            const targetEl = document.getElementById(targetId);
            if(targetEl) targetEl.classList.remove("hidden");
            
            item.classList.add("active");
            window.scrollTo(0,0);
        });
    });
}

// --- 勝率回測系統 ---
async function runBacktest() {
    const btn = document.getElementById("btn-run-bt");
    const listArea = document.getElementById("bt-list");
    const statsArea = document.getElementById("bt-stats-panel");
    
    if (!globalHistoryData || globalHistoryData.length < 10) {
        showToast("歷史數據不足，無法執行回測", true);
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 回測運算中...';
    listArea.innerHTML = "";
    statsArea.innerHTML = "";

    await new Promise(r => setTimeout(r, 800)); // 模擬運算感

    let hitsTotal = 0;
    let html = "";
    const testCount = 5; 

    for (let i = 0; i < testCount; i++) {
        if(!globalHistoryData[i] || !globalHistoryData[i+1]) continue;
        const targetDraw = globalHistoryData[i];
        const trainData = globalHistoryData.slice(i + 1, i + 21); 
        
        const freqs = {};
        trainData.forEach(d => {
            let nums = d.drawNumberSize || d.numbers || [];
            nums.forEach(n => freqs[n] = (freqs[n] || 0) + 1);
        });
        
        const predicted = Object.entries(freqs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(x => parseInt(x[0]));
        
        const actual = targetDraw.drawNumberSize || targetDraw.numbers || [];
        const hits = predicted.filter(n => actual.includes(n));
        hitsTotal += hits.length;

        let dateStr = cleanDateStr(targetDraw.lotteryDate || targetDraw.date);
        
        html += `
        <div class="list-item" style="flex-direction: column; align-items: flex-start; gap: 10px;">
            <div style="font-size: 12px; color: #94a3b8;">第 ${targetDraw.period} 期 (${dateStr})</div>
            <div style="display: flex; gap: 15px; width: 100%;">
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: #3b82f6; margin-bottom: 5px;"><i class="fas fa-robot"></i> 趨勢預測</div>
                    <div class="balls-display" style="gap: 4px;">${predicted.map(n => `<div class="ball ai-ball" style="width:26px;height:26px;font-size:11px;">${pad2(n)}</div>`).join("")}</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: #e2e8f0; margin-bottom: 5px;"><i class="fas fa-trophy"></i> 實際開出</div>
                    <div class="balls-display" style="gap: 4px;">${actual.map(n => `<div class="ball ${hits.includes(n) ? 'ai-ball' : ''}" style="width:26px;height:26px;font-size:11px;${hits.includes(n) ? 'box-shadow: 0 0 8px #3b82f6;' : ''}">${pad2(n)}</div>`).join("")}</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #10b981; align-self: flex-end; font-weight: bold;">命中 ${hits.length} 碼</div>
        </div>`;
    }

    statsArea.innerHTML = `
        <div style="padding: 15px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; text-align: center;">
            <div style="font-size: 14px; color: #e2e8f0;">近 ${testCount} 期總命中</div>
            <div style="font-size: 28px; font-weight: bold; color: #3b82f6; margin: 5px 0;">${hitsTotal} 顆</div>
        </div>
    `;
    listArea.innerHTML = html;

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-redo"></i> 重新執行回測';
}
