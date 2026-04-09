/**
 * 彩券 AI 分析中心 V5.2 - 雙核心引擎驅動版
 */
const API_BASE = "https://lottery-k099.onrender.com";
let currentType = "539"; // 預設為 539
let globalHistoryData = []; 

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initTypeSelector(); // 💡 新增：彩種切換監聽
    loadLatestData();
    
    document.getElementById("btn-run-ai").addEventListener("click", runGeminiAI);
    document.getElementById("btn-reload").addEventListener("click", loadLatestData);
    document.getElementById("btn-clear-fav").addEventListener("click", () => {
        if(confirm("確定清空紀錄？")) { localStorage.removeItem('v5_favorites'); renderFavorites(); }
    });
    
    renderFavorites();
});

// --- 切換彩種邏輯 ---
function initTypeSelector() {
    const btn539 = document.getElementById("tab-539");
    const btnDaily = document.getElementById("tab-daily");
    const descText = document.getElementById("ai-desc");
    const placeholderText = document.getElementById("ai-placeholder-text");

    btn539.addEventListener("click", () => {
        currentType = "539";
        updateUI("539");
    });

    btnDaily.addEventListener("click", () => {
        currentType = "daily";
        updateUI("daily");
    });

    function updateUI(type) {
        if(type === "539") {
            btn539.style.background = "rgba(59,130,246,0.2)"; btn539.style.borderColor = "#3b82f6"; btn539.style.color = "white";
            btnDaily.style.background = "rgba(255,255,255,0.05)"; btnDaily.style.borderColor = "rgba(255,255,255,0.1)"; btnDaily.style.color = "#94a3b8";
            descText.textContent = "目前針對 [今彩 539] 執行深度學習趨勢分析。";
            placeholderText.textContent = "539 分析引擎就緒，準備產生推薦號碼";
        } else {
            btnDaily.style.background = "rgba(59,130,246,0.2)"; btnDaily.style.borderColor = "#3b82f6"; btnDaily.style.color = "white";
            btn539.style.background = "rgba(255,255,255,0.05)"; btn539.style.borderColor = "rgba(255,255,255,0.1)"; btn539.style.color = "#94a3b8";
            descText.textContent = "目前針對 [加州天天樂] 執行深度學習趨勢分析。";
            placeholderText.textContent = "天天樂分析引擎就緒，準備產生推薦號碼";
        }
        // 切換時清空舊預測
        document.getElementById("ai-output-area").classList.add("analysis-placeholder");
        document.getElementById("ai-output-area").innerHTML = `
            <div style="text-align: center; padding: 25px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 16px;">
                <i class="fas fa-microchip" style="font-size: 26px; color: #3b82f6; margin-bottom: 12px; opacity: 0.3;"></i>
                <div style="font-size: 13px; color: #64748b;">已切換，請點擊下方按鈕開始分析</div>
            </div>`;
    }
}

// --- 核心分析函數 ---
async function runGeminiAI() {
    const btn = document.getElementById("btn-run-ai");
    const outputArea = document.getElementById("ai-output-area");
    btn.disabled = true;
    
    // 💡 根據 currentType 選取 API 路徑
    const apiPath = currentType === "539" ? "/api/predict" : "/api/predict_daily";
    const label = currentType === "539" ? "539" : "天天樂";

    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在執行 ${label} 分析...`;
    outputArea.innerHTML = `<div style="text-align:center; padding:25px; color:#60a5fa;"><i class="fas fa-brain fa-spin"></i> 正在回溯 7 期大數據走勢...</div>`;

    try {
        const res = await fetch(`${API_BASE}${apiPath}`);
        const data = await res.json();
        if (data.status === "success") {
            const ballsHtml = data.predicted_numbers.map(n => `<div class="ball ai-ball">${String(n).padStart(2,"0")}</div>`).join("");
            const detailsHtml = data.details.map((d, i) => `
                <div class="ai-row"><span>${i+1}. 號碼 <b>${String(d.num).padStart(2,"0")}</b></span><span class="ai-score">權重: ${d.score.toFixed(2)}</span></div>`).join("");
            
            outputArea.innerHTML = `
                <div style="padding: 15px; background: rgba(0,0,0,0.2); border-radius: 16px;">
                    <div style="margin-bottom:12px; font-weight:bold; color:#e2e8f0; font-size:14px;">${label} 本期分析建議：</div>
                    <div class="balls-display">${ballsHtml}</div>
                    <div class="ai-details" style="margin-top:15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">
                        ${detailsHtml}
                    </div>
                    <button class="action-btn secondary-btn" style="margin-top:15px;" onclick="saveFavorite('${data.predicted_numbers.join(',')}', '${label}')">收藏分析結果</button>
                </div>`;
            btn.innerHTML = `<i class="fas fa-check-circle"></i> 分析完成`;
        } else throw new Error();
    } catch (err) {
        outputArea.innerHTML = `<div style="color:#fca5a5; padding:15px; text-align:center;">⚠️ 伺服器正在叫醒中，請再點一次！</div>`;
        btn.innerHTML = `<i class="fas fa-redo"></i> 再次嘗試`;
    } finally { btn.disabled = false; }
}

// --- 其餘數據處理 (loadLatestData, renderHistory 等保持 V5.1 邏輯) ---
async function loadLatestData() {
    try {
        const timestamp = Date.now();
        const res = await fetch(`./latest.json?t=${timestamp}`);
        if (!res.ok) return;
        const data = await res.json();
        let latest = data.daily539 || (Array.isArray(data) ? data[0] : data);
        document.getElementById("draw-period").textContent = latest.period || "---";
        document.getElementById("draw-date").textContent = (latest.lotteryDate || latest.date || "").split('T')[0];
        
        if (data.updatedAt) {
            const d = new Date(data.updatedAt);
            document.getElementById("update-time").textContent = `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }
        let nums = latest.drawNumberSize || latest.numbers || [];
        document.getElementById("latest-balls").innerHTML = nums.map(n => `<div class="ball">${String(n).padStart(2,"0")}</div>`).join("");
        globalHistoryData = data.recent50 || [];
        renderHistory();
    } catch (e) {}
}

function renderHistory() {
    const container = document.getElementById("history-list");
    container.innerHTML = globalHistoryData.map(item => {
        let nums = item.drawNumberSize || item.numbers || [];
        let cleanDate = (item.lotteryDate || item.date || "").split('T')[0];
        return `<div class="list-item"><div>${cleanDate} | 期數: ${item.period}</div><div class="balls-display">${nums.map(n=>`<div class="ball" style="width:30px;height:30px;">${String(n).padStart(2,"0")}</div>`).join("")}</div></div>`;
    }).join("");
}

function saveFavorite(numsStr, label) {
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    favs.unshift({ date: new Date().toLocaleString(), label: label, numbers: numsStr.split(',').map(Number) });
    localStorage.setItem('v5_favorites', JSON.stringify(favs));
    showToast("已收藏 " + label + " 分析");
    renderFavorites();
}

function renderFavorites() {
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    const container = document.getElementById("favorites-list");
    if(!favs.length) return container.innerHTML = "<p>暫無收藏</p>";
    container.innerHTML = favs.map(item => `
        <div class="list-item">
            <div>[${item.label}] ${item.date}</div>
            <div class="balls-display">${item.numbers.map(n=>`<div class="ball ai-ball" style="width:30px;height:30px;">${String(n).padStart(2,"0")}</div>`).join("")}</div>
        </div>`).join("");
}

function showToast(m) {
    const t = document.getElementById("toast"); t.textContent = m; t.classList.remove("hidden");
    setTimeout(()=>t.classList.add("hidden"), 2000);
}

function initTabs() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
            document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
            document.getElementById(item.getAttribute("data-target")).classList.remove("hidden");
            item.classList.add("active");
        });
    });
}
