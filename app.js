// [設定] Render 伺服器網址 (請確認結尾無斜線)
const AI_API_BASE = "https://lottery-k099.onrender.com";

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 系統啟動...");
    
    // 1. 初始化資料顯示
    await initDashboard();

    // 2. 綁定按鈕事件
    const btnGemini = document.getElementById('btn-gemini');
    const btnOpenAI = document.getElementById('btn-openai');
    const btnRefresh = document.getElementById('btnRefresh');

    if (btnGemini) btnGemini.onclick = () => callAiApi('Gemini');
    if (btnOpenAI) btnOpenAI.onclick = () => callAiApi('ChatGPT');
    if (btnRefresh) btnRefresh.onclick = () => initDashboard();
});

// [功能] 載入本地最新資料庫
async function initDashboard() {
    const heroUpdate = document.getElementById('heroUpdateText');
    try {
        const res = await fetch('./latest.json');
        if (!res.ok) throw new Error("找不到資料庫檔案");
        const data = await res.json();

        // 更新期數、日期、球號
        document.getElementById('latestIssue').innerText = data.latest_draw || '--';
        document.getElementById('latestDate').innerText = data.date || '--';
        
        const ballArea = document.getElementById('latestBalls');
        if (ballArea && data.numbers) {
            ballArea.innerHTML = data.numbers.map(n => `<span class="ball">${n}</span>`).join('');
        }

        // 更新冷熱號
        const hotText = document.getElementById('hotNumbersText');
        const coldText = document.getElementById('coldNumbersText');
        if (hotText) hotText.innerText = data.hot_numbers ? data.hot_numbers.join(', ') : '--';
        if (coldText) coldText.innerText = data.cold_numbers ? data.cold_numbers.join(', ') : '--';

        // 更新 Meta
        document.getElementById('dataSourceText').innerText = "資料來源：GitHub 本地庫";
        document.getElementById('dataUpdatedText').innerText = `更新時間：${new Date().toLocaleTimeString()}`;
        if (heroUpdate) heroUpdate.innerText = "資料同步成功，系統運作中";

    } catch (e) {
        console.error("初始化失敗:", e);
        if (heroUpdate) heroUpdate.innerText = "資料載入失敗，請檢查 latest.json";
    }
}

// [功能] 呼叫 Render AI 大腦
async function callAiApi(modelName) {
    const resultArea = document.getElementById('ai-result');
    if (!resultArea) return;

    // 顯示載入動畫
    resultArea.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <p>🧠 ${modelName} 正在運算隨機森林模型...</p>
            <p style="font-size:0.8em; color:#aaa;">(Render 喚醒需時 40-50 秒，請勿關閉視窗)</p>
        </div>
    `;

    try {
        const response = await fetch(`${AI_API_BASE}/api/predict`);
        const data = await response.json();

        if (data.status === 'success') {
            displayAiResult(data, modelName);
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        resultArea.innerHTML = `<div style="color:#ff6b6b; padding:15px;">⚠️ 連線超時：AI 大腦起床慢了點，請等一分鐘後再次點擊分析。</div>`;
    }
}

// [功能] 渲染預測結果 (修復 undefined)
function displayAiResult(data, modelName) {
    const resultArea = document.getElementById('ai-result');
    
    let html = `
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
            <h3 style="color:#4facfe; margin-bottom:15px;">✨ ${modelName} 預測結果</h3>
            <div class="balls-row">
                ${data.predicted_numbers.map(n => `<span class="ball ai-ball">${n}</span>`).join('')}
            </div>
            <div style="margin-top:20px; border-top:1px solid #333; pt:15px;">
                <p style="font-size:0.9em; color:#888; margin-bottom:10px;">機器學習細節：</p>
                ${data.details.map((d, i) => `
                    <div style="font-size:0.85em; margin-bottom:5px; display:flex; justify-content:space-between;">
                        <span>${i+1}. 號碼 <b style="color:#fff;">${d.num}</b></span>
                        <span style="color:#4facfe;">權重指數：${d.score.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    resultArea.innerHTML = html;
}
