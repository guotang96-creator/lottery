let hftTimerInterval = null;

// ==========================================
// 🏆 抓取並顯示當期開獎結果 (上方卡片)
// ==========================================
async function fetchLatestResult(type) {
    const card = document.getElementById('latest-result-card');
    const titleType = document.getElementById('latest-title-type');
    const issueSpan = document.getElementById('latest-issue');
    const dateSpan = document.getElementById('latest-date');
    const ballsContainer = document.getElementById('latest-balls');

    // ⚡ 如果是高頻賓果，隱藏上方卡片讓畫面保持簡潔戰鬥感
    if (type === 'bingo') {
        card.style.display = 'none';
        return;
    } else {
        card.style.display = 'block';
    }

    titleType.textContent = type === '539' ? '今彩 539' : '加州天天樂';
    ballsContainer.innerHTML = '<div style="color: #888; font-size: 14px; text-align: center;">資料同步中...</div>';

    try {
        const url = type === '539' 
            ? `https://guotang96-creator.github.io/lottery/latest.json?t=${new Date().getTime()}` 
            : `https://guotang96-creator.github.io/lottery/daily.json?t=${new Date().getTime()}`;
            
        const response = await fetch(url);
        const data = await response.json();
        
        let latestDraw = null;
        if (data.history && data.history.length > 0) latestDraw = data.history[0];
        else if (data.recent50 && data.recent50.length > 0) latestDraw = data.recent50[0];
        else if (Array.isArray(data) && data.length > 0) latestDraw = data[0];

        if (latestDraw) {
            issueSpan.textContent = latestDraw.issue || latestDraw.period || '最新一期';
            dateSpan.textContent = latestDraw.date || '';
            const nums = latestDraw.drawNumberSize || latestDraw.numbers || [];
            ballsContainer.innerHTML = nums.map(n => `<div class="ball">${String(n).padStart(2, '0')}</div>`).join('');
        } else {
            ballsContainer.innerHTML = '<div style="color: #ff3b30;">找不到最新開獎資料</div>';
        }
    } catch (error) {
        ballsContainer.innerHTML = `<div style="color: #ff3b30;">無法連線至開獎資料庫</div>`;
    }
}

// ==========================================
// 🎮 切換彩券模式
// ==========================================
function switchTab(type) {
    // 1. 重置所有按鈕樣式
    document.getElementById('btn-539').className = 'secondary-btn';
    document.getElementById('btn-ttl').className = 'secondary-btn';
    
    const bingoBtn = document.getElementById('btn-bingo');
    bingoBtn.className = 'secondary-btn';
    bingoBtn.style.background = 'transparent';
    bingoBtn.style.color = '#ff3b30';

    // 2. 隱藏高頻計時器 (如果不是賓果)
    const timerContainer = document.getElementById('hft-timer-container');
    if (hftTimerInterval) clearInterval(hftTimerInterval);
    timerContainer.classList.add('hidden');

    // 3. 根據選擇啟動對應功能
    if (type === '539') {
        document.getElementById('btn-539').className = 'primary-btn active';
        fetchLatestResult('539'); // 更新上方開獎
        fetchRegularPrediction('539'); // 更新下方預測
    } else if (type === 'ttl') {
        document.getElementById('btn-ttl').className = 'primary-btn active';
        fetchLatestResult('ttl');
        fetchRegularPrediction('ttl');
    } else if (type === 'bingo') {
        // 啟動高頻戰鬥模式
        bingoBtn.className = 'primary-btn active';
        bingoBtn.style.background = '#ff3b30';
        bingoBtn.style.color = '#fff';
        
        timerContainer.classList.remove('hidden');
        startHFTTimer();
        fetchLatestResult('bingo'); // 隱藏上方卡片
        fetchBingoPrediction();
    }
}

// ==========================================
// 📡 抓取一般彩券預測 (539 / 天天樂)
// ==========================================
async function fetchRegularPrediction(type) {
    const resultBox = document.getElementById('result-box');
    resultBox.innerHTML = `<div style="text-align:center; padding: 20px; color: #8a8db9;">V9 貝氏矩陣運算中...</div>`;
    
    try {
        const url = type === '539' ? 'https://lottery-k099.onrender.com/api/predict' : 'https://lottery-k099.onrender.com/api/predict_daily';
        const response = await fetch(url);
        const data = await response.json();
        
        if(data.status === 'success') {
            let ballsHtml = '<div class="ball-container">';
            data.predicted_numbers.forEach(num => {
                ballsHtml += `<div class="ball">${num}</div>`;
            });
            ballsHtml += '</div>';
            
            let detailsHtml = '<div style="margin-top: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">';
            data.details.forEach((item, index) => {
                detailsHtml += `<div style="display: flex; justify-content: space-between; font-size: 13px; color: #aaa; margin-bottom: 5px;"><span>${index+1}. 號碼 ${item.num}</span><span>權重: ${item.score}</span></div>`;
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

// ==========================================
// ⏱️ 啟動高頻倒數計時器
// ==========================================
function startHFTTimer() {
    const timerDisplay = document.getElementById('hft-timer');
    
    hftTimerInterval = setInterval(() => {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        const minutesLeft = 4 - (minutes % 5);
        const secondsLeft = 59 - seconds;
        
        const displayMin = String(minutesLeft).padStart(2, '0');
        const displaySec = String(secondsLeft).padStart(2, '0');
        timerDisplay.textContent = `${displayMin}:${displaySec}`;
        
        if (minutesLeft === 0 && secondsLeft === 0) {
            timerDisplay.textContent = "資料更新中";
            setTimeout(fetchBingoPrediction, 2000); 
        }
    }, 1000);
}

// ==========================================
// 🔥 抓取 V10 高頻賓果預測
// ==========================================
async function fetchBingoPrediction() {
    const resultBox = document.getElementById('result-box');
    resultBox.innerHTML = `<div style="text-align:center; padding: 30px;"><span class="pulse-dot"></span> <span style="color:#ff3b30;">V10 引擎算力全開吞吐中...</span></div>`;

    try {
        const response = await fetch('https://lottery-k099.onrender.com/api/predict_bingo');
        const data = await response.json();
        
        if(data.status === 'success') {
            let ballsHtml = '<div class="bingo-balls-container">';
            data.predicted_numbers.forEach(num => {
                ballsHtml += `<div class="bingo-ball">${num}</div>`;
            });
            ballsHtml += '</div>';
            
            let detailsHtml = '<div style="margin-top: 15px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">';
            detailsHtml += '<div style="color: #8a8db9; font-size: 12px; margin-bottom: 10px; border-bottom: 1px solid #2a2d52; padding-bottom: 5px;">V10 引擎極限權重解析 (資料期數: '+data.time_steps+')<br>最後更新: '+data.last_update+'</div>';
            
            data.details.forEach((item, index) => {
                detailsHtml += `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
                        <span style="color: #ddd;">${index + 1}. 星號 <strong style="color:white;">${item.num}</strong></span>
                        <span style="color: #ff3b30; font-family: monospace; font-weight: bold;">權重: ${item.score.toLocaleString()}</span>
                    </div>`;
            });
            detailsHtml += '</div>';

            resultBox.innerHTML = `
                <div style="text-align: center; color: #ff3b30; font-weight: 900; margin-bottom: 5px; font-size: 18px; letter-spacing: 1px;">
                    🔥 台灣賓果 [V10 量化十星陣列]
                </div>
                ${ballsHtml}
                ${detailsHtml}
            `;
        } else {
            resultBox.innerHTML = `<div style="color: #ff3b30; text-align:center;">伺服器高頻資料庫初始化中...請稍候。</div>`;
        }
    } catch (error) {
        resultBox.innerHTML = `<div style="color: #ff3b30; text-align:center;">伺服器連線異常，請檢查 Render 狀態。</div>`;
    }
}

// 網頁載入後，預設先點擊 539
window.onload = () => {
    switchTab('539');
};
