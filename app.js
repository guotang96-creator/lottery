// 1. 設定您的 Render 伺服器網址
const AI_API_BASE = "https://lottery-k099.onrender.com";

// 等待網頁載入完成
document.addEventListener('DOMContentLoaded', () => {
    // 綁定按鈕事件
    const geminiBtn = document.querySelector('.btn-gemini');
    const chatGptBtn = document.querySelector('.btn-gpt');

    if (geminiBtn) geminiBtn.addEventListener('click', () => callAiApi('Gemini'));
    if (chatGptBtn) chatGptBtn.addEventListener('click', () => callAiApi('ChatGPT'));
});

// 2. 呼叫 AI API 的核心函式
async function callAiApi(modelName) {
    const resultArea = document.querySelector('.ai-result-area');
    const errorMsg = document.querySelector('.error-msg');
    const loadingText = document.querySelector('.loading-text');

    // 顯示載入中狀態
    resultArea.style.display = 'none';
    errorMsg.style.display = 'none';
    loadingText.style.display = 'block';
    loadingText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${modelName} 正在分析大數據，請稍候... (Render 喚醒約需 30-50 秒)`;

    try {
        // 呼叫 Render 後端 (使用之前設定好的 /api/predict 路徑)
        const response = await fetch(`${AI_API_BASE}/api/predict`);
        
        if (!response.ok) throw new Error('伺服器回應異常');
        
        const data = await response.json();

        if (data.status === 'success') {
            displayAiResult(data, modelName);
        } else {
            throw new Error(data.message || '分析失敗');
        }
    } catch (error) {
        console.error('API Error:', error);
        loadingText.style.display = 'none';
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = `分析失敗：${error.message} (請確認 Render 狀態或稍後再試)`;
    }
}

// 3. 將結果顯示在網頁上的函式
function displayAiResult(data, modelName) {
    const resultArea = document.querySelector('.ai-result-area');
    const loadingText = document.querySelector('.loading-text');
    const numberContainer = document.querySelector('.ai-predicted-numbers');
    const detailList = document.querySelector('.algo-details');
    const confidenceScore = document.querySelector('.confidence-score');

    loadingText.style.display = 'none';
    resultArea.style.display = 'block';

    // 顯示推薦球號
    numberContainer.innerHTML = data.predicted_numbers.map(num => 
        `<span class="ball ai-ball">${num}</span>`
    ).join('');

    // 顯示信心分數
    confidenceScore.innerHTML = `<span class="badge">最高模型信心指數：${Math.round(data.details[0].score * 100)} / 100</span>`;

    // 修正 undefined 問題：將詳細權重列表顯示出來
    detailList.innerHTML = data.details.map((detail, index) => `
        <div class="detail-item">
            ${index + 1}. 號碼 <span class="highlight">${detail.num}</span> 的演算法權重指數為 <span class="score">${detail.score.toFixed(2)}</span>
        </div>
    `).join('');

    // 加上版本標記
    const versionTag = document.querySelector('.version-tag');
    if (versionTag) versionTag.innerText = `版本：AI Stable Final (Render Edition)`;
}
