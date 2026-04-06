const APP_VERSION = "AI Compact Final 1";
const AI_API_BASE = "https://lottery-ai-api.vercel.app";

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

function renderBall(value, extraClass = "range-1") {
  return `<span class="ball ${extraClass}">${pad2(value)}</span>`;
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

  return numbers
    .map((num) => `<span class="ai-ball">${pad2(num)}</span>`)
    .join("");
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
    )
      .map(Number)
      .filter(Number.isFinite);

    if (numbers.length >= 5) {
      return {
        period: item.period || item.issue || item.drawTerm || "--",
        lotteryDate:
          item.lotteryDate ||
          item.drawDate ||
          item.dDate ||
          item.date ||
          "",
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
        )
          .map(Number)
          .filter(Number.isFinite);

        if (numbers.length >= 5) {
          return {
            period: row.period || row.issue || row.drawTerm || "--",
            lotteryDate:
              row.lotteryDate ||
              row.drawDate ||
              row.dDate ||
              row.date ||
              "",
            numbers: numbers.slice(0, 5)
          };
        }
      }
    }
  }

  if (content?.daily539?.lotteryData) {
    const row = content.daily539.lotteryData;
    const numbers = (
      row.numbers ||
      row.drawNumberSize ||
      row.drawNumbers ||
      []
    )
      .map(Number)
      .filter(Number.isFinite);

    if (numbers.length >= 5) {
      return {
        period: row.period || row.issue || row.drawTerm || "--",
        lotteryDate:
          row.lotteryDate ||
          row.drawDate ||
          row.dDate ||
          row.date ||
          "",
        numbers: numbers.slice(0, 5)
      };
    }
  }

  return null;
}

function extractHistory539(json, latest) {
  const content = json?.content || json || {};
  const rows = [];

  if (Array.isArray(content.daily539History)) {
    rows.push(...content.daily539History);
  }

  if (Array.isArray(content.daily539Res)) {
    rows.push(...content.daily539Res);
  }

  if (Array.isArray(content.history)) {
    rows.push(...content.history);
  }

  const mapped = rows
    .map((row) => ({
      period: row.period || row.issue || "",
      lotteryDate: row.lotteryDate || row.drawDate || row.date || "",
      numbers: (row.numbers || row.drawNumberSize || [])
        .map(Number)
        .filter(Number.isFinite)
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

function tailBalancePick(source, limit = 5) {
  const usedTails = new Set();
  const result = [];

  for (const n of source) {
    const tail = n % 10;
    if (!usedTails.has(tail)) {
      usedTails.add(tail);
      result.push(n);
    }
    if (result.length >= limit) break;
  }

  return result;
}

function predictNumbers(mode, history) {
  const freq = countFrequency(history);
  const miss = getMissingCounts(history);

  const hot = pickTopFromMap(freq, 15, true);
  const cold = pickTopFromMap(freq, 15, false);
  const missingTop = [...miss.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 15)
    .map(([num]) => num);

  let picked = [];

  switch (mode) {
    case "hot":
      picked = hot.slice(0, 5);
      break;
    case "cold":
      picked = uniqSorted([...cold.slice(0, 3), ...missingTop.slice(0, 4)]).slice(0, 5);
      break;
    case "tail":
      picked = tailBalancePick(uniqSorted([...hot, ...missingTop]), 5);
      break;
    case "balanced":
    default:
      picked = uniqSorted([
        ...hot.slice(0, 2),
        ...missingTop.slice(0, 2),
        ...cold.slice(0, 2)
      ]).slice(0, 5);

      if (picked.length < 5) {
        picked = uniqSorted([...picked, ...hot, ...missingTop, ...cold]).slice(0, 5);
      }
      break;
  }

  return uniqSorted(picked).slice(0, 5);
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
  const freq = countFrequency(history);
  const hot = pickTopFromMap(freq, 5, true).map(pad2).join("、") || "--";
  const cold = pickTopFromMap(freq, 5, false).map(pad2).join("、") || "--";
  return { hot, cold };
}

function updateDashboard(primary, confidence, mode, history) {
  const { hot, cold } = getHotColdTexts(history);

  els.primaryNumbersText.textContent = primary.map(pad2).join("、") || "--";
  els.confidenceText.textContent = `${confidence} 分`;
  els.hotNumbersText.textContent = hot;
  els.coldNumbersText.textContent = cold;

  renderBalls(primary, els.predictResultsList);
  state.currentPrediction = primary;
}

function getLatest539Payload() {
  const latest = state.latest539 || null;

  if (latest) {
    return {
      game: "daily539",
      mode: els.predictMode?.value || "balanced",
      latestDraw: latest,
      history: sampleHistory(Number(els.analysisPeriods?.value || 120))
    };
  }

  const latestIssueText =
    document.body.innerText.match(/最新期數[:：]\s*([0-9]+)/)?.[1] || "";
  const latestDateText =
    document.body.innerText.match(/開獎日期[:：]\s*([0-9\-]+)/)?.[1] || "";

  const numberMatches = Array.from(document.querySelectorAll(".ball"))
    .map((el) => Number(el.textContent.trim()))
    .filter(Number.isFinite)
    .slice(0, 5);

  return {
    game: "daily539",
    mode: els.predictMode?.value || "balanced",
    latestDraw: {
      period: latestIssueText,
      lotteryDate: latestDateText,
      numbers: numberMatches
    },
    history: [
      {
        period: latestIssueText,
        lotteryDate: latestDateText,
        numbers: numberMatches
      }
    ]
  };
}

function buildAiPromptFallback(payload) {
  const latest = payload.latestDraw || {};
  const history = payload.history || [];
  const hotCold = getHotColdTexts(history);
  const primary = state.currentPrediction || [];

  return {
    title: "AI 分析結果",
    recommended_numbers: primary,
    backup_numbers: uniqSorted([
      ...pickTopFromMap(countFrequency(history), 4, true),
      ...pickTopFromMap(getMissingCounts(history), 4, true)
    ]).slice(0, 5),
    confidence: estimateConfidence(primary, history, payload.mode || "balanced"),
    reasoning: [
      `最新期數 ${latest.period || "--"}，最新開獎為 ${(latest.numbers || []).map(pad2).join("、") || "無資料"}`,
      `近期熱號偏向 ${hotCold.hot}`,
      `近期冷號偏向 ${hotCold.cold}`,
      `目前模式為 ${payload.mode || "balanced"}，以均衡搭配近期頻率與遺漏值挑選`
    ]
  };
}

function renderAiResult(result, modelName) {
  const recommended = result.recommended_numbers || result.recommendedNumbers || [];
  const backup = result.backup_numbers || result.backupNumbers || [];
  const confidence = result.confidence ?? result.confidence_score ?? "--";
  const reasoning = Array.isArray(result.reasoning) ? result.reasoning : [];

  const html = `
    <div class="ai-result-title">${escapeHtml(modelName)} 分析結果</div>

    <div class="ai-result-block">
      <div class="ai-result-label">推薦號碼</div>
      <div class="ai-ball-row">${renderAiBalls(recommended)}</div>
    </div>

    <div class="ai-result-block">
      <div class="ai-result-label">備選號碼</div>
      <div class="ai-ball-row">${renderAiBalls(backup)}</div>
    </div>

    <div class="ai-result-block">
      <div class="ai-result-label">分析資訊</div>
      <div class="ai-result-meta">
        <span>信心分數：${escapeHtml(String(confidence))}</span>
        <span>版本：${escapeHtml(APP_VERSION)}</span>
      </div>
    </div>

    <div class="ai-result-block">
      <div class="ai-result-label">分析理由</div>
      <div class="ai-reason-list">
        ${
          reasoning.length
            ? reasoning
                .map(
                  (item, index) =>
                    `<div class="ai-reason-item">${index + 1}. ${escapeHtml(item)}</div>`
                )
                .join("")
            : `<div class="ai-empty">無資料</div>`
        }
      </div>
    </div>
  `;

  setAiHtml(html);
}

async function callAiApi(provider) {
  try {
    setAiResult("AI 分析中...", "loading");

    const payload = getLatest539Payload();
    payload.recommended = state.currentPrediction || [];

    const res = await fetch(`${AI_API_BASE}/api/${provider}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await res.text();
    let data = null;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        data?.error ||
        data?.message ||
        rawText ||
        `API 錯誤（${res.status}）`;

      setAiResult(`${provider.toUpperCase()} 分析失敗：${msg}`, "error");
      return;
    }

    const result = data?.result || data?.data || data || buildAiPromptFallback(payload);
    renderAiResult(result, provider === "gemini" ? "Gemini" : "ChatGPT");
  } catch (error) {
    setAiResult(`分析失敗：${error.message}`, "error");
  }
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
    throw new Error("latest.json 內沒有 daily539 可用資料");
  }

  state.latest539 = latest539;
  state.history539 = extractHistory539(json, latest539);

  window.latestData = latest539;
  window.latestJson = json;
  window.appLatestData = latest539;

  return latest539;
}

function runQuickAnalysis() {
  const periods = Number(els.analysisPeriods?.value || 120);
  const currentMode = els.predictMode?.value || "balanced";
  const history = sampleHistory(periods);
  const primary = predictNumbers(currentMode, history);
  const confidence = estimateConfidence(primary, history, currentMode);

  updateDashboard(primary, confidence, currentMode, history);
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
  setAiResult("請選擇要使用的 AI 模型進行分析。", "loading");
}

document.addEventListener("DOMContentLoaded", init);