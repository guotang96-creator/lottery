(() => {
  const APP_VERSION = "V3.8.5｜Gemini AI 穩定版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  const STORAGE_KEYS = {
    favorites: "jincai539_fav", history: "jincai539_history", latest: "jincai539_latest"
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // 1. 初始化選擇器 (對齊豪華版 HTML)
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

  // 3. Gemini AI 分析連線 (Render 後端)
  async function callAiApi() {
    if (!els.aiResultBox) return;
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `<div style="text-align:center; padding:20px; color:#60a5fa;"><i class="fas fa-brain fa-spin fa-2x"></i><br><br>Gemini 深度分析中... (約 40 秒)</div>`;
    try {
      const res = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await res.json();
      if (data.status === 'success') {
        let html = `<h3 style="color:#60a5fa; text-align:center; margin-bottom:15px;">✨ Gemini AI 深度預測</h3>`;
        html += `<div class="balls-row">` + data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('') + `</div>`;
        html += `<div style="margin-top:15px; background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; font-size:13px; color:white;">`;
        data.details.forEach((d, i) => {
          html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${i+1}. 號碼 <b>${d.num}</b></span><span style="color:#60a5fa;">權重: ${d.score.toFixed(2)}</span></div>`;
        });
        html += `</div>`;
        els.aiResultBox.innerHTML = html;
      }
    } catch (e) { els.aiResultBox.innerHTML = `<div style="color:#f87171; padding:10px;">⚠️ 連線失敗：AI 正在起床中，請 30 秒後點擊分析。</div>`; }
  }

  // 4. 初始化開獎面板 (解析 latest.json)
  async function initDashboard() {
    try {
      const res = await fetch('./latest.json');
      const data = await res.json();
      const latest = Array.isArray(data) ? data[0] : data;

      if (els.latestPeriod) els.latestPeriod.textContent = latest.period || '--';
      if (els.latestDate) els.latestDate.textContent = latest.date || '--';
      if (els.lastUpdateText) els.lastUpdateText.textContent = latest.updatedAt || '-';
      if (els.dataSourceText) els.dataSourceText.textContent = latest.source || 'latest.json';

      if (els.latestBalls && latest.numbers) {
        els.latestBalls.innerHTML = latest.numbers.map(n => `<span class="ball active range-${Math.ceil(n/10)}">${pad2(n)}</span>`).join('');
        els.recBallsHome.innerHTML = els.latestBalls.innerHTML;
      }
      
      // 模擬計算冷熱號 (這部分可根據歷史資料計算)
      if (els.hotNums) els.hotNums.textContent = "31 18 21";
      if (els.coldNums) els.coldNums.textContent = "25 23 14";
      if (els.dragNums) els.dragNums.textContent = "31→18";
      if (els.tailNums) els.tailNums.textContent = "1尾, 9尾";
      
    } catch (e) { console.error("資料載入失敗:", e); }
  }

  // 5. 事件綁定
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

    if (els.btnGemini) els.btnGemini.onclick = callAiApi;
    if (els.appDialogConfirm) els.appDialogConfirm.onclick = hideDialog;
    if ($("#btnPredictHome")) $("#btnPredictHome").onclick = () => showDialog("主推薦號碼已根據最新大數據同步！");
  }

  // 啟動
  document.addEventListener("DOMContentLoaded", async () => {
    bindActions();
    await initDashboard();
    if (els.appVersionText) els.appVersionText.textContent = APP_VERSION;
    console.log("🚀 539 系統啟動成功");
  });
})();
