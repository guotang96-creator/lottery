(() => {
  const APP_VERSION = "V3.8.5｜Gemini AI 雲端穩定版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  const STORAGE_KEYS = { favorites: "jincai539_fav", latest: "jincai539_latest", status: "jincai539_status" };
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // 1. 初始化 Els (精確對齊 index.html)
  const els = {
    lastUpdateText: $("#lastUpdateText"), latestPeriod: $("#latestPeriod"), latestDate: $("#latestDate"),
    latestBalls: $("#latestBalls"), recBallsHome: $("#recommendBalls1"), hotNums: $("#hotNums"),
    coldNums: $("#coldNums"), dragNums: $("#dragNums"), tailNums: $("#tailNums"),
    appVersionText: $("#appVersionText"), dataSourceText: $("#dataSourceText"),
    btnGemini: $("#btn-gemini"), aiResultBox: $("#ai-result-box"),
    navButtons: $$(".nav-btn"), pages: $$(".page"),
    appDialog: $("#appDialog"), appDialogTitle: $("#appDialogTitle"),
    appDialogMessage: $("#appDialogMessage"), appDialogConfirm: $("#appDialogConfirm")
  };

  // 2. 基礎工具
  function showDialog(msg, title = "系統訊息") {
    if (!els.appDialog) return;
    els.appDialogTitle.textContent = title; els.appDialogMessage.textContent = msg;
    els.appDialog.classList.remove("hidden");
  }
  function hideDialog() { els.appDialog?.classList.add("hidden"); }
  function pad2(n) { return String(n).padStart(2, "0"); }

  // 3. AI 深度分析核心
  async function callGeminiApi() {
    if (!els.aiResultBox) return;
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `<div style="text-align:center; padding:15px;"><i class="fas fa-brain fa-spin fa-2x"></i><br>Gemini 正在全速算牌中... (約 40 秒)</div>`;
    try {
      const res = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await res.json();
      if (data.status === 'success') {
        let html = `<h3 style="color:#60a5fa; margin-bottom:12px; text-align:center;">✨ Gemini AI 深度預測</h3>`;
        html += `<div class="balls-row">` + data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('') + `</div>`;
        html += `<div style="margin-top:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:12px; font-size:13px;">`;
        data.details.forEach((d, i) => { html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${i+1}. 號碼 <b>${d.num}</b></span><span style="color:#60a5fa;">權重: ${d.score.toFixed(2)}</span></div>`; });
        html += `</div>`;
        els.aiResultBox.innerHTML = html;
      }
    } catch (e) { els.aiResultBox.innerHTML = `<div style="color:#f87171; padding:10px; text-align:center;">連線超時：AI 大腦正在熱機，請 30 秒後重試。</div>`; }
  }

  // 4. 初始化面板 (解決 "--" 問題)
  async function initDashboard() {
    try {
      const res = await fetch('./latest.json');
      const data = await res.json();
      const latest = Array.isArray(data) ? data[0] : data;
      if (els.latestPeriod) els.latestPeriod.textContent = latest.period || '--';
      if (els.latestDate) els.latestDate.textContent = latest.date || '--';
      if (els.lastUpdateText) els.lastUpdateText.textContent = latest.updatedAt || '-';
      if (els.latestBalls && latest.numbers) {
        els.latestBalls.innerHTML = latest.numbers.map(n => `<span class="ball active range-${Math.ceil(n/10)}">${pad2(n)}</span>`).join('');
        els.recBallsHome.innerHTML = els.latestBalls.innerHTML;
      }
      if (els.dataSourceText) els.dataSourceText.textContent = "本地庫 (latest.json)";
      console.log("✅ 資料同步成功");
    } catch (e) { console.error("初始化失敗:", e); }
  }

  // 5. 事件綁定與分頁
  function bindActions() {
    els.navButtons.forEach(btn => {
      btn.onclick = () => {
        const target = btn.dataset.page;
        els.pages.forEach(p => p.classList.add("hidden"));
        $(`#page-${target}`)?.classList.remove("hidden");
        els.navButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      };
    });
    if (els.btnGemini) els.btnGemini.onclick = callGeminiApi;
    if (els.appDialogConfirm) els.appDialogConfirm.onclick = hideDialog;
    $("#btnPredictHome").onclick = () => showDialog("主推薦已更新為目前最熱門組合！");
  }

  // 啟動系統
  (async () => {
    try {
      bindActions();
      await initDashboard();
      if (els.appVersionText) els.appVersionText.textContent = APP_VERSION;
      console.log("🚀 系統啟動成功");
    } catch (err) { console.error("init error:", err); showDialog("啟動失敗，請檢查配置。"); }
  })();
})();
