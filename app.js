/**
 * 539 AI 預測中心 V4.1 - 完整核心邏輯
 */
const API_URL = "https://lottery-k099.onrender.com/api/predict";
let globalHistoryData = []; // 儲存歷史紀錄

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    loadLatestData();
    
    // 綁定按鈕
    document.getElementById("btn-run-ai").addEventListener("click", runGeminiAI);
    document.getElementById("btn-reload").addEventListener("click", loadLatestData);
    document.getElementById("btn-clear-fav").addEventListener("click", clearFavorites);
    
    // 載入收藏
    renderFavorites();
});

// --- 工具函式 ---
function pad2(num) { return String(num).padStart(2, "0"); }

function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

// --- 分頁切換邏輯 ---
function initTabs() {
    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.getAttribute("data-target");
            
            // 隱藏所有頁面，取消所有按鈕亮起
            pages.forEach(p => p.classList.add("hidden"));
            navItems.forEach(n => n.classList.remove("active"));
            
            // 顯示目標頁面，亮起點擊的按鈕
            document.getElementById(targetId).classList.remove("hidden");
            item.classList.add("active");
        });
    });
}

// --- 資料抓取 (更強壯的寫法) ---
async function loadLatestData() {
    try {
        // 嘗試多個可能路徑，確保一定抓得到資料
        const urls = [`./latest.json?t=${Date.now()}`, `../latest.json?t=${Date.now()}`, `/lottery/latest.json?t=${Date.now()}`];
        let data = null;

        for (let url of urls) {
            try {
                let res = await fetch(url);
                if (res.ok) { data = await res.json(); break; }
            } catch (e) {}
        }

        if (!data) throw new Error("全部路徑皆找不到 latest.json");

        // 防錯解析：因為 JSON 格式可能被包裝過
        let latest = data.daily539 || (Array.isArray(data) ? data[0] : data);
        
        // 渲染首頁最新開獎
        document.getElementById("draw-period").textContent = latest.period || latest.drawTerm || "未知";
        document.getElementById("draw-date").textContent = latest.date || latest.lotteryDate || "未知";
        
        let numbers = latest.numbers || latest.drawNumberSize || [];
        document.getElementById("latest-balls").innerHTML = numbers.map(n => `<div class="ball">${pad2(n)}</div>`).join("");

        // 儲存歷史紀錄供歷史頁面使用
        globalHistoryData = data.recent50 || data.recent5 || [latest];
        renderHistory();

        showToast("開獎資料已同步");
    } catch (error) {
        console.error("載入資料失敗:", error);
        document.getElementById("latest-balls").innerHTML = `<div style="color: #ef4444; font-size:14px;">資料載入失敗，請確認 GitHub 是否有最新資料</div>`;
    }
}

// --- AI 預測 ---
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
            const detailsHtml = data.details.map((d, i) => `
                <div class="ai-row">
                    <span>${i+1}. 號碼 <b>${pad2(d.num)}</b></span>
                    <span class="ai-score">權重: ${d.score.toFixed(2)}</span>
                </div>
            `).join("");
            const numsStr = data.predicted_numbers.join(',');

            outputArea.innerHTML = `
                <div style="margin-bottom:10px; font-weight:bold; color:white;">下期預測號碼：</div>
                <div class="balls-display">${ballsHtml}</div>
                <div class="ai-details">
                    <div style="margin-bottom:8px; color:white;">隨機森林模型權重：</div>
                    ${detailsHtml}
                </div>
                <button class="action-btn secondary-btn" style="margin-top:15px; background: rgba(59, 130, 246, 0.2); color: #60a5fa;" onclick="saveFavorite('${numsStr}')">
                    <i class="fas fa-star"></i> 收藏這組號碼
                </button>
            `;
            outputArea.classList.remove("hidden");
            btn.innerHTML = `<i class="fas fa-check"></i> 預測完成`;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        outputArea.innerHTML = `<div style="color: #ef4444;">⚠️ 連線超時，伺服器可能正在休眠，請重試。</div>`;
        outputArea.classList.remove("hidden");
        btn.innerHTML = `<i class="fas fa-bolt"></i> 重新啟動 AI`;
    } finally {
        btn.disabled = false;
    }
}

// --- 歷史紀錄渲染 ---
function renderHistory() {
    const container = document.getElementById("history-list");
    if (!globalHistoryData.length) {
        container.innerHTML = "<p class='desc-text'>暫無歷史資料</p>";
        return;
    }

    container.innerHTML = globalHistoryData.map((item, i) => {
        let nums = item.numbers || item.drawNumberSize || [];
        let ballsHtml = nums.map(n => `<div class="ball" style="width:34px; height:34px; font-size:14px;">${pad2(n)}</div>`).join("");
        return `
            <div class="list-item">
                <div class="list-header">
                    <span>${item.date || ""}</span>
                    <span>第 ${item.period || ""} 期</span>
                </div>
                <div class="balls-display">${ballsHtml}</div>
            </div>
        `;
    }).join("");
}

// --- 收藏號碼功能 ---
function saveFavorite(numsStr) {
    const nums = numsStr.split(',').map(Number);
    let favs = JSON.parse(localStorage.getItem('v4_favorites') || '[]');
    
    const now = new Date();
    const dateStr = `${now.getMonth()+1}/${now.getDate()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    
    favs.unshift({ date: dateStr, numbers: nums });
    localStorage.setItem('v4_favorites', JSON.stringify(favs));
    
    showToast("已加入收藏！");
    renderFavorites(); // 更新收藏頁面
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    let favs = JSON.parse(localStorage.getItem('v4_favorites') || '[]');
    
    if (!favs.length) {
        container.innerHTML = "<p class='desc-text'>您還沒有收藏任何號碼，請至首頁進行 AI 預測並收藏。</p>";
        return;
    }

    container.innerHTML = favs.map(item => {
        let ballsHtml = item.numbers.map(n => `<div class="ball ai-ball" style="width:36px; height:36px; font-size:15px;">${pad2(n)}</div>`).join("");
        return `
            <div class="list-item">
                <div class="list-header">
                    <span>收藏時間：${item.date}</span>
                </div>
                <div class="balls-display">${ballsHtml}</div>
            </div>
        `;
    }).join("");
}

function clearFavorites() {
    if (confirm("確定要清空所有收藏號碼嗎？")) {
        localStorage.removeItem('v4_favorites');
        renderFavorites();
        showToast("已清空收藏", true);
    }
}
