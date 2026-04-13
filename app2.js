// 👇 請將這裡換成您最新的 Render 網址 (不要有結尾的斜線)
const API_BASE_URL = 'https://lottery-k099.onrender.com';

const GAME_NAMES = {
    '539': '今彩 539',
    'daily': '加州天天樂',
    'lotto': '大樂透',
    'weili': '威力彩',
    'marksix': '香港六合彩'
};

function switchTab(gameType) {
    // 重置所有按鈕樣式
    ['539', 'daily', 'lotto', 'weili', 'marksix'].forEach(g => {
        document.getElementById(`btn-${g}`).className = 'secondary-btn';
    });
    // 啟動當前點擊的按鈕
    document.getElementById(`btn-${gameType}`).className = 'primary-btn active';
    fetchPrediction(gameType);
}

async function fetchPrediction(game) {
    const resultBox = document.getElementById('result-box');
    const issueSpan = document.getElementById('latest-issue');
    const dateSpan = document.getElementById('latest-date');
    const titleType = document.getElementById('latest-title-type');
    const ballsContainer = document.getElementById('latest-balls');

    resultBox.innerHTML = `
        <div style="text-align:center; padding: 30px;">
            <span class="pulse-dot" style="background-color: #20c997; box-shadow: 0 0 10px #20c997;"></span> 
            <span style="color:#20c997; font-weight: bold;">V11 矩陣運算中...</span>
        </div>`;
    
    titleType.textContent = GAME_NAMES[game];
    issueSpan.textContent = "連線中...";
    ballsContainer.innerHTML = '<div style="color: #888; font-size: 14px; text-align: center;">與資料庫同步中...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/predict/${game}`);
        const data = await response.json();
        
        if(data.status === 'success') {
            issueSpan.textContent = data.latest_period ? `第 ${data.latest_period} 期` : '尋找開獎訊號中...';
            dateSpan.textContent = data.last_update ? `最後同步: ${data.last_update}` : '爬蟲暖機中，請稍後重整';
            
            if (data.latest_period) {
                ballsContainer.innerHTML = `<div style="color: #20c997; font-size: 14px; font-weight: bold; text-align: center;">✅ 已成功同步至最新歷史開獎庫，AI 準備就緒。</div>`;
            } else {
                ballsContainer.innerHTML = `<div style="color: #ff9800; font-size: 14px; text-align: center;">⏳ 伺服器剛開機，正在爬取歷史資料，請稍後重整網頁。</div>`;
            }

            let mainBallsHtml = '';
            let specialHtml = '';
            let ballsHtml = '';

            // 判斷是 5 顆球的遊戲 (539/天天樂) 還是 6+1 顆球的遊戲
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

// 預設先點擊 539
window.onload = () => {
    switchTab('539');
};
