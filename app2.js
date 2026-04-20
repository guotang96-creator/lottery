// 👇 請全選 app2.js 檔案內容並刪除，換上這套修復版 👇

// PWA Service Worker 註冊 (維持不變)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(()=>{});
    });
}

let currentGame = '';
let currentHistoryData = []; 
let currentPrediction = []; 

// [重要] Render 伺服器的 API 基礎 URL (確認與舊版一致)
const API_BASE_URL = 'https://lottery-k099.onrender.com/api/predict'; 

// [V14 黃金權重參數]
const V14_WEIGHTS = { MEAN: 60, EMA: 0, MARKOV: 80, PENALTY: -15 };

const gameNames = { '539': '今彩 539', 'daily': '天天樂', 'lotto': '大樂透', 'weili': '威力彩', 'marksix': '六合彩' };
const fileMap = { '539': 'latest.json', 'daily': 'daily.json', 'lotto': 'lotto.json', 'weili': 'weili.json', 'marksix': 'marksix.json' };

function switchPage(pId) {
    ... (維持不變)
}

function setGame(g) {
    ... (維持不變)
}

// 🌟 V14 終極 loadData 函數：Render 聯網對獎修復版 🌟
async function loadData(g) {
    const sEl = document.getElementById('sync-status');
    const lBalls = document.getElementById('latest-balls');
    const pContent = document.getElementById('prediction-content');
    // [重要] 定義對獎區塊元素 (HTML 結構中已存在)
    const vBox = document.getElementById('ai-verify-box');

    sEl.innerText = "⏳ 數據同步中...";
    lBalls.innerHTML = '';
    pContent.innerHTML = '';
    // [重要] 預設隱藏對獎區塊
    vBox.style.display = 'none';

    try {
        // [重要] 升級為 Promise.all 同時發送請求到 Render (預測數據) 和 GitHub (歷史數據)
        const [rRes, gRes] = await Promise.all([
            fetch(`${API_BASE_URL}/${g}`), // 從 Render 伺服器獲取預測 (修復核心眼睛)
            fetch(`https://guotang96-creator.github.io/lottery/${fileMap[g]}?t=${Date.now()}`) // 從 GitHub 獲取歷史 (維持新版本地化邏輯)
        ]);
        
        const ai = await rRes.json();
        const gh = await gRes.json();

        currentHistoryData = gh.history || gh.recent50 || [];
        const latest = currentHistoryData[0];
        const dStr = (latest.date || latest.lotteryDate || "").split('T')[0];
        sEl.innerText = `✅ 第 ${latest.issue} 期 (${dStr})`;

        const nums = latest.numbers || latest.drawNumberSize || [];
        lBalls.innerHTML = nums.map(n => `<div class="ball">${n}</div>`).join('');

        // 🌟 修復對獎區塊顯示邏輯 🌟
        if (ai.status === "success") {
            // [重要] 檢查 Render 的數據，是否命中了
            if (ai.prev_predicted && ai.prev_predicted.length > 0) {
                vBox.style.display = 'block'; // 顯示區塊
                const hits = ai.hit_nums || [];
                document.getElementById('verify-hit-count').innerText = `命中 ${hits.length} 顆`;
                document.getElementById('verify-balls').innerHTML = ai.prev_predicted.map(n => `<div class="ball ${hits.includes(n)?'hit':'miss'}">${n}</div>`).join('');
            }
        }
        
        // 執行 V14 AI 預測運算 (在前端本地計算新號碼)
        runV14AI();

    } catch (e) { 
        console.error("V14 數據同步失敗:", e);
        sEl.innerText = "❌ 連線異常"; 
    }
}

// ... 其餘函數 (runV14AI, saveFavorite, deleteFav, clearCache, renderHistory, renderFavorites) 維持我在 V14 完整版回答中提供的程式碼 ...
// ... ... (請把剩餘內容完整的貼在最下面) ... ...
