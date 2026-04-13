// 👇 請確認這裡是您最新的 Render 網址 (不要有結尾的斜線)
const API_BASE_URL = 'https://lottery-k099.onrender.com';

const GAME_NAMES = {
    '539': '今彩 539',
    'daily': '加州天天樂',
    'lotto': '大樂透',
    'weili': '威力彩',
    'marksix': '香港六合彩'
};

// ==========================================
// 🎨 高級懸浮彈窗系統 (取代醜陋的 Alert)
// ==========================================
function showToast(message) {
    // 移除舊的彈窗(如果有的話)
    const existingToast = document.getElementById('custom-toast');
    if (existingToast) existingToast.remove();

    // 建立新的彈窗元素
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px'; // 顯示在底部導航列上方
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(26, 28, 56, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
    toast.style.border = '1px solid #4dabf7';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.whiteSpace = 'nowrap';
    toast.style.transition = 'opacity 0.3s ease-in-out, bottom 0.3s ease-in-out';
    
    toast.innerHTML = message;
    document.body.appendChild(toast);

    // 觸發漸顯動畫
    setTimeout(() => { 
        toast.style.opacity = '1'; 
        toast.style.bottom = '90px'; // 微微往上浮的動效
    }, 10);

    // 2.5 秒後自動漸隱並移除
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '80px';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==========================================
// 🎮 切換彩券模式
// ==========================================
function switchTab(gameType) {
    try {
        // 重置所有按鈕樣式
        ['539', 'daily', 'lotto', 'weili', 'marksix'].forEach(g => {
            const btn = document.getElementById(`btn-${g}`);
            if (btn) btn.className = 'secondary-btn';
        });
        // 啟動當前點擊的按鈕
        const activeBtn = document.getElementById(`btn-${gameType}`);
        if (activeBtn) activeBtn.className = 'primary-btn active';
        
        fetchPrediction(gameType);
    } catch (e) {
        console.error("按鈕切換失敗:", e);
    }
}

// ==========================================
// 📡 呼叫 V11 泛用型 AI 引擎
// ==========================================
async function fetchPrediction(game) {
    const resultBox = document.getElementById('result-box');
    const issueSpan = document.getElementById('latest-issue');
    const dateSpan = document.getElementById('latest-date');
    const titleType = document.getElementById('latest-title-type');
    const ballsContainer = document.getElementById('latest-balls');

    resultBox.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <span class="pulse-dot" style="background-color: #20c997; box-shadow: 0 0 10px #20c997;"></span> 
            <span style="color:#20c997; font-weight: bold; letter-spacing: 1px;">V11 矩陣運算中...</span>
        </div>`;
    
    titleType.textContent = GAME_NAMES[game];
    issueSpan.textContent = "連線中...";
    ballsContainer.innerHTML = '<div style="color: #888; font-size: 14px; text-align: center;">與雲端資料庫同步中...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/predict/${game}`);
        const data = await response.json();
        
        if(data.status === 'success') {
            issueSpan.textContent = data.latest_period ? `第 ${data.latest_period} 期` : '尋找開獎訊號中...';
            dateSpan.textContent = data.last_update ? `最後同步: ${data.last_update}` : '爬蟲暖機中，請稍後重整';
            
            // 渲染真實歷史號碼
            if (data.latest_numbers && data.latest_numbers.length > 0) {
                const latestBallsHtml = data.latest_numbers.map(num => 
                    `<div class="ball" style="background: #2a2d52; color: #fff; border: 1px solid #4dabf7; box-shadow: 0 0 8px rgba(77, 171, 247, 0.3);">${num}</div>`
                ).join('');
                ballsContainer.innerHTML = latestBallsHtml;
            } else {
                ballsContainer.innerHTML = `<div style="color: #ff9800; font-size: 14px; text-align: center;">⏳ 伺服器剛開機，正在爬取歷史資料，請稍後重整網頁。</div>`;
            }

            let mainBallsHtml = '';
            let ballsHtml = '';

            // 判斷是 5 顆球的遊戲還是 6+1 顆球的遊戲
            if (game === '539' || game === 'daily') {
                const mainBalls = data.predicted.slice(0, 5);
                mainBallsHtml = mainBalls.map(num => 
                    `<div class="ball" style="background: #2f65ff; box-shadow: 0 4px 10px rgba(47, 101, 255, 0.4);">${num}</div>`
                ).join('');
                
                ballsHtml = `
                    <div style="text-align: left; font-size: 15px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #2a2d52;">
                        [${GAME_NAMES[game]}] AI 精選包牌池：
                    </div>
                    <div style="text-align: left; font-size: 13px; color: #4dabf7; margin-bottom: 8px;">🔥 主力推薦區 (5碼)</div>
                    <div class="ball-container" style="justify-content: center; gap: 10px; margin-bottom: 20px;">
                        ${mainBallsHtml}
                    </div>
                `;
            } else {
                const mainBalls = data.predicted.slice(0, 6);
                const specialBall = data.predicted[6] || '00';
                const specialColor = game === 'weili' ? '#ff3b30' : '#20c997';
                const specialShadow = game === 'weili' ? 'rgba(255, 59, 48, 0.4)' : 'rgba(32, 201, 151, 0.4)';
                const specialLabel = game === 'weili' ? '第二區 (1碼)' : '特別號保險 (1碼)';

                mainBallsHtml = mainBalls.map(num => 
                    `<div class="ball" style="background: #2f65ff; box-shadow: 0 4px 10px rgba(47, 101, 255, 0.4);">${num}</div>`
                ).join('');

                ballsHtml = `
                    <div style="text-align: left; font-size: 15px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #2a2d52;">
                        [${GAME_NAMES[game]}] AI 精選包牌池：
                    </div>
                    <div style="text-align: left; font-size: 13px; color: #4dabf7; margin-bottom: 8px;">🔥 主力推薦區 (6碼)</div>
                    <div class="ball-container" style="justify-content: center; gap: 10px; margin-bottom: 15px;">
                        ${mainBallsHtml}
                    </div>
                    <div style="text-align: left; font-size: 13px; color: ${specialColor}; margin-bottom: 8px;">🛡️ ${specialLabel}</div>
                    <div class="ball-container" style="justify-content: center; margin-bottom: 20px;">
                        <div class="ball" style="background: ${specialColor}; border: none; box-shadow: 0 4px 10px ${specialShadow};">${specialBall}</div>
                    </div>
                `;
            }
            
            let detailsHtml = '<div style="margin-top: 15px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">';
            data.details.forEach((item, index) => {
                detailsHtml += `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ddd; margin-bottom: 8px;">
                        <span>${index+1}. 號碼 <strong>${item.num}</strong></span>
                        <span>權重積分: ${item.score}</span>
                    </div>`;
            });
            detailsHtml += '</div>';

            resultBox.innerHTML = ballsHtml + detailsHtml;
        } else {
            resultBox.innerHTML = `<div style="color: #ff3b30; text-align:center;">API 尚未就緒 (${data.message || ''})</div>`;
        }
    } catch (error) {
        resultBox.innerHTML = `<div style="color: #ff3b30; text-align:center;">伺服器連線異常，請確認 Render 已啟動</div>`;
    }
}

// 👇 升級絲滑的導航列點擊體驗
document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const text = e.target.textContent.trim();
            if (text !== '首頁') {
                // 呼叫我們自己寫的高級懸浮彈窗，取代原本的 alert()
                showToast(`🚀 系統公告：【${text}】分析模組即將開放，敬請期待！`);
            }
        });
    });
});

// 預設先點擊 539
window.onload = () => {
    switchTab('539');
};
