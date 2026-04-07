const AI_API_BASE = "https://lottery-k099.onrender.com";

document.addEventListener('DOMContentLoaded', async () => {
    // 啟動時先載入所有資料
    await initDashboard();

    // 綁定按鈕
    document.getElementById('btn-gemini').onclick = () => callAiApi('Gemini');
    document.getElementById('btn-openai').onclick = () => callAiApi('ChatGPT');
    document.getElementById('btnRefresh').onclick = () => initDashboard();
});

// [初始化] 讓所有卡片顯示數字
async function initDashboard() {
    try {
        const res = await fetch('./latest.json');
        let data = await res.json();
        if (Array.isArray(data)) data = data[0]; // 防止格式錯誤

        // 1. 最新開獎
        document.getElementById('latestIssue').innerText = data.latest_draw || '--';
        document.getElementById('latestDate').innerText = data.date || '--';
        document.getElementById('latestBalls').innerHTML = (data.numbers || []).map(n => `<span class="ball">${n}</span>`).join('');

        // 2. 主推薦 (顯示在最顯眼的地方)
        document.getElementById('mainRecommendBalls').innerHTML = (data.numbers || []).map(n => `<span class="ball" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">${n}</span>`).join('');

        // 3. 快速分析資料
        document.getElementById('hotNumbersText').innerText = (data.hot_numbers || []).join(' ');
        document.getElementById('coldNumbersText').innerText = (data.cold_numbers || []).join(' ');
        document.getElementById('trailingText').innerText = data.trailing || '暫無資料';
        document.getElementById('strongTailText').innerText = data.strong_tail || '1尾、9尾';

        document.getElementById('heroStatusText').innerText = "系統運作正常 (Render 已連動)";
    } catch (e) {
        document.getElementById('heroStatusText').innerText = "本地資料讀取失敗";
    }
}

// [AI 功能] 呼叫 Render 並顯示美美的結果
async function callAiApi(modelName) {
    const resultArea = document.getElementById('ai-result');
    resultArea.innerHTML = `<div class="loading">🧠 ${modelName} 正在運算中...<br>(Render 喚醒需時 40 秒)</div>`;

    try {
        const response = await fetch(`${AI_API_BASE}/api/predict`);
        const data = await response.json();
        
        if (data.status === 'success') {
            let html = `<h3 style="color:#4facfe; margin-bottom:15px;">✨ AI 預測完成</h3>`;
            html += `<div class="balls-row">` + data.predicted_numbers.map(n => `<span class="ball ai-ball">${n}</span>`).join('') + `</div>`;
            html += `<div style="margin-top:15px; border-top:1px solid #333; pt:10px; font-size:13px;">`;
            html += data.details.map((d, i) => `<div style="margin-bottom:4px;">${i+1}. 號碼 ${d.num} 權重: ${d.score.toFixed(2)}</div>`).join('');
            html += `</div>`;
            resultArea.innerHTML = html;
        }
    } catch (e) {
        resultArea.innerHTML = `<div style="color:#ff6b6b;">AI 連線超時，請再按一次喚醒伺服器。</div>`;
    }
}
