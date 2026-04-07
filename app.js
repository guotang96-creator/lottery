// ==========================================
// 1. 設定區：Render 伺服器網址
// ==========================================
const AI_API_BASE = "https://lottery-k099.onrender.com";

// ==========================================
// 2. 頁面初始化 (啟動時執行)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("系統啟動中...");
    
    // 執行原有功能：載入最新的 539 開獎資料
    await initDashboard();

    // 綁定 AI 按鈕事件
    const geminiBtn = document.querySelector('.btn-gemini');
    const chatGptBtn = document.querySelector('.btn-gpt');
    if (geminiBtn) geminiBtn.addEventListener('click', () => callAiApi('Gemini'));
    if (chatGptBtn) chatGptBtn.addEventListener('click', () => callAiApi('ChatGPT'));

    // 綁定原本的「立即預測」按鈕 (如果有)
    const predictBtn = document.querySelector('.btn-predict');
    if (predictBtn) {
        predictBtn.addEventListener('click', () => {
            alert("正在執行基礎機率預測...");
            // 這裡可以放您原本的基礎預測邏輯
        });
    }
});

// ==========================================
// 3. 原有功能恢復：載入 latest.json 並更新畫面
// ==========================================
async function initDashboard() {
    try {
        const response = await fetch('./latest.json');
        if (!response.ok) throw new Error('無法載入最新資料');
        const data = await response.json();
        
        // 更新開獎期數與日期
        document.querySelector('.latest-draw-id').innerText = data.latest_draw || '---';
        document.querySelector('.latest-date').innerText = data.date || '---';

        // 更新開獎號碼球 (07, 11, 17, 31, 34)
        const ballContainer = document.querySelector('.latest-balls');
        if (ballContainer && data.numbers) {
            ballContainer.innerHTML = data.numbers.map(num => 
                `<span class="ball">${num}</span>`
            ).join('');
        }

        // 更新原本的快速分析區 (熱門、冷門等)
        // 假設您的 JSON 裡有這些欄位，請根據實際欄位名修改
        if (data.hot_numbers) document.querySelector('.hot-numbers').innerText = data.hot_numbers.join(' ');
        if (data.cold_numbers) document.querySelector('.cold-numbers').innerText = data.cold_numbers.join(' ');
        
        console.log("主面板資料更新完成");
    } catch (error) {
        console.error("初始化失敗:", error);
    }
}

// ==========================================
// 4. AI 功能：呼叫 Render 大腦
// ==========================================
async function callAiApi(modelName) {
    const resultArea = document.querySelector('.ai-result-area');
    const errorMsg = document.querySelector('.error-msg');
    const loadingText = document.querySelector('.loading-text');

    resultArea.style.display = 'none';
    errorMsg.style.display = 'none';
    loadingText.style.display = 'block';
    loadingText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${modelName} 分析中... (首次啟動約需 50 秒)`;

    try {
        const response = await fetch(`${AI_API_BASE}/api/predict`);
        const data = await response.json();

        if (data.status === 'success') {
            displayAiResult(data, modelName);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        loadingText.style.display = 'none';
        errorMsg.style.display = 'block';
        errorMsg.innerText = `連線失敗: ${error.message}`;
    }
}

// ==========================================
// 5. 渲染 AI 結果 (並修復 undefined Bug)
// ==========================================
function displayAiResult(data, modelName) {
    const resultArea = document.querySelector('.ai-result-area');
    const loadingText = document.querySelector('.loading-text');
    const numberContainer = document.querySelector('.ai-predicted-numbers');
    const detailList = document.querySelector('.algo-details');

    loadingText.style.display = 'none';
    resultArea.style.display = 'block';

    // 顯示預測球號
    numberContainer.innerHTML = data.predicted_numbers.map(num => 
        `<span class="ball ai-ball">${num}</span>`
    ).join('');

    // 【重要修復】修正 undefined 問題
    detailList.innerHTML = data.details.map((detail, index) => `
        <div class="detail-item">
            ${index + 1}. 號碼 <span class="highlight">${detail.num}</span> 的 AI 權重指數為 ${detail.score.toFixed(2)}
        </div>
    `).join('');
}
