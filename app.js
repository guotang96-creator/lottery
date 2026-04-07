(() => {
  const APP_VERSION = "V3.8.5｜Gemini 雲端強力運算版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  // ... (保留您原本的 STORAGE_KEYS, JSON_CANDIDATES, DEFAULT_LATEST, MOCK_HISTORY 等定義) ...

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const els = {
    // ... (保留您原本 els 的所有選擇器，如 lastUpdateText, latestPeriod 等) ...
    btnGemini: $("#btn-gemini"),
    aiResultBox: $("#ai-result-box"),
    // 確保這裡包含您原本所有的選擇器...
    pages: {
      home: $("#page-home"), predict: $("#page-predict"), history: $("#page-history"),
      favorites: $("#page-favorites"), backtest: $("#page-backtest"), settings: $("#page-settings")
    },
    navButtons: $$(".nav-btn"),
    appDialog: $("#appDialog"), appDialogTitle: $("#appDialogTitle"),
    appDialogMessage: $("#appDialogMessage"), appDialogConfirm: $("#appDialogConfirm")
  };

  // ... (保留您原本的工具函式：showDialog, pad2, readJSON, writeJSON 等) ...

  /**
   * Gemini AI 深度預測核心
   */
  async function callAiApi() {
    if (!els.aiResultBox) return;
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `
      <div style="text-align:center; padding:20px; color:#60a5fa;">
        <i class="fas fa-brain fa-spin fa-2x"></i><br><br>
        Gemini 正在分析大數據...<br>
        <small style="color:#94a3b8;">(首次啟動需 40 秒喚醒 Render 伺服器)</small>
      </div>
    `;

    try {
      const response = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await response.json();
      if (data.status === 'success') {
        renderAiOutput(data);
      } else { throw new Error(data.message); }
    } catch (err) {
      els.aiResultBox.innerHTML = `<div style="color:#f87171; padding:10px;">⚠️ 連線失敗：AI 正在熱機中，請於 30 秒後重新點擊。</div>`;
    }
  }

  function renderAiOutput(data) {
    let html = `
      <h3 style="color:#60a5fa; margin-bottom:12px; text-align:center;">✨ Gemini AI 預測號碼</h3>
      <div class="balls-row">
        ${data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('')}
      </div>
      <div style="margin-top:15px; background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; font-size:13px;">
        <p style="color:#888; margin-bottom:8px;">機器學習權重分析：</p>
        ${data.details.map((d, i) => `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${i+1}. 號碼 <b style="color:#fff;">${d.num}</b></span>
            <span style="color:#60a5fa;">權重: ${d.score.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    `;
    els.aiResultBox.innerHTML = html;
  }

  // ... (保留您原本的 initDashboard, generatePrediction, switchPage 等函式) ...

  function bindActions() {
    // ... (保留您原本所有的按鈕綁定) ...
    if (els.btnGemini) els.btnGemini.onclick = callAiApi;
  }

  async function init() {
    try {
      bindDialog();
      bindActions();
      bindNav();
      
      const latest = await loadLatestFromCandidates();
      renderLatest(latest);
      // 關鍵修復：確保快速分析數據在啟動時被計算出來
      const history = sampleHistory(120, latest.numbers);
      updateAnalysisViews(history);
      
      if (els.appVersionText) els.appVersionText.textContent = APP_VERSION;
      switchPage("home");
      console.log("🚀 系統啟動成功");
    } catch (err) {
      console.error("init error:", err);
      showDialog("初始化失敗，請檢查 latest.json 檔案。");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
