(() => {
  const APP_VERSION = "V3.8.5｜Gemini AI 穩定版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  // 選取器對齊
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

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

  function showDialog(msg, title = "系統訊息") {
    if (!els.appDialog) return;
    els.appDialogTitle.textContent = title; els.appDialogMessage.textContent = msg;
    els.appDialog.classList.remove("hidden");
  }

  // Gemini AI 連線
  async function callGeminiApi() {
    if (!els.aiResultBox) return;
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `<div style="text-align:center; padding:15px;"><i class="fas fa-brain fa-spin fa-2x"></i><br>正在深度算牌 (約 40 秒)...</div>`;
    try {
      const res = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await res.json();
      if (data.status === 'success') {
        let html = `<h3 style="color:#60a5fa; margin-bottom:10px; text-align:center;">✨ Gemini AI 預測結果</h3>`;
        html += `<div class="balls-row">` + data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('') + `</div>`;
        html += `<div style="margin-top:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:12px; font-size:12px;">`;
        data.details.forEach((d, i) => { html += `<div style="display:flex; justify-content:space-between;"><span>${i+1}. 號碼 <b>${d.num}</b></span><span>權重: ${d.score.toFixed(2)}</span></div>`; });
        html += `</div>`;
        els.aiResultBox.innerHTML = html;
      }
    } catch (e) { els.aiResultBox.innerHTML = `<div style="color:#f87171;">AI 起床中，請於 30 秒後重試。</div>`; }
  }

  // 初始化開獎面板
  async function init() {
    try {
      const res = await fetch('./latest.json');
      const data = await res.json();
      const latest = Array.isArray(data) ? data[0] : data;
      
      if (els.latestPeriod) els.latestPeriod.textContent = latest.period || latest.latest_draw || '--';
      if (els.latestDate) els.latestDate.textContent = latest.date || '--';
      if (els.lastUpdateText) els.lastUpdateText.textContent = latest.updatedAt || '-';
      if (els.latestBalls && latest.numbers) {
        els.latestBalls.innerHTML = latest.numbers.map(n => `<span class="ball active range-${Math.ceil(n/10)}">${String(n).padStart(2, '0')}</span>`).join('');
        els.recBallsHome.innerHTML = els.latestBalls.innerHTML;
      }

      // 導覽切換
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
      if (els.appDialogConfirm) els.appDialogConfirm.onclick = () => els.appDialog.classList.add("hidden");
      
      console.log("🚀 系統啟動成功");
    } catch (err) {
      console.error("啟動失敗:", err);
      showDialog("系統啟動失敗，請檢查 latest.json 是否存在。");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
