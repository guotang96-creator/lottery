// ==========================================
// 📱 底部導覽列「多頁面切換」邏輯
// ==========================================
function switchPage(targetPageId) {
    // 1. 把所有頁面隱藏
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // 2. 把底部導覽列的按鈕熄滅
    const allNavBtns = document.querySelectorAll('.bottom-nav .nav-item');
    allNavBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. 讓點擊的頁面現身
    const targetPage = document.getElementById(`page-${targetPageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 4. 讓點擊的按鈕亮起
    const targetNavBtn = document.getElementById(`nav-${targetPageId}`);
    if (targetNavBtn) {
        targetNavBtn.classList.add('active');
    }
}

// ==========================================
// 🧠 AI 預測核心 API 串接邏輯
// ==========================================
let currentGame = '';
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; // 您的 Render 後端網址

// 彩種名稱對照表
const gameNames = {
    '539': '今彩 539',
    'daily': '天天樂',
    'lotto': '大樂透',
    'weili': '威力彩',
    'marksix': '六合彩'
};

// 點擊上方彩種按鈕時觸發
function setGame(gameCode) {
    currentGame = gameCode;
    
    // 更新上方 UI 顯示名稱
    document.getElementById('current-game-title').innerText = gameNames[gameCode];
    
    // 切換按鈕亮起狀態
    const btns = document.querySelectorAll('.game-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 立刻去雲端抓資料
    fetchPrediction(gameCode);
}

// 實際去 Render 後端抓資料
async function fetchPrediction(gameCode) {
    if (!gameCode) {
        alert("請先選擇一個彩種！");
        return;
    }

    const statusEl = document.getElementById('sync-status');
    const latestBallsEl = document.getElementById('latest-balls');
    const predictionContentEl = document.getElementById('prediction-content');

    // 顯示載入中
    statusEl.innerText = "🔄 雲端矩陣運算中...";
    latestBallsEl.innerHTML = '<div class="loading-text">連線至資料庫...</div>';
    predictionContentEl.innerHTML = '<div class="loading-text">AI 模型推演中...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/${gameCode}`);
        const data = await response.json();

        if (data.status === "success") {
            statusEl.innerText = `✅ 第 ${data.latest_period} 期`;
            
            // 繪製最新開獎號碼球
            latestBallsEl.innerHTML = data.latest_numbers.map(num => 
                `<div class="ball">${num}</div>`
            ).join('');

            // 繪製 AI 預測號碼球 (主推 6 碼)
            const mainPredict = data.predicted.slice(0, 6);
            let predictHtml = `
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">🔥 主力推薦區：</p>
                <div class="balls-container" style="margin-top:0;">
                    ${mainPredict.map(num => `<div class="ball">${num}</div>`).join('')}
                </div>
            `;
            predictionContentEl.innerHTML = predictHtml;

        } else {
            throw new Error(data.message || "資料格式異常");
        }
    } catch (error) {
        console.error("API 錯誤:", error);
        statusEl.innerText = "❌ 連線失敗";
        latestBallsEl.innerHTML = `<div class="error-text">API 尚未就緒 (${error.message})</div>`;
        predictionContentEl.innerHTML = `<div class="error-text">請等待伺服器甦醒後重試</div>`;
    }
}
