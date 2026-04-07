(() => {
  // [1] 配置區
  const APP_VERSION = "V3.8.5｜AI 雲端穩定版";
  const AI_API_BASE = "https://lottery-k099.onrender.com";

  // ... (保留您原本的 STORAGE_KEYS, JSON_CANDIDATES, DEFAULT_LATEST, MOCK_HISTORY 等定義) ...

  const els = {
    // ... (保留您原本 els 的所有選擇器) ...
    // 新增 AI 選擇器
    btnGemini: document.getElementById('btn-gemini'),
    btnOpenAI: document.getElementById('btn-openai'),
    aiResultBox: document.getElementById('ai-result-box')
  };

  // ... (保留您原本的工具函式：showDialog, pad2, normalizeDateOnly, readJSON, writeJSON 等) ...

  /**
   * AI 核心功能：呼叫 Render 伺服器
   */
  async function callAiApi(modelName) {
    if (!els.aiResultBox) return;
    
    els.aiResultBox.style.display = "block";
    els.aiResultBox.innerHTML = `
      <div style="text-align:center; color:#60a5fa; padding:10px;">
        <i class="fas fa-spinner fa-spin"></i> ${modelName} 正在運算中...<br>
        <small style="color:#94a3b8;">(首次連線需 40 秒喚醒伺服器)</small>
      </div>
    `;

    try {
      const response = await fetch(`${AI_API_BASE}/api/predict`);
      const data = await response.json();
      
      if (data.status === 'success') {
        renderAiResult(data, modelName);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      els.aiResultBox.innerHTML = `<div style="color:#f87171;">連線失敗：伺服器正在起床中，請 30 秒後再試。</div>`;
    }
  }

  function renderAiResult(data, modelName) {
    let html = `
      <h3 style="color:#60a5fa; margin-bottom:10px; font-size:18px;">✨ ${modelName} AI 預測結果</h3>
      <div class="balls-row">
        ${data.predicted_numbers.map(n => `<span class="ball active range-1">${n}</span>`).join('')}
      </div>
      <div style="margin-top:15px; font-size:13px; color:#94a3b8; border-top:1px solid rgba(255,255,255,0.1); pt:10px;">
        <p>演算法權重明細：</p>
        ${data.details.map((d, i) => `<div>${i+1}. 號碼 ${d.num} 權重指數: ${d.score.toFixed(2)}</div>`).join('')}
      </div>
    `;
    els.aiResultBox.innerHTML = html;
  }

  // ... (保留您原本的 renderLatest, initDashboard, generatePrediction 等函式) ...

  function bindActions() {
    // 這裡保留您原本所有的 els.predictButtons.forEach 等等...
    
    // 加上 AI 按鈕點擊
    if (els.btnGemini) els.btnGemini.addEventListener('click', () => callAiApi('Gemini'));
    if (els.btnOpenAI) els.btnOpenAI.addEventListener('click', () => callAiApi('ChatGPT'));

    // ... (其餘 bindActions 內容不變) ...
  }

  async function init() {
    try {
      // 保留您原本 init 的所有流程
      // ... (包括 bindDialog, bindActions, bindNav, loadLatestFromCandidates 等) ...
      
      // 確保初始化時 AI 預覽是收起來的
      if (els.aiResultBox) els.aiResultBox.style.display = "none";
      
      switchPage("home");
      console.log(APP_VERSION + " 啟動成功");
    } catch (err) {
      console.error("init error:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
