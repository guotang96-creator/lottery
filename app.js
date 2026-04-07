/**
 * 539 AI 預測中心 V4.0 - 核心邏輯
 */
const API_URL = "https://lottery-k099.onrender.com/api/predict";

// 1. 啟動系統
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 V4.0 系統啟動");
    loadLatestData();
    
    // 綁定 AI 按鈕
    document.getElementById("btn-run-ai").addEventListener("click", runGeminiAI);
});

// 2. 補零工具
function pad2(num) {
    return String(num).padStart(2, "0");
}

// 3. 載入最新開獎資料
async function loadLatestData() {
    try {
        // 加上時間戳防止快取
        const res = await fetch(`./latest.json?t=${Date.now()}`);
        if (!res.ok) throw new Error("找不到 latest.json");
        
        let data = await res.json();
        if (Array.isArray(data)) data = data[0]; // 防錯

        document.getElementById("draw-period").textContent = data.period || "未知";
        document.getElementById("draw-date").textContent = data.date || "未知";

        const ballsHtml = (data.numbers || []).map(n => `<div class="ball">${pad2(n)}</div>`).join("");
        document.getElementById("latest-balls").innerHTML = ballsHtml;

    } catch (error) {
        console.error("載入資料失敗:", error);
        document.getElementById("latest-balls").innerHTML = `<div style="color: #ef4444; font-size:14px;">資料載入失敗，請確認 latest.json 檔案</div>`;
    }
}

// 4. 呼叫 Gemini AI
async function runGeminiAI() {
    const btn = document.getElementById("btn-run-ai");
    const outputArea = document.getElementById("ai-output-area");

    // 狀態切換
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 雲端運算中 (約 40 秒)...`;
    outputArea.classList.add("hidden");

    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (data.status === "success") {
            // 渲染球號
            const ballsHtml = data.predicted_numbers.map(n => `<div class="ball ai-ball">${pad2(n)}</div>`).join("");
            
            // 渲染明細
            const detailsHtml = data.details.map((d, i) => `
                <div class="ai-row">
                    <span>${i+1}. 號碼 <b>${pad2(d.num)}</b></span>
                    <span class="ai-score">權重: ${d.score.toFixed(2)}</span>
                </div>
            `).join("");

            // 組裝畫面
            outputArea.innerHTML = `
                <div style="margin-bottom:10px; font-weight:bold; color:white;">下期預測號碼：</div>
                <div class="balls-display">${ballsHtml}</div>
                <div class="ai-details">
                    <div style="margin-bottom:8px;">Random Forest 權重解析：</div>
                    ${detailsHtml}
                </div>
            `;
            outputArea.classList.remove("hidden");
            btn.innerHTML = `<i class="fas fa-check"></i> 預測完成`;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("AI 錯誤:", error);
        outputArea.innerHTML = `<div style="color: #ef4444;">⚠️ 連線超時，伺服器可能正在休眠，請等 30 秒後重試。</div>`;
        outputArea.classList.remove("hidden");
        btn.innerHTML = `<i class="fas fa-bolt"></i> 重新啟動 AI`;
    } finally {
        btn.disabled = false;
    }
}
