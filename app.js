const APP_VERSION = "AI Compact Final Stable (Replit Edition)";
// ★ 替換為您的 Replit API 網址 (移除結尾的 /api/predict，只留基底網址)
const AI_API_BASE = "https://lottery-k099.onrender.com";

const JSON_CANDIDATES = [
  "./latest.json",
  "./data/latest.json",
  "./docs/latest.json",
  "/lottery/latest.json",
  "/lottery/data/latest.json",
  "/lottery/docs/latest.json"
];

const els = {
  latestIssue: document.getElementById("latestIssue"),
  latestDate: document.getElementById("latestDate"),
  latestBalls: document.getElementById("latestBalls"),
  heroUpdateText: document.getElementById("heroUpdateText"),
  dataSourceText: document.getElementById("dataSourceText"),
  dataUpdatedText: document.getElementById("dataUpdatedText"),
  btnRefresh: document.getElementById("btnRefresh"),
  btnQuickPick: document.getElementById("btnQuickPick"),
  analysisPeriods: document.getElementById("analysisPeriods"),
  predictMode: document.getElementById("predictMode"),
  primaryNumbersText: document.getElementById("primaryNumbersText"),
  confidenceText: document.getElementById("confidenceText"),
  hotNumbersText: document.getElementById("hotNumbersText"),
  coldNumbersText: document.getElementById("coldNumbersText"),
  predictResultsList: document.getElementById("predictResultsList"),
  btnGemini: document.getElementById("btn-gemini"),
  btnOpenai: document.getElementById("btn-openai"),
  aiResult: document.getElementById("ai-result")
};

const state = {
  latestJson: null,
  latest539: null,
  history539: [],
  lastPath: "",
  currentPrediction: []
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDate(value) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function formatDateTime(value) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setAiResult(message, className = "") {
  if (!els.aiResult) return;
  els.aiResult.className = `ai-result ${className}`.trim();
  els.aiResult.textContent = message;
}

function setAiHtml(html, className = "") {
  if (!els.aiResult) return;
  els.aiResult.className = `ai-result ${className}`.trim();
  els.aiResult.innerHTML = html;
}

function renderBall(value) {
  return `<span class="ball">${pad2(value)}</span>`;
}

function renderBalls(values, target) {
  if (!target) return;
  if (!Array.isArray(values) || !values.length) {
    target.innerHTML = `<div class="empty-text">暫無資料</div>`;
    return;
  }
  target.innerHTML = values.map((n) => renderBall(n)).join("");
}

function renderAiBalls(numbers) {
  if (!Array.isArray(numbers) || !numbers.length) {
    return `<span class="ai-empty">無資料</span>`;
  }
  return numbers.map((num) => `<span class="ai-ball">${pad2(num)}</span>`).join("");
}

function normalizeLatest539(json) {
  if (!json || typeof json !== "object") return null;

  const content = json.content || json;

  const candidates = [
    content.daily539,
    content.latest539,
    content.daily539Latest,
    content.daily539Result,
    content.jincai539,
    json.daily539,
    json.latest539,
    json.daily539Latest,
    json.daily539Result,
    json.jincai539
  ].filter(Boolean);

  for (const item of candidates) {
    const numbers = (
      item.numbers ||
      item.drawNumberSize ||
      item.drawNumbers ||
      item.num ||
      []
    ).map(Number).filter(Number.isFinite);

    if (numbers.length >= 5) {
      return {
        period: item.period || item.issue || item.drawTerm || "--",
        lotteryDate: item.lotteryDate || item.drawDate || item.dDate || item.date || "",
        numbers: numbers.slice(0, 5)
      };
    }
  }

  const listCandidates = [
    content.daily539Res,
    content.daily539Result,
    content.results,
    content.list,
    json.daily539Res,
    json.daily539Result,
    json.results,
    json.list
  ];

  for (const list of listCandidates) {
    if (Array.isArray(list) && list.length) {
      for (const row of list) {
        const numbers = (
          row.numbers ||
          row.drawNumberSize ||
          row.drawNumbers ||
          row.num ||
          []
        ).map(Number).filter(Number.isFinite);

        if (numbers.length >= 5) {
          return {
            period: row.period || row.issue || row.drawTerm || "--",
            lotteryDate: row.lotteryDate || row.drawDate || row.dDate || row.date || "",
            numbers: numbers.slice(0, 5)
          };
        }
      }
    }
  }

  return null;
}

function extractHistory539(json, latest) {
  const content = json?.content || json || {};
  const rows = [];

  const sources = [
    content.daily539History,
    content.daily539Res,
    content.daily539Result,
    content.results,
    content.list,
    content.history,
    json.daily539History,
    json.daily539Res,
    json.daily539Result,
    json.results,
    json.list,
    json.history
  ];

  for (const source of sources) {
    if (Array.isArray(source)) rows.push(...source);
  }

  const mapped = rows
    .map((row) => ({
      period: row.period || row.issue || row.drawTerm || "",
      lotteryDate: row.lotteryDate || row.drawDate || row.dDate || row.date || "",
      numbers: (
        row.numbers ||
        row.drawNumberSize ||
        row.drawNumbers ||
        row.num ||
        []
      ).map(Number).filter(Number.isFinite).slice(0, 5)
    }))
    .filter((row) => row.numbers.length >= 5);

  if (mapped.length) return mapped;
  if (latest) return [latest];
  return [];
}

async function fetchFirstJson(candidates) {
  const errors = [];

  for (const path of candidates) {
    try {
      const res = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) {
        errors.push(`${path} (${res.status})`);
        continue;
      }
      const json = await res.json();
      return { json, path };
    } catch (err) {
      errors.push(`${path} (${err.message})`);
    }
  }

  throw new Error(`找不到 latest.json：${errors.join("、")}`);
}

function countFrequency(history) {
  const map = new Map();
  history.forEach((draw) => {
    (draw.numbers || []).forEach((n) => {
      map.set(n, (map.get(n) || 0) + 1);
    });
  });
  return map;
}

function getMissingCounts(history) {
  const missing = new Map();
  for (let n = 1; n <= 39; n += 1) {
    let miss = 0;
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if ((history[i].numbers || []).includes(n)) break;
      miss += 1;
    }
    missing.set(n, miss);
  }
  return missing;
}

function sampleHistory(periods) {
  if (!Array.isArray(state.history539) || !state.history539.length) {
    return state.latest539 ? [state.latest539] : [];
  }
  return state.history539.slice(0, periods);
}

function uniqSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a - b);
}

function pickTopFromMap(map, limit, reverse = true) {
  return [...map.entries()]
    .sort((a, b) => reverse ? b[1] - a[1] || a[0] - b[0] : a[1] - b[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([num]) => num);
}

function predictNumbers(mode, history) {
  if (!history.length) return [];

  const freq = countFrequency(history);
  const miss = getMissingCounts(history);

  const hot = pickTopFromMap(freq, 12, true);
  const cold = pickTopFromMap(freq, 12, false);
  const missingTop = [...miss.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 12)
    .map(([num]) => num);

  let picked = [];

  switch (mode) {
    case "hot":
      picked = hot.slice(0, 5);
      break;

    case "cold":
      picked = uniqSorted([
        ...cold.slice(0, 2),
        ...missingTop.slice(0, 3),
        ...hot.slice(0, 2)
      ]).slice(0, 5);
      break;

    case "tail":
      picked = uniqSorted([
        ...hot.slice(0, 3),
        ...missingTop.slice(0, 2),
        ...cold.slice(0, 2)
      ]).slice(0, 5);
      break;

    case "balanced":
    default:
      picked = uniqSorted([
        ...hot.slice(0, 3),
        ...missingTop.slice(0, 2),
        ...cold.slice(0, 2)
      ]).slice(0, 5);
      break;
  }

  return picked.filter((n) => n >= 1 && n <= 39).slice(0, 5);
}

function estimateConfidence(primary, history, mode) {
  if (!primary.length || !history.length) return 50;

  const freq = countFrequency(history);
  const total = primary.reduce((sum, n) => sum + (freq.get(n) || 0), 0);
  const avg = total / primary.length;
  const modeBoost =
    mode === "balanced" ? 5 :
    mode === "hot" ? 8 :
    mode === "cold" ? 3 :
    mode === "tail" ? 4 : 0;

  return Math.max(55, Math.min(98, Math.round(58 + avg * 1.8 + modeBoost)));
}

function getHotColdTexts(history) {
  if (!history.length) {
    return { hot: "--", cold: "--" };
  }

  const freq = countFrequency(history);
  const hot = pickTopFromMap(freq, 5, true).map(pad2).join("、") || "--";
  const cold = pickTopFromMap(freq, 5, false).map(pad2).join("、") || "--";
  return { hot, cold };
}

function updateDashboard(primary, confidence, history) {
  const { hot, cold } = getHotColdTexts(history);

  els.primaryNumbersText.textContent =
    primary.length ? primary.map(pad2).join("、") : "資料不足";
  els.confidenceText.textContent =
    primary.length ? `${confidence} 分` : "--";
  els.hotNumbersText.textContent = hot;
  els.coldNumbersText.textContent = cold;

  if (primary.length) {
    renderBalls(primary, els.predictResultsList);
  } else {
    els.predictResultsList.innerHTML = `<div class="empty-text">資料不足，暫不產生推薦號碼</div>`;
  }

  state.currentPrediction = primary;
}

// ★ 調整 AI 呼叫邏輯：連線到 Replit 的預測 API
async function callAiApi(provider) {
  try {
    const modelName = provider === "gemini" ? "Gemini" : "機器學習 (Replit API)";
    setAiResult(`正在啟動 ${modelName} 模型並訓練中，請稍候...`, "loading");

    // 不論按哪個按鈕，我們現在統一呼叫您打造的 Replit 機器學習 API
    const res = await fetch(`${AI_API_BASE}/api/predict`, {
      method: "GET" // 我們的 Replit API 使用 GET 方法
    });

    if (!res.ok) {
      throw new Error(`API 伺服器狀態異常 (${res.status})，請確認 Replit 是否處於喚醒狀態。`);
    }

    const data = await res.json();

    if (data.status !== "success") {
       throw new Error(data.error || "無法取得預測資料");
    }

    // 將 Replit API 回傳的資料結構，轉換成您的網頁可以顯示的格式
    const predicted_numbers = data.predicted_numbers.map(Number);
    // 將信心指數轉換為 0~100 的分數形式 (例如 0.34 變 34 分)
    const confidenceScore = data.details && data.details.length > 0 
        ? Math.round(data.details[0].score * 100) 
        : "--";
        
    const reasoningList = data.details 
        ? data.details.map((item, idx) => `號碼 ${item.number} 的演算法權重指數為 ${item.score}`)
        : ["使用隨機森林演算法，根據歷史開獎數據動態訓練預測。"];

    const result = {
      recommended_numbers: predicted_numbers,
      backup_numbers: [], // 我們的 API 目前只回傳最推薦的五顆，不提供備選
      confidence: confidenceScore,
      reasoning: reasoningList
    };

    renderAiResult(result, "專屬機器學習 (Random Forest)");
    
    // 同步更新上方的主推薦號碼區塊
    updateDashboard(predicted_numbers, confidenceScore, sampleHistory(Number(els.analysisPeriods?.value || 120)));

  } catch (error) {
    setAiResult(`分析失敗：${error.message}`, "error");
  }
}

function renderAiResult(result, modelName) {
  const recommended = result.recommended_numbers || result.recommendedNumbers || [];
  const backup = result.backup_numbers || result.backupNumbers || [];
  const confidence = result.confidence ?? result.confidence_score ?? "--";
  const reasoning = Array.isArray(result.reasoning) ? result.reasoning : [];

  const html = `
    <div class="ai-result-title">${escapeHtml(modelName)} 分析結果</div>

    <div class="ai-result-block">
      <div class="ai-result-label">AI 推薦號碼</div>
      <div class="ai-ball-row">${renderAiBalls(recommended)}</div>
    </div>

    <div class="ai-result-block">
      <div class="ai-result-label">分析資訊</div>
      <div class="ai-result-meta">
        <span>最高模型信心指數：${escapeHtml(String(confidence))} / 100</span>
        <span>版本：${escapeHtml(APP_VERSION)}</span>
      </div>
    </div>

    <div class="ai-result-block">
      <div class="ai-result-label">演算法細節</div>
      <div class="ai-reason-list">
        ${
          reasoning.length
            ? reasoning.map((item, index) =>
                `<div class="ai-reason-item">${index + 1}. ${escapeHtml(item)}</div>`
              ).join("")
            : `<div class="ai-empty">無資料</div>`
        }
      </div>
    </div>
  `;

  setAiHtml(html);
}

function renderLatest(latest) {
  if (!latest) {
    els.latestIssue.textContent = "--";
    els.latestDate.textContent = "--";
    els.latestBalls.innerHTML = `<div class="empty-text">無法載入最新資料</div>`;
    return;
  }

  els.latestIssue.textContent = latest.period || "--";
  els.latestDate.textContent = formatDate(latest.lotteryDate);
  renderBalls(latest.numbers || [], els.latestBalls);
}

async function loadLatestFromCandidates() {
  const { json, path } = await fetchFirstJson(JSON_CANDIDATES);
  state.latestJson = json;
  state.lastPath = path;

  const latest539 = normalizeLatest539(json);
  if (!latest539) {
    console.error("latest.json raw =", json);
    throw new Error("latest.json 內沒有 daily539 可用資料");
  }

  state.latest539 = latest539;
  state.history539 = extractHistory539(json, latest539);

  return latest539;
}

function runQuickAnalysis() {
  const periods = Number(els.analysisPeriods?.value || 120);
  const currentMode = els.predictMode?.value || "balanced";
  const history = sampleHistory(periods);
  const primary = predictNumbers(currentMode, history);
  const confidence = estimateConfidence(primary, history, currentMode);

  updateDashboard(primary, confidence, history);
}

async function refreshAll() {
  try {
    els.heroUpdateText.textContent = "載入最新資料中...";
    const latest = await loadLatestFromCandidates();
    renderLatest(latest);

    els.dataSourceText.textContent = `資料來源：${state.lastPath || "latest.json"}`;
    els.dataUpdatedText.textContent = `更新時間：${formatDateTime(state.latestJson?.updatedAt || latest.lotteryDate)}`;
    els.heroUpdateText.textContent = `最新資料已載入｜版本 ${APP_VERSION}`;

    runQuickAnalysis();
  } catch (err) {
    console.error(err);
    els.heroUpdateText.textContent = "資料載入失敗";
    els.dataSourceText.textContent = "資料來源：錯誤";
    els.dataUpdatedText.textContent = "更新時間：--";
    els.latestBalls.innerHTML = `<div class="empty-text">資料載入失敗：${escapeHtml(err.message)}</div>`;
    setAiResult(`資料載入失敗：${err.message}`, "error");
  }
}

function bindActions() {
  els.btnRefresh?.addEventListener("click", refreshAll);
  els.btnQuickPick?.addEventListener("click", runQuickAnalysis);
  els.analysisPeriods?.addEventListener("change", runQuickAnalysis);
  els.predictMode?.addEventListener("change", runQuickAnalysis);

  els.btnGemini?.addEventListener("click", () => {
    callAiApi("gemini");
  });

  els.btnOpenai?.addEventListener("click", () => {
    callAiApi("openai");
  });
}

async function init() {
  bindActions();
  await refreshAll();
  setAiResult("請選擇下方 AI 模型啟動深度學習分析。", "loading");
}

document.addEventListener("DOMContentLoaded", init);
