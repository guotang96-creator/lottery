/**
 * 539 AI 預測系統 - 核心邏輯控制 (穩定版)
 * 串接 GitHub Pages 前端 與 Render Python API 後端
 */

// [1] 配置區：Render 伺服器網址 (請確保結尾沒有斜線)
const AI_API_BASE = "https://lottery-k099.onrender.com";

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 539 AI 系統啟動...");

    // 初始化載入面板資料
    await initDashboard();

    // [2] 綁定功能按鈕
    const btnGemini = document.getElementById('btn-gemini');
    const btnOpenAI = document.getElementById('btn-openai');
    const btnRefresh = document.getElementById('btnRefresh');

    if (btnGemini) {
        btnGemini.addEventListener('click', () => callAiApi('Gemini'));
    }
    if (btnOpenAI) {
        btnOpenAI.addEventListener('click', () => callAiApi('ChatGPT'));
    }
    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            btnRefresh.innerText = "讀取中...";
            await initDashboard();
            btnRefresh.innerText = "重新載入資料";
        });
    }

    // [3] 底部導覽列切換邏輯 (防止功能不見)
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            console.log("切換至頁面:", this.innerText);
            // 這裡可以根據 innerText 切換顯示不同的 section
        });
    });
});

/**
 * [4] 初始化面板：從 latest.json 抓取最新開獎資訊
 */
async function initDashboard() {
    const heroUpdate = document.getElementById('heroUpdateText');
    try {
        const res = await fetch('./latest.json');
        if (!res.ok) throw new Error("找不到 latest.json");
        
        let data = await res.json();
        
        // 相容性檢查：如果資料是陣列格式 [ {...} ]
        if (Array.isArray(data)) {
            data = data[0];
        }

        console.log("目前資料:", data);

        // 更新期數與日期 (嘗試所有可能的欄位名稱)
        const issueElem = document.getElementById('latestIssue');
        const dateElem = document.getElementById('latestDate');
        if (issueElem) issueElem.innerText = data.latest_draw || data.period || data.latest_issue || '--';
        if (dateElem) dateElem.innerText = data.date || '--';

        // 更新開獎號碼球
        const ballArea = document.getElementById('latestBalls');
        if (ballArea && data.numbers) {
            ballArea.innerHTML = data.numbers.map(num => 
                `<span class="ball">${num}</span>`
            ).join('');
        }

        // 更新快速分析區
        const hotElem = document.getElementById('hotNumbersText');
        const coldElem = document.getElementById('coldNumbersText');
        if (hotElem) hotElem.innerText = data.hot_numbers ? data.hot_numbers.join(', ') : '--';
        if (coldElem) coldElem.innerText = data.cold_numbers ? data.cold_numbers.join(', ') : '--';

        // 更新 Meta 資訊
        const sourceElem = document.getElementById('dataSourceText');
        const updateTimeElem = document.getElementById('dataUpdatedText');
        if (sourceElem) sourceElem.innerText = "資料來源：本地資料庫 (JSON)";
        if (updateTimeElem) updateTimeElem.innerText = `更新時間：${new Date().toLocaleTimeString()}`;

        if (heroUpdate) heroUpdate.innerText = "資料同步成功，系統運作中";

    } catch (err) {
        console.error("初始化失敗:", err);
        if (heroUpdate) heroUpdate.innerText = "資料載入失敗，請確認 latest.json 格式";
    }
}

/**
 * [5] 呼叫 AI API：連動 Render 上的 Python 大腦
 */
async function callAiApi(modelName) {
    const aiResultArea = document.getElementById('ai-result');
    if (!aiResultArea) return;

    // 顯示載入動畫狀態
    aiResultArea.innerHTML = `
        <div class="ai-loading">
            <p>🔮 ${modelName} 正在運算隨機森林分析...</p>
            <p style="font-size: 0.8em; color: #aaa;">(首次連線約需 40-50 秒喚醒 Render 伺服器)</p>
        </div>
    `;

    try {
        // 發送請求給 Render
        const response = await fetch(`${AI_API_BASE}/api/predict`);
        if (!response.ok) throw new Error("伺服器無回應");
        
        const data = await response.json();

        if (data.status === 'success') {
            displayAiResult(data, modelName);
        } else {
            throw new Error(data.message || "預測失敗");
        }
    } catch (err) {
        console.error("AI 連線失敗:", err);
        aiResultArea.innerHTML = `
            <div class="ai-error">
                ⚠️ 連線超時：AI 大腦正在起床中，請於 30 秒後重新點擊分析。
            </div>
        `;
    }
}

/**
 * [6] 顯示結果：渲染預測球號與演算法細節
 */
function displayAiResult(data, modelName) {
    const aiResultArea = document.getElementById('ai-result');
    if (!aiResultArea) return;

    let html = `
        <div class="ai-success-content">
            <h3 style="color: #4facfe; margin-bottom: 15px;">✨ ${modelName} AI 預測號碼</h3>
            <div class="balls-row">
                ${data.predicted_numbers.map(num => `<span class="ball ai-ball">${num}</span>`).join('')}
            </div>
            <div class="ai-details-box" style="margin-top: 20px; text-align: left; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
                <p style="font-size: 0.85em; color: #888; margin-bottom: 8px;">Random Forest 權重分析：</p>
                ${data.details.map((d, index) => `
                    <div style="font-size: 0.85em; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>${index + 1}. 號碼 <b style="color:#fff;">${d.num}</b></span>
                        <span style="color: #4facfe;">指數: ${d.score.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    aiResultArea.innerHTML = html;
}
