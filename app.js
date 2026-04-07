// 1. 設定 Render 網址
const AI_API_BASE = "https://lottery-k099.onrender.com";

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 系統啟動...");
    
    // 執行初始化，但就算失敗也不要讓程式當掉
    initDashboard().catch(err => console.log("初始化小提醒:", err.message));

    // 綁定按鈕：Gemini
    const geminiBtn = document.querySelector('.btn-gemini');
    if (geminiBtn) {
        geminiBtn.addEventListener('click', () => callAiApi('Gemini'));
    }

    // 綁定按鈕：ChatGPT
    const gptBtn = document.querySelector('.btn-gpt');
    if (gptBtn) {
        gptBtn.addEventListener('click', () => callAiApi('ChatGPT'));
    }
});

// 2. 初始化面板 (超級安全檢查版)
async function initDashboard() {
    const res = await fetch('./latest.json');
    if (!res.ok) return;
    const data = await res.json();
    
    // 安全地更新文字，找不到標籤就跳過
    const updateText = (selector, text) => {
        const el = document.querySelector(selector);
        if (el && text) el.innerText = text;
    };

    // 這裡會嘗試各種可能的標籤名稱
    updateText('.latest-draw-id', data.latest_draw);
    updateText('.latest-date', data.date);
    updateText('#latest-draw', data.latest_draw);
    updateText('#draw-date', data.date);

    // 更新號碼球
    const ballArea = document.querySelector('.latest-balls') || document.querySelector('#ball-container');
    if (ballArea && data.numbers) {
        ballArea.innerHTML = data.numbers.map(n => `<span class="ball">${n}</span>`).join('');
    }
    
    console.log("✅ 資料載入程序完成");
}

// 3. AI 分析功能
async function callAiApi(modelName) {
    const resultArea = document.querySelector('.ai-result-area');
    const loading = document.querySelector('.loading-text');
    const errorMsg = document.querySelector('.error-msg');

    if (loading) {
        loading.style.display = 'block';
        loading.innerText = `${modelName} 分析中... (首次啟動約需 50 秒)`;
    }
    if (resultArea) resultArea.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    try {
        const response = await fetch(`${AI_API_BASE}/api/predict`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayAiResult(data);
        }
    } catch (e) {
        if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = "連線失敗，請稍後再試。";
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function displayAiResult(data) {
    const resultArea = document.querySelector('.ai-result-area');
    const numContainer = document.querySelector('.ai-predicted-numbers');
    const details = document.querySelector('.algo-details');

    if (resultArea) resultArea.style.display = 'block';
    if (numContainer) numContainer.innerHTML = data.predicted_numbers.map(n => `<span class="ball ai-ball">${n}</span>`).join('');
    if (details) {
        details.innerHTML = data.details.map((d, i) => `
            <div class="detail-item">${i+1}. 號碼 <span class="highlight">${d.num}</span> 的權重: ${d.score.toFixed(2)}</div>
        `).join('');
    }
}
