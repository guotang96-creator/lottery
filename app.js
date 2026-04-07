(() => {
  const APP_VERSION = "V3.8.5｜Gemini 雲端穩定版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  // ... (保留您原本的 STORAGE_KEYS, JSON_CANDIDATES, DEFAULT_LATEST, MOCK_HISTORY) ...

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const els = {
    // ... (保留您原本 els 的所有選擇器) ...
    btnGemini: $("#btn-gemini"),
    aiResultBox: $("#ai-result-box")
  };

  // ... (保留您原本的工具函式：showDialog, pad2, readJSON, writeJSON 等) ...

  // 💡 Gemini AI 分析功能
  async function callAiApi() {
    if (!els.aiResultBox) return;
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fas fa-brain fa-spin fa-2x"></i><br>Gemini 運算中 (約 40 秒)...</div>`;

    try {
      const res = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await res.json();
      if (data.status === 'success') {
        renderAiResult(data);
      }
    } catch (e) {
      els.aiResultBox.innerHTML = `<div style="color:#f87171;">連線超時，伺服器正在起床中...</div>`;
    }
  }

  function renderAiResult(data) {
    let html = `<h3 style="color:#60a5fa; margin-bottom:15px; text-align:center;">✨ Gemini AI 預測號碼</h3>`;
    html += `<div class="balls-row">` + data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('') + `</div>`;
    html += `<div style="margin-top:20px; background:rgba(0,0,0,0.3); padding:10px; border-radius:12px; font-size:13px;">`;
    html += data.details.map((d, i) => `<div>${i+1}. 號碼 <b>${d.num}</b> 權重: ${d.score.toFixed(2)}</div>`).join('');
    html += `</div>`;
    els.aiResultBox.innerHTML = html;
  }

  // 💡 修正原本的 initDashboard 確保資料能正確填入
  async function initDashboard(latest) {
    if (!latest) return;
    if (els.latestPeriod) els.latestPeriod.textContent = latest.period || '--';
    if (els.latestDate) els.latestDate.textContent = latest.date || '--';
    if (els.lastUpdateText) els.lastUpdateText.textContent = latest.updatedAt || '-';
    if (els.dataSourceText) els.dataSourceText.textContent = latest.source || 'latest.json';
    
    const ballArea = els.latestBalls;
    if (ballArea && latest.numbers) {
      ballArea.innerHTML = latest.numbers.map(n => `<span class="ball active range-${Math.ceil(n/10)}">${String(n).padStart(2, '0')}</span>`).join('');
    }
    // 更新快速分析內容
    const summary = getAnalysisSummary(sampleHistory(120, latest.numbers));
    if (els.hotNums) els.hotNums.textContent = summary.hotText;
    if (els.coldNums) els.coldNums.textContent = summary.coldText;
    if (els.dragNums) els.dragNums.textContent = summary.dragText;
    if (els.tailNums) els.tailNums.textContent = summary.tailText;
  }

  function bindActions() {
    // ... (保留您原本所有的按鈕點擊事件) ...
    if (els.btnGemini) els.btnGemini.onclick = callAiApi;
  }

  async function init() {
    try {
      bindDialog();
      bindActions();
      bindNav();
      const latest = await loadLatestFromCandidates();
      await initDashboard(latest); // 確保啟動時載入資料
      switchPage("home");
    } catch (err) {
      console.error("init error:", err);
      showDialog("系統啟動失敗，請檢查網頁配置。");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
