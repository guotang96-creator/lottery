(() => {
  const APP_VERSION = "V3.8.5｜Gemini 雲端強力運算版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  // 保留您原本的 STORAGE_KEYS
  const STORAGE_KEYS = {
    favorites: "jincai539_favorites_v50",
    history: "jincai539_predict_history_v50",
    latest: "jincai539_latest_result_v50",
    status: "jincai539_data_status_v50",
    settings: "jincai539_user_settings_v50"
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  // 1. 初始化 Els 選擇器 (對齊 index.html)
  const els = {
    lastUpdateText: $("#lastUpdateText"),
    latestPeriod: $("#latestPeriod"),
    latestDate: $("#latestDate"),
    latestBalls: $("#latestBalls"),
    dataSourceText: $("#dataSourceText"),
    appVersionText: $("#appVersionText"),
    currentModeText: $("#currentModeText"),
    
    // AI 專用
    btnGemini: $("#btn-gemini"),
    aiResultBox: $("#ai-result-box"),

    // 原有按鈕
    btnPredictHome: $("#btnPredictHome"),
    btnCopy: $("#btnCopy"),
    btnSave: $("#btnSave"),
    hotNums: $("#hotNums"),
    coldNums: $("#coldNums"),
    dragNums: $("#dragNums"),
    tailNums: $("#tailNums"),

    navButtons: $$(".nav-btn"),
    pages: {
      home: $("#page-home"),
      predict: $("#page-predict"),
      history: $("#page-history"),
      favorites: $("#page-favorites"),
      backtest: $("#page-backtest"),
      settings: $("#page-settings")
    },
    
    appDialog: $("#appDialog"),
    appDialogTitle: $("#appDialogTitle"),
    appDialogMessage: $("#appDialogMessage"),
    appDialogConfirm: $("#appDialogConfirm")
  };

  // 2. 工具函式 (保留原始邏輯)
  function showDialog(message, title = "系統訊息") {
    if (!els.appDialog) return;
    els.appDialogTitle.textContent = title;
    els.appDialogMessage.textContent = message;
    els.appDialog.classList.remove("hidden");
  }
  function hideDialog() { els.appDialog?.classList.add("hidden"); }
  function pad2(n) { return String(n).padStart(2, "0"); }

  // 3. AI 深度分析功能
  async function callAiApi() {
    if (!els.aiResultBox) return;
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `
      <div style="text-align:center; color:#60a5fa; padding:20px;">
        <i class="fas fa-brain fa-spin fa-2x"></i><br><br>
        Gemini 正在計算隨機森林模型...<br>
        <small>(首次啟動約需 40-50 秒)</small>
      </div>
    `;

    try {
      const res = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await res.json();
      if (data.status === 'success') {
        renderAiResult(data);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      els.aiResultBox.innerHTML = `<div style="color:#f87171; padding:10px;">⚠️ 連線超時：AI 大腦正在熱機，請 30 秒後再試。</div>`;
    }
  }

  function renderAiResult(data) {
    let html = `
      <h3 style="color:#60a5fa; margin-bottom:15px; text-align:center;">✨ Gemini AI 預測號碼</h3>
      <div class="balls-row">
        ${data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('')}
      </div>
      <div style="margin-top:20px; background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; font-size:13px;">
        <p style="color:#94a3b8; margin-bottom:8px;">演算法權重明細：</p>
        ${data.details.map((d, i) => `
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${i+1}. 號碼 <b style="color:white;">${d.num}</b></span>
            <span style="color:#60a5fa;">權重: ${d.score.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    `;
    els.aiResultBox.innerHTML = html;
  }

  // 4. 綁定動作 (保留您的原始事件)
  function bindActions() {
    els.navButtons.forEach(btn => {
      btn.onclick = () => {
        const target = btn.dataset.page;
        Object.keys(els.pages).forEach(k => els.pages[k]?.classList.add("hidden"));
        els.pages[target]?.classList.remove("hidden");
        els.navButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      };
    });

    if (els.btnGemini) els.btnGemini.onclick = callAiApi;
    if (els.appDialogConfirm) els.appDialogConfirm.onclick = hideDialog;
    
    // 其他原始按鈕功能可依序補回
    if (els.btnPredictHome) els.btnPredictHome.onclick = () => showDialog("正在執行基礎預測...");
  }

  // 5. 初始化資料 (對齊您的 latest.json)
  async function init() {
    try {
      console.log(APP_VERSION + " 啟動...");
      bindActions();
      
      const res = await fetch('./latest.json');
      const data = await res.json();

      if (els.latestPeriod) els.latestPeriod.textContent = data.period || '--';
      if (els.latestDate) els.latestDate.textContent = data.date || '--';
      if (els.lastUpdateText) els.lastUpdateText.textContent = data.updatedAt || '-';
      if (els.appVersionText) els.appVersionText.textContent = APP_VERSION;
      
      if (els.latestBalls && data.numbers) {
        els.latestBalls.innerHTML = data.numbers.map(n => `<span class="ball active range-${Math.ceil(n/10)}">${pad2(n)}</span>`).join('');
      }

      console.log("✅ 系統啟動成功");
    } catch (e) {
      console.error("啟動失敗:", e);
      showDialog("系統啟動失敗，請檢查網路連線。");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
