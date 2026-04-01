(() => {
  const APP_VERSION = "V3.7｜今彩539 專用版｜分享圖片穩定版";

  const STORAGE_KEYS = {
    favorites: "jincai539_favorites_v47",
    history: "jincai539_predict_history_v47",
    latest: "jincai539_latest_result_v47",
    status: "jincai539_data_status_v47",
    settings: "jincai539_user_settings_v47"
  };

  const JSON_CANDIDATES = [
    "./latest.json",
    "./docs/latest.json",
    "./539_api.json",
    "./docs/539_api.json",
    "./data/latest.json",
    "./data/539_api.json",
    "/latest.json",
    "/docs/latest.json",
    "/539_api.json",
    "/docs/539_api.json"
  ];

  const DEFAULT_LATEST = {
    period: "115000001",
    date: "2026-03-31",
    numbers: [5, 12, 21, 33, 39],
    recent5: [],
    recent50: [],
    updatedAt: "2026-03-31 20:05",
    source: "fallback-local"
  };

  const MOCK_HISTORY = [
    [5, 12, 21, 33, 39],
    [3, 8, 19, 27, 31],
    [7, 11, 18, 22, 35],
    [4, 15, 20, 29, 38],
    [1, 9, 16, 24, 37],
    [6, 13, 21, 28, 32],
    [2, 10, 19, 26, 34],
    [5, 14, 17, 30, 39],
    [8, 12, 23, 31, 36],
    [7, 18, 22, 27, 35],
    [4, 11, 20, 29, 33],
    [6, 9, 16, 21, 38],
    [3, 13, 24, 31, 39],
    [2, 15, 18, 27, 34],
    [1, 10, 19, 28, 35],
    [5, 12, 22, 30, 37],
    [8, 14, 21, 26, 32],
    [4, 9, 17, 29, 36],
    [6, 11, 20, 27, 38],
    [7, 13, 18, 31, 39]
  ];

  const MODE_LABELS = {
    balanced: "均衡型",
    hot: "熱號型",
    cold: "冷號型",
    tail: "尾數型",
    drag: "拖號型"
  };

  const MODE_LIST = ["balanced", "hot", "cold", "tail", "drag"];

  const PAYOUT_TABLE = {
    0: 0,
    1: 0,
    2: 50,
    3: 300,
    4: 8000,
    5: 8000000
  };

  const $ = (selector) => document.querySelector(selector);

  const els = {
    lastUpdateText: $("#lastUpdateText"),
    latestPeriod: $("#latestPeriod"),
    latestDate: $("#latestDate"),
    historyCount: $("#historyCount"),
    latestDrawNo: $("#latestDrawNo"),
    latestBalls: $("#latestBalls"),

    analysisPeriods: $("#analysisPeriods"),
    recommendCount: $("#recommendCount"),
    predictMode: $("#predictMode"),
    btnPredict: $("#btnPredict"),

    recommendBalls1: $("#recommendBalls1"),
    hotNums: $("#hotNums"),
    coldNums: $("#coldNums"),
    dragNums: $("#dragNums"),
    tailNums: $("#tailNums"),

    historyHotNums: $("#historyHotNums"),
    historyColdNums: $("#historyColdNums"),
    historyDragNums: $("#historyDragNums"),
    historyTailNums: $("#historyTailNums"),

    avgHit: $("#avgHit"),
    maxHit: $("#maxHit"),
    bestMode: $("#bestMode"),

    btnCopy: $("#btnCopy"),
    btnSave: $("#btnSave"),
    btnGoPredict: $("#btnGoPredict"),
    btnCopyAllPredict: $("#btnCopyAllPredict"),
    btnPredictSummary: $("#btnPredictSummary"),

    btnGenerateShareCard: $("#btnGenerateShareCard"),
    btnCloseSharePreview: $("#btnCloseSharePreview"),
    sharePreviewWrap: $("#sharePreviewWrap"),
    sharePreviewImage: $("#sharePreviewImage"),
    sharePreviewEmpty: $("#sharePreviewEmpty"),

    btnRecent5: $("#btnRecent5"),
    btnDataStatus: $("#btnDataStatus"),
    btnFullAnalysis: $("#btnFullAnalysis"),
    btnHitTrack: $("#btnHitTrack"),
    btnHistoryRefresh: $("#btnHistoryRefresh"),
    btnRefreshFavorites: $("#btnRefreshFavorites"),
    btnRefreshVisual: $("#btnRefreshVisual"),

    btnUseLatestDrag: $("#btnUseLatestDrag"),
    dragQueryNumber: $("#dragQueryNumber"),
    dragQueryScope: $("#dragQueryScope"),
    btnRunDragQuery: $("#btnRunDragQuery"),
    dragQuerySummary: $("#dragQuerySummary"),
    dragQueryResults: $("#dragQueryResults"),

    appVersionText: $("#appVersionText"),
    dataSourceText: $("#dataSourceText"),
    currentModeText: $("#currentModeText"),

    btnClearFavorites: $("#btnClearFavorites"),
    btnClearHistory: $("#btnClearHistory"),
    btnReloadData: $("#btnReloadData"),

    recent5List: $("#recent5List"),
    favoritesList: $("#favoritesList"),
    predictResultsList: $("#predictResultsList"),

    heatmapList: $("#heatmapList"),
    tailChartList: $("#tailChartList"),
    oddEvenChart: $("#oddEvenChart"),
    bigSmallChart: $("#bigSmallChart"),

    backtestCount: $("#backtestCount"),
    backtestMode: $("#backtestMode"),
    betAmount: $("#betAmount"),
    btnRunBacktest: $("#btnRunBacktest"),
    backtestAvgHit: $("#backtestAvgHit"),
    backtestMaxHit: $("#backtestMaxHit"),
    backtestTotal: $("#backtestTotal"),
    backtestModeText: $("#backtestModeText"),
    hitCount0: $("#hitCount0"),
    hitCount1: $("#hitCount1"),
    hitCount2: $("#hitCount2"),
    hitCount3: $("#hitCount3"),
    hitCount4: $("#hitCount4"),
    hitCount5: $("#hitCount5"),
    backtestResultsList: $("#backtestResultsList"),

    bestBacktestMode: $("#bestBacktestMode"),
    bestBacktestSuggestion: $("#bestBacktestSuggestion"),
    simTotalBet: $("#simTotalBet"),
    simTotalReturn: $("#simTotalReturn"),
    simNetProfit: $("#simNetProfit"),
    simBetAmountText: $("#simBetAmountText"),

    navButtons: document.querySelectorAll(".nav-btn"),
    pages: {
      home: $("#page-home"),
      predict: $("#page-predict"),
      history: $("#page-history"),
      favorites: $("#page-favorites"),
      backtest: $("#page-backtest"),
      settings: $("#page-settings")
    }
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function uniqueSorted(nums) {
    return [...new Set(nums)].sort((a, b) => a - b);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function saveUserSettings() {
    const settings = {
      analysisPeriods: els.analysisPeriods?.value || "120",
      recommendCount: els.recommendCount?.value || "3",
      predictMode: els.predictMode?.value || "balanced"
    };
    writeJSON(STORAGE_KEYS.settings, settings);
  }

  function loadUserSettings() {
    const settings = readJSON(STORAGE_KEYS.settings, null);
    if (!settings) return;
    if (els.analysisPeriods && settings.analysisPeriods) els.analysisPeriods.value = settings.analysisPeriods;
    if (els.recommendCount && settings.recommendCount) els.recommendCount.value = settings.recommendCount;
    if (els.predictMode && settings.predictMode) els.predictMode.value = settings.predictMode;
  }

  function normalizeDateText(value) {
    if (!value) return "";
    if (typeof value !== "string") value = String(value);
    return value.replace("T00:00:00", "").replace("T", " ").slice(0, 19);
  }

  function normalizeDateOnly(value) {
    const text = normalizeDateText(value);
    return text ? text.slice(0, 10) : "";
  }

  function toIntArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v >= 1 && v <= 39);
  }

  function normalizeRecentRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((item) => {
      const period = item.period || item.drawTerm || item.issue || item.term || item.drawNo || "";
      const date = normalizeDateOnly(item.lotteryDate || item.drawDate || item.dDate || item.date || "");
      const numbers = toIntArray(
        item.drawNumberSize || item.drawNumbers || item.numbers || item.orderNumbers || item.num || []
      );
      if (!period || numbers.length < 5) return null;
      return {
        period: String(period),
        date,
        numbers: uniqueSorted(numbers.slice(0, 5))
      };
    }).filter(Boolean);
  }

  function normalizeLatestFromAny(raw, sourceUrl = "") {
    if (!raw || typeof raw !== "object") return null;

    const candidates = [];
    if (raw.content?.daily539) candidates.push(raw.content.daily539);
    if (raw.daily539) candidates.push(raw.daily539);
    if (raw.period || raw.lotteryDate || raw.drawNumberSize || raw.numbers) candidates.push(raw);

    for (const item of candidates) {
      if (!item || typeof item !== "object") continue;

      const period = item.period || item.drawTerm || item.issue || item.term || item.drawNo || "";
      const date =
        normalizeDateOnly(item.lotteryDate || item.drawDate || item.dDate || item.date || "") || DEFAULT_LATEST.date;
      const numbers = toIntArray(
        item.drawNumberSize || item.drawNumbers || item.numbers || item.orderNumbers || item.num || []
      );

      if (period && numbers.length >= 5) {
        return {
          period: String(period),
          date,
          numbers: uniqueSorted(numbers.slice(0, 5)),
          recent5: normalizeRecentRows(raw.recent5 || raw.content?.recent5 || []),
          recent50: normalizeRecentRows(raw.recent50 || raw.content?.recent50 || raw.recent5 || []),
          updatedAt: normalizeDateText(raw.updatedAt || raw.generatedAt || item.updatedAt || new Date().toISOString()),
          source: sourceUrl || "remote-json"
        };
      }
    }

    return null;
  }

  async function fetchJSON(url) {
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function loadLatestFromCandidates() {
    for (const url of JSON_CANDIDATES) {
      try {
        const data = await fetchJSON(url);
        const normalized = normalizeLatestFromAny(data, url);
        if (normalized) {
          writeJSON(STORAGE_KEYS.latest, normalized);
          writeJSON(STORAGE_KEYS.status, {
            ok: true,
            source: url,
            version: APP_VERSION
          });
          return normalized;
        }
      } catch {}
    }

    const local = readJSON(STORAGE_KEYS.latest, null);
    if (local) return local;

    writeJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    return DEFAULT_LATEST;
  }

  function getRecentFiveDraws(latest) {
    if (Array.isArray(latest?.recent5) && latest.recent5.length) return latest.recent5.slice(0, 5);

    const rows = [];
    if (Array.isArray(latest?.numbers) && latest.numbers.length >= 5) {
      rows.push({
        period: latest.period || "",
        date: latest.date || "",
        numbers: uniqueSorted(latest.numbers.slice(0, 5))
      });
    }
    return rows;
  }

  function getBacktestSourceRows() {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    if (Array.isArray(latest?.recent50) && latest.recent50.length) return latest.recent50;
    if (Array.isArray(latest?.recent5) && latest.recent5.length) return latest.recent5;
    return [];
  }

  function sampleHistory(periods, latestNumbers = null) {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const recentReal =
      Array.isArray(latest?.recent50) && latest.recent50.length
        ? latest.recent50.map((item) => uniqueSorted(item.numbers || []))
        : Array.isArray(latest?.recent5)
          ? latest.recent5.map((item) => uniqueSorted(item.numbers || []))
          : [];

    const size = Math.min(Number(periods) || 120, 500);
    const source = [];

    if (recentReal.length) {
      source.push(...recentReal);
    } else if (Array.isArray(latestNumbers) && latestNumbers.length >= 5) {
      source.push(uniqueSorted(latestNumbers.slice(0, 5)));
    }

    while (source.length < size) {
      source.push(...MOCK_HISTORY);
    }

    return source.slice(0, size);
  }

  function getFrequency(history) {
    const freq = new Map();
    for (let i = 1; i <= 39; i++) freq.set(i, 0);
    history.forEach((draw) => draw.forEach((num) => freq.set(num, (freq.get(num) || 0) + 1)));
    return freq;
  }

  function getHotNumbers(history, count = 10) {
    const freq = getFrequency(history);
    return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, count).map(([n]) => n);
  }

  function getColdNumbers(history, count = 10) {
    const freq = getFrequency(history);
    return [...freq.entries()].sort((a, b) => a[1] - b[1] || a[0] - b[0]).slice(0, count).map(([n]) => n);
  }

  function getHotAndCold(freq) {
    const entries = [...freq.entries()];
    return {
      hot: [...entries].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 8).map(([n]) => n),
      cold: [...entries].sort((a, b) => a[1] - b[1] || a[0] - b[0]).slice(0, 8).map(([n]) => n)
    };
  }

  function getTailGroups(history) {
    const tails = new Map();
    for (let i = 0; i <= 9; i++) tails.set(i, 0);
    history.forEach((draw) => draw.forEach((num) => tails.set(num % 10, (tails.get(num % 10) || 0) + 1)));
    return [...tails.entries()].sort((a, b) => b[1] - a[1]);
  }

  function getStrongTailNumbers(history, count = 10) {
    const tails = getTailGroups(history);
    const topTails = tails.slice(0, 3).map(([tail]) => tail);
    const pool = [];
    for (let i = 1; i <= 39; i++) if (topTails.includes(i % 10)) pool.push(i);
    return pool.slice(0, count);
  }

  function getDragPairs(history) {
    const pairs = new Map();
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];
      current.forEach((a) => next.forEach((b) => {
        const key = `${a}->${b}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }));
    }
    return [...pairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));
  }

  function pickFromPool(pool, count) {
    return uniqueSorted(shuffle(pool).slice(0, count));
  }

  function fillToFive(base) {
    const picked = [...base];
    const used = new Set(picked);
    const candidates = shuffle(Array.from({ length: 39 }, (_, i) => i + 1));
    for (const n of candidates) {
      if (!used.has(n)) {
        picked.push(n);
        used.add(n);
      }
      if (picked.length >= 5) break;
    }
    return uniqueSorted(picked).slice(0, 5);
  }

  function predictNumbers(mode, history) {
    const hot = getHotNumbers(history, 12);
    const cold = getColdNumbers(history, 12);
    const tailPool = getStrongTailNumbers(history, 15);
    const dragPairs = getDragPairs(history);
    let result = [];

    if (mode === "hot") {
      result = fillToFive([...pickFromPool(hot, 4), ...pickFromPool(tailPool, 1)]);
    } else if (mode === "cold") {
      result = fillToFive([...pickFromPool(cold, 4), ...pickFromPool(tailPool, 1)]);
    } else if (mode === "tail") {
      result = fillToFive([...pickFromPool(tailPool, 3), ...pickFromPool(hot, 2)]);
    } else if (mode === "drag") {
      const dragNums = [];
      dragPairs.slice(0, 5).forEach((item) => {
        const [a, b] = item.key.split("->").map(Number);
        dragNums.push(a, b);
      });
      result = fillToFive([...pickFromPool(uniqueSorted(dragNums), 3), ...pickFromPool(hot, 2)]);
    } else {
      result = fillToFive([
        ...pickFromPool(hot, 2),
        ...pickFromPool(cold, 1),
        ...pickFromPool(tailPool, 1),
        ...pickFromPool(Array.from({ length: 39 }, (_, i) => i + 1), 1)
      ]);
    }

    return uniqueSorted(result);
  }

  function estimateConfidence(numbers, history, mode) {
    const hot = getHotNumbers(history, 12);
    const tails = getTailGroups(history).slice(0, 3).map(([tail]) => tail);
    let score = 60;
    numbers.forEach((n) => {
      if (hot.includes(n)) score += 4;
      if (tails.includes(n % 10)) score += 2;
    });
    if (mode === "hot") score += 6;
    if (mode === "tail") score += 4;
    if (mode === "drag") score += 5;
    if (mode === "balanced") score += 3;
    if (mode === "cold") score += 2;
    return Math.min(98, score);
  }

  function renderBalls(container, numbers, active = false) {
    if (!container) return;
    container.innerHTML = (numbers || [])
      .map((num) => `<span class="ball${active ? " active" : ""}">${pad2(num)}</span>`)
      .join("");
  }

  function formatNums(nums) {
    return (nums || []).map(pad2).join(" ");
  }

  function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("zh-TW")}元`;
  }

  function renderLatest(latest) {
    if (!latest) latest = DEFAULT_LATEST;
    if (els.lastUpdateText) els.lastUpdateText.textContent = latest.updatedAt || DEFAULT_LATEST.updatedAt;
    if (els.latestPeriod) els.latestPeriod.textContent = latest.period || DEFAULT_LATEST.period;
    if (els.latestDate) els.latestDate.textContent = latest.date || DEFAULT_LATEST.date;
    if (els.latestDrawNo) els.latestDrawNo.textContent = latest.period || DEFAULT_LATEST.period;
    renderBalls(els.latestBalls, latest.numbers || DEFAULT_LATEST.numbers, false);
  }

  function getAnalysisSummary(history) {
    const freq = getFrequency(history);
    const { hot, cold } = getHotAndCold(freq);
    const tails = getTailGroups(history);
    const drags = getDragPairs(history);
    return {
      hotText: formatNums(hot.slice(0, 3)),
      coldText: formatNums(cold.slice(0, 3)),
      dragText: drags.slice(0, 2).map((d) => d.key.replace("->", "→")).join("、") || "暫無",
      tailText: tails.slice(0, 2).map(([tail]) => `${tail}尾`).join("、")
    };
  }

  function calcHitStats(records) {
    if (!records.length) return { avg: "0顆", max: "0顆", bestMode: "均衡型" };

    const recent = records.slice(-5);
    const hitCounts = recent.map((r) => r.hitCount || 0);
    const avg = (hitCounts.reduce((a, b) => a + b, 0) / hitCounts.length).toFixed(1);
    const max = Math.max(...hitCounts);

    const modeMap = new Map();
    records.forEach((r) => {
      const key = r.modeLabel || "均衡型";
      const prev = modeMap.get(key) || { total: 0, count: 0 };
      prev.total += r.hitCount || 0;
      prev.count += 1;
      modeMap.set(key, prev);
    });

    let bestMode = "均衡型";
    let bestScore = -1;
    for (const [mode, val] of modeMap.entries()) {
      const score = val.total / val.count;
      if (score > bestScore) {
        bestScore = score;
        bestMode = mode;
      }
    }

    return { avg: `${avg}顆`, max: `${max}顆`, bestMode };
  }

  function compareHit(predicted, actual) {
    const actualSet = new Set(actual);
    return predicted.filter((n) => actualSet.has(n)).length;
  }

  function getPayoutByHit(hitCount) {
    return PAYOUT_TABLE[hitCount] || 0;
  }

  function savePredictRecord(record) {
    const oldHistory = readJSON(STORAGE_KEYS.history, []);
    oldHistory.push(record);
    writeJSON(STORAGE_KEYS.history, oldHistory);
  }

  function saveFavoriteNumbers(numbers) {
    const balls = (numbers || []).map(pad2);
    if (!balls.length) {
      alert("目前沒有可收藏的號碼");
      return;
    }

    const oldFavorites = readJSON(STORAGE_KEYS.favorites, []);
    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      numbers: balls
    };

    oldFavorites.unshift(newItem);
    writeJSON(STORAGE_KEYS.favorites, oldFavorites.slice(0, 100));
    renderFavoritesList();
    alert(`已收藏：${balls.join(" ")}`);
  }

  async function copyNumbers(numbers) {
    const text = (numbers || []).map(pad2).join(" ");
    if (!text) {
      alert("目前沒有可複製的號碼");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert(`已複製：${text}`);
    } catch {
      alert(`複製失敗，請手動複製：${text}`);
    }
  }

  function deleteFavorite(id) {
    const oldFavorites = readJSON(STORAGE_KEYS.favorites, []);
    writeJSON(STORAGE_KEYS.favorites, oldFavorites.filter((item) => item.id !== id));
    renderFavoritesList();
    alert("已刪除這組收藏");
  }

  function getModeMeta(mode) {
    if (mode === "hot") return ["熱號優先", "近期偏強"];
    if (mode === "cold") return ["冷號反轉", "低頻嘗試"];
    if (mode === "tail") return ["尾數強勢", "尾群集中"];
    if (mode === "drag") return ["拖號分析", "連動參考"];
    return ["均衡混合", "熱冷搭配"];
  }

  function updateAnalysisViews(history) {
    const summary = getAnalysisSummary(history);
    if (els.hotNums) els.hotNums.textContent = summary.hotText;
    if (els.coldNums) els.coldNums.textContent = summary.coldText;
    if (els.dragNums) els.dragNums.textContent = summary.dragText;
    if (els.tailNums) els.tailNums.textContent = summary.tailText;
    if (els.historyHotNums) els.historyHotNums.textContent = summary.hotText;
    if (els.historyColdNums) els.historyColdNums.textContent = summary.coldText;
    if (els.historyDragNums) els.historyDragNums.textContent = summary.dragText;
    if (els.historyTailNums) els.historyTailNums.textContent = summary.tailText;
  }

  function updateDashboard(numbers, confidence, mode, history) {
    renderBalls(els.recommendBalls1, numbers, true);
    updateAnalysisViews(history);

    const saved = readJSON(STORAGE_KEYS.history, []);
    const stats = calcHitStats(saved);

    if (els.avgHit) els.avgHit.textContent = stats.avg;
    if (els.maxHit) els.maxHit.textContent = stats.max;
    if (els.bestMode) els.bestMode.textContent = stats.bestMode || MODE_LABELS[mode] || "均衡型";

    const meta = getModeMeta(mode);
    const metaBox = document.querySelector(".recommend-meta");
    if (metaBox) {
      metaBox.innerHTML = `
        <span>信心：<strong>${confidence}</strong></span>
        <span>${meta[0]}</span>
        <span>${meta[1]}</span>
      `;
    }

    if (els.currentModeText) {
      els.currentModeText.textContent = MODE_LABELS[mode] || "均衡型";
    }
  }

  function renderPredictResults(allPredictions, mode, confidence) {
    if (!els.predictResultsList) return;

    els.predictResultsList.innerHTML = allPredictions.map((nums, idx) => {
      const ballsHtml = nums.map((n) => `<span class="ball active">${pad2(n)}</span>`).join("");
      return `
        <div class="analysis-item">
          <span class="label">推薦${idx + 1}</span>
          <div class="balls-row" style="margin-top:8px;">${ballsHtml}</div>
          <strong style="margin-top:10px; display:block;">模式：${MODE_LABELS[mode] || "均衡型"}</strong>
          <strong style="margin-top:6px; display:block;">號碼：${formatNums(nums)}</strong>
          <strong style="margin-top:6px; display:block;">信心參考：${confidence}</strong>
          <div class="action-row" style="margin-top:12px;">
            <button class="secondary-btn" data-copy-index="${idx}">複製這組</button>
            <button class="secondary-btn" data-save-index="${idx}">收藏這組</button>
          </div>
        </div>
      `;
    }).join("");

    els.predictResultsList.querySelectorAll("[data-copy-index]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = Number(btn.dataset.copyIndex);
        await copyNumbers(allPredictions[idx] || []);
      });
    });

    els.predictResultsList.querySelectorAll("[data-save-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.saveIndex);
        saveFavoriteNumbers(allPredictions[idx] || []);
      });
    });
  }

  function buildShareSvg(numbers, modeLabel, confidence, updatedAt) {
    const nums = (numbers || []).map((n) => pad2(n));
    const circles = nums.map((num, i) => {
      const x = 95 + i * 118;
      const y = i === 4 ? 410 : 292;
      const xx = i === 4 ? 95 : x;
      return `
        <g>
          <circle cx="${xx}" cy="${y}" r="42" fill="url(#ballGrad)" />
          <circle cx="${xx}" cy="${y}" r="42" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
          <text x="${xx}" y="${y + 14}" text-anchor="middle" font-size="30" font-weight="700" fill="#ffffff">${num}</text>
        </g>
      `;
    }).join("");

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="750" height="960" viewBox="0 0 750 960">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08142f"/>
      <stop offset="55%" stop-color="#0f1f4d"/>
      <stop offset="100%" stop-color="#132d6b"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.08)"/>
    </linearGradient>
    <linearGradient id="ballGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>

  <rect width="750" height="960" fill="url(#bg)"/>
  <rect x="38" y="38" width="674" height="884" rx="34" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>

  <text x="70" y="115" font-size="34" font-weight="700" fill="#ffffff">今彩539 AI 預測系統</text>
  <text x="70" y="160" font-size="22" font-weight="600" fill="#c7d7ff">推薦分享卡</text>

  <rect x="70" y="195" width="610" height="300" rx="28" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.14)"/>
  <text x="102" y="245" font-size="24" font-weight="700" fill="#dbe8ff">推薦號碼</text>
  ${circles}

  <rect x="70" y="540" width="610" height="150" rx="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.10)"/>
  <text x="102" y="590" font-size="24" font-weight="700" fill="#dbe8ff">預測資訊</text>
  <text x="102" y="635" font-size="24" font-weight="600" fill="#ffffff">模式：${modeLabel}</text>
  <text x="102" y="675" font-size="24" font-weight="600" fill="#ffffff">信心參考：${confidence}</text>

  <rect x="70" y="730" width="610" height="120" rx="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.10)"/>
  <text x="102" y="780" font-size="24" font-weight="700" fill="#dbe8ff">資料資訊</text>
  <text x="102" y="822" font-size="22" font-weight="600" fill="#ffffff">最後更新：${updatedAt}</text>

  <text x="375" y="905" text-anchor="middle" font-size="20" font-weight="600" fill="#b8cafb">guotang96-creator.github.io/lottery</text>
</svg>
    `.trim();
  }

  function generateShareCard() {
    const firstCard = document.querySelector("#predictResultsList .analysis-item");
    if (!firstCard) {
      alert("目前還沒有可分享的預測結果，請先按「立即預測」");
      return;
    }

    const numbers = [...firstCard.querySelectorAll(".ball")]
      .map((el) => Number(el.textContent?.trim()))
      .filter((v) => Number.isFinite(v));

    if (!numbers.length) {
      alert("找不到推薦號碼");
      return;
    }

    const mode = els.predictMode?.value || "balanced";
    const modeLabel = MODE_LABELS[mode] || "均衡型";
    const confidenceMatch = firstCard.textContent?.match(/信心參考：(\d+)/);
    const confidence = confidenceMatch ? confidenceMatch[1] : "78";
    const updatedAt = els.lastUpdateText?.textContent || "";

    const svg = buildShareSvg(numbers, modeLabel, confidence, updatedAt);
    const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

    if (els.sharePreviewImage) {
      els.sharePreviewImage.src = encoded;
    }
    if (els.sharePreviewWrap) {
      els.sharePreviewWrap.style.display = "block";
    }
    if (els.sharePreviewEmpty) {
      els.sharePreviewEmpty.style.display = "none";
    }

    alert("分享圖片已生成，往下可看到預覽圖");
  }

  function clearSharePreview() {
    if (els.sharePreviewWrap) els.sharePreviewWrap.style.display = "none";
    if (els.sharePreviewImage) els.sharePreviewImage.removeAttribute("src");
    if (els.sharePreviewEmpty) els.sharePreviewEmpty.style.display = "block";
  }

  function renderFavoritesList() {
    if (!els.favoritesList) return;
    const favorites = readJSON(STORAGE_KEYS.favorites, []);
    if (!favorites.length) {
      els.favoritesList.innerHTML = `
        <div class="analysis-item">
          <span class="label">目前尚無收藏</span>
          <strong>你可以在預測頁點「收藏這組」</strong>
        </div>
      `;
      return;
    }

    els.favoritesList.innerHTML = favorites.map((item, idx) => {
      const numsNum = (item.numbers || []).map((n) => Number(n));
      const ballsHtml = numsNum.map((n) => `<span class="ball active">${pad2(n)}</span>`).join("");
      return `
        <div class="analysis-item">
          <span class="label">收藏 ${idx + 1}</span>
          <div class="balls-row" style="margin-top:8px;">${ballsHtml}</div>
          <strong style="margin-top:10px; display:block;">號碼：${(item.numbers || []).join(" ")}</strong>
          <strong style="margin-top:6px; display:block;">收藏時間：${normalizeDateText(item.createdAt || "")}</strong>
          <div class="action-row" style="margin-top:12px;">
            <button class="secondary-btn" data-fav-copy="${item.id}">複製</button>
            <button class="secondary-btn" data-fav-delete="${item.id}">刪除</button>
          </div>
        </div>
      `;
    }).join("");

    favorites.forEach((item) => {
      const copyBtn = els.favoritesList.querySelector(`[data-fav-copy="${item.id}"]`);
      const deleteBtn = els.favoritesList.querySelector(`[data-fav-delete="${item.id}"]`);

      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          await copyNumbers((item.numbers || []).map((n) => Number(n)));
        });
      }
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => deleteFavorite(item.id));
      }
    });
  }

  function getVisualHistorySource() {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);

    if (Array.isArray(latest?.recent50) && latest.recent50.length) {
      return latest.recent50.map((item) => uniqueSorted(item.numbers || []));
    }

    if (Array.isArray(latest?.recent5) && latest.recent5.length) {
      return latest.recent5.map((item) => uniqueSorted(item.numbers || []));
    }

    return sampleHistory(50, latest.numbers);
  }

  function renderBarList(container, rows, maxValue) {
    if (!container) return;

    container.innerHTML = rows.map((row) => {
      const width = maxValue > 0 ? (row.value / maxValue) * 100 : 0;
      const safeWidth = Math.max(12, width);

      return `
        <div style="margin:12px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="font-size:16px;font-weight:800;color:#0f172a;">${row.label}</div>
            <div style="font-size:15px;font-weight:800;color:#334155;">${row.value}</div>
          </div>
          <div style="height:18px;border-radius:999px;background:#e5edf7;overflow:hidden;border:1px solid #d6e0eb;">
            <div style="height:100%;width:${safeWidth}%;border-radius:999px;background:linear-gradient(135deg,#2563eb,#60a5fa);"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderHeatmap(history) {
    if (!els.heatmapList) return;
    const freq = getFrequency(history);
    const top10 = [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 10)
      .map(([num, count]) => ({ label: pad2(num), value: count }));
    const maxValue = top10.length ? top10[0].value : 1;
    renderBarList(els.heatmapList, top10, maxValue);
  }

  function renderTailChart(history) {
    if (!els.tailChartList) return;
    const tails = getTailGroups(history).map(([tail, count]) => ({
      label: `${tail}尾`,
      value: count
    }));
    const maxValue = tails.length ? tails[0].value : 1;
    renderBarList(els.tailChartList, tails, maxValue);
  }

  function renderOddEvenChart(history) {
    if (!els.oddEvenChart) return;

    let odd = 0;
    let even = 0;

    history.forEach((draw) => {
      draw.forEach((num) => {
        if (num % 2 === 0) even += 1;
        else odd += 1;
      });
    });

    renderBarList(
      els.oddEvenChart,
      [
        { label: "奇數", value: odd },
        { label: "偶數", value: even }
      ],
      Math.max(odd, even, 1)
    );
  }

  function renderBigSmallChart(history) {
    if (!els.bigSmallChart) return;

    let small = 0;
    let big = 0;

    history.forEach((draw) => {
      draw.forEach((num) => {
        if (num >= 1 && num <= 19) small += 1;
        else if (num >= 20 && num <= 39) big += 1;
      });
    });

    renderBarList(
      els.bigSmallChart,
      [
        { label: "小區", value: small },
        { label: "大區", value: big }
      ],
      Math.max(small, big, 1)
    );
  }

  function renderVisualAnalysis() {
    const history = getVisualHistorySource();
    renderHeatmap(history);
    renderTailChart(history);
    renderOddEvenChart(history);
    renderBigSmallChart(history);
  }

  function getDragQueryRows(scope) {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const rows =
      Array.isArray(latest?.recent50) && latest.recent50.length
        ? latest.recent50
        : Array.isArray(latest?.recent5)
          ? latest.recent5
          : [];

    return rows.slice(0, Number(scope) || 50);
  }

  function fillLatestDragNumber() {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const firstNum = Array.isArray(latest?.numbers) && latest.numbers.length ? latest.numbers[0] : "";
    if (els.dragQueryNumber) {
      els.dragQueryNumber.value = firstNum || "";
    }
  }

  function renderDragQueryResultList(rows, maxCount) {
    if (!els.dragQueryResults) return;

    if (!rows.length) {
      els.dragQueryResults.innerHTML = `
        <div style="font-size:15px;font-weight:700;color:#64748b;">查無符合資料</div>
      `;
      return;
    }

    els.dragQueryResults.innerHTML = rows.map((row, index) => {
      const width = maxCount > 0 ? Math.max(12, (row.count / maxCount) * 100) : 12;
      return `
        <div style="margin:14px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="font-size:16px;font-weight:900;color:#0f172a;">Top ${index + 1}｜${pad2(row.number)}</div>
            <div style="font-size:14px;font-weight:800;color:#334155;">${row.count}次｜${row.rate}%</div>
          </div>
          <div style="height:18px;border-radius:999px;background:#e5edf7;overflow:hidden;border:1px solid #d6e0eb;">
            <div style="height:100%;width:${width}%;border-radius:999px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function runDragQuery() {
    const target = Number(els.dragQueryNumber?.value || 0);
    const scope = Number(els.dragQueryScope?.value || 50);

    if (!Number.isInteger(target) || target < 1 || target > 39) {
      alert("請輸入 01～39 的號碼");
      return;
    }

    const rows = getDragQueryRows(scope);
    if (rows.length < 2) {
      alert("目前資料不足，無法查詢拖號");
      return;
    }

    let triggerCount = 0;
    const nextFreq = new Map();

    for (let i = 0; i < rows.length - 1; i++) {
      const currentNums = uniqueSorted(rows[i].numbers || []);
      const nextNums = uniqueSorted(rows[i + 1].numbers || []);

      if (currentNums.includes(target)) {
        triggerCount += 1;
        nextNums.forEach((num) => {
          nextFreq.set(num, (nextFreq.get(num) || 0) + 1);
        });
      }
    }

    if (!triggerCount) {
      if (els.dragQuerySummary) {
        els.dragQuerySummary.textContent = `最近 ${scope} 期內，${pad2(target)} 尚未出現在可分析區間`;
      }
      if (els.dragQueryResults) {
        els.dragQueryResults.innerHTML = `<div style="font-size:15px;font-weight:700;color:#64748b;">查無拖號資料</div>`;
      }
      return;
    }

    const top5 = [...nextFreq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 5)
      .map(([number, count]) => ({
        number,
        count,
        rate: ((count / triggerCount) * 100).toFixed(1)
      }));

    const maxCount = top5.length ? top5[0].count : 1;

    if (els.dragQuerySummary) {
      els.dragQuerySummary.textContent =
        `${pad2(target)} 在最近 ${scope} 期可分析區間中出現 ${triggerCount} 次；下期常見拖號如下`;
    }

    renderDragQueryResultList(top5, maxCount);
  }

  function evaluateModePerformance(rows, mode, sampleWindow = 20) {
    const results = [];

    for (let i = 0; i < rows.length; i++) {
      const actualRow = rows[i];
      const historyRows = rows.slice(i + 1, i + 1 + sampleWindow).map((r) => uniqueSorted(r.numbers || []));
      const history = historyRows.length ? historyRows : MOCK_HISTORY.slice(0, 20).map((r) => uniqueSorted(r));
      const predicted = predictNumbers(mode, history);
      const actual = uniqueSorted(actualRow.numbers || []);
      const hitCount = compareHit(predicted, actual);

      results.push({ hitCount });
    }

    const total = results.length || 1;
    const avgHit = results.reduce((sum, row) => sum + row.hitCount, 0) / total;
    const maxHit = results.length ? Math.max(...results.map((r) => r.hitCount)) : 0;

    return {
      mode,
      avgHit,
      maxHit
    };
  }

  function findBestBacktestMode(rows) {
    const rankings = MODE_LIST.map((mode) => evaluateModePerformance(rows, mode, 20))
      .sort((a, b) => b.avgHit - a.avgHit || b.maxHit - a.maxHit);

    return rankings[0] || { mode: "balanced", avgHit: 0, maxHit: 0 };
  }

  function renderBestModeSuggestion(best) {
    if (els.bestBacktestMode) {
      els.bestBacktestMode.textContent =
        `${MODE_LABELS[best.mode] || best.mode}｜平均 ${(best.avgHit || 0).toFixed(1)} 顆｜最高 ${best.maxHit || 0} 顆`;
    }

    if (els.bestBacktestSuggestion) {
      els.bestBacktestSuggestion.textContent =
        `根據本次回測，建議本次優先參考「${MODE_LABELS[best.mode] || best.mode}」模式`;
    }
  }

  function renderProfitSimulation(results, betAmount) {
    const totalBet = results.length * betAmount;
    const totalReturn = results.reduce((sum, row) => sum + getPayoutByHit(row.hitCount), 0);
    const net = totalReturn - totalBet;

    if (els.simTotalBet) els.simTotalBet.textContent = formatMoney(totalBet);
    if (els.simTotalReturn) els.simTotalReturn.textContent = formatMoney(totalReturn);
    if (els.simNetProfit) els.simNetProfit.textContent = formatMoney(net);
    if (els.simBetAmountText) els.simBetAmountText.textContent = formatMoney(betAmount);
  }

  async function copyAllPredictions() {
    const cards = [...document.querySelectorAll("#predictResultsList .analysis-item")];
    if (!cards.length) {
      alert("目前沒有可複製的預測結果");
      return;
    }

    const text = cards.map((card, idx) => {
      const balls = [...card.querySelectorAll(".ball")]
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      return `推薦${idx + 1}：${balls}`;
    }).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      alert(`已複製全部推薦：\n\n${text}`);
    } catch {
      alert(`複製失敗，請手動複製：\n\n${text}`);
    }
  }

  function showPredictSummary() {
    alert(
      `預測摘要\n\n` +
      `熱門號：${els.hotNums?.textContent || ""}\n` +
      `冷門號：${els.coldNums?.textContent || ""}\n` +
      `拖號組：${els.dragNums?.textContent || ""}\n` +
      `尾數強勢：${els.tailNums?.textContent || ""}`
    );
  }

  function renderRecent5List() {
    if (!els.recent5List) return;
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const history = getRecentFiveDraws(latest);

    els.recent5List.innerHTML = history.map((draw, idx) => {
      const nums = formatNums(draw.numbers || []);
      const periodText = draw.period ? `第${draw.period}期` : `參考第${idx + 1}筆`;
      const dateText = draw.date || "-";
      return `
        <div class="analysis-item">
          <span class="label">${periodText}</span>
          <strong>${dateText}</strong>
          <strong style="margin-top:6px;">${nums}</strong>
        </div>
      `;
    }).join("");
  }

  function renderBacktestResults(results, mode) {
    if (!els.backtestResultsList) return;

    els.backtestResultsList.innerHTML = results.map((item, idx) => {
      const predBalls = item.predicted.map((n) => `<span class="ball active">${pad2(n)}</span>`).join("");
      const actualBalls = item.actual.map((n) => `<span class="ball">${pad2(n)}</span>`).join("");
      const payout = getPayoutByHit(item.hitCount);

      return `
        <div class="analysis-item">
          <span class="label">${idx + 1}. 第${item.period}期｜${item.date}</span>
          <strong style="margin-bottom:8px;">模式：${MODE_LABELS[mode] || mode}</strong>
          <div class="balls-row" style="margin-top:8px;">${predBalls}</div>
          <strong style="margin-top:10px;">預測：${formatNums(item.predicted)}</strong>
          <div class="balls-row" style="margin-top:12px;">${actualBalls}</div>
          <strong style="margin-top:10px;">實際：${formatNums(item.actual)}</strong>
          <strong style="margin-top:10px;">命中：${item.hitCount} 顆</strong>
          <strong style="margin-top:10px;">模擬回收：${formatMoney(payout)}</strong>
        </div>
      `;
    }).join("");
  }

  function runBacktest() {
    const count = Number(els.backtestCount?.value || 20);
    const mode = els.backtestMode?.value || "balanced";
    const betAmount = Number(els.betAmount?.value || 50);

    const rows = getBacktestSourceRows().slice(0, count);
    if (!rows.length) {
      alert("目前沒有足夠的 recent50 資料可回測");
      return;
    }

    const results = [];

    for (let i = 0; i < rows.length; i++) {
      const actualRow = rows[i];
      const historyRows = rows.slice(i + 1, i + 21).map((r) => uniqueSorted(r.numbers || []));
      const history = historyRows.length ? historyRows : MOCK_HISTORY.slice(0, 20).map((r) => uniqueSorted(r));
      const predicted = predictNumbers(mode, history);
      const actual = uniqueSorted(actualRow.numbers || []);
      const hitCount = compareHit(predicted, actual);

      results.push({
        period: actualRow.period || "",
        date: actualRow.date || "",
        predicted,
        actual,
        hitCount
      });
    }

    const total = results.length;
    const hitCounts = results.map((r) => r.hitCount);
    const avg = total ? (hitCounts.reduce((a, b) => a + b, 0) / total).toFixed(1) : "0.0";
    const max = total ? Math.max(...hitCounts) : 0;

    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    hitCounts.forEach((n) => {
      distribution[n] = (distribution[n] || 0) + 1;
    });

    if (els.backtestAvgHit) els.backtestAvgHit.textContent = `${avg}顆`;
    if (els.backtestMaxHit) els.backtestMaxHit.textContent = `${max}顆`;
    if (els.backtestTotal) els.backtestTotal.textContent = `${total}期`;
    if (els.backtestModeText) els.backtestModeText.textContent = MODE_LABELS[mode] || mode;

    if (els.hitCount0) els.hitCount0.textContent = `${distribution[0] || 0}次`;
    if (els.hitCount1) els.hitCount1.textContent = `${distribution[1] || 0}次`;
    if (els.hitCount2) els.hitCount2.textContent = `${distribution[2] || 0}次`;
    if (els.hitCount3) els.hitCount3.textContent = `${distribution[3] || 0}次`;
    if (els.hitCount4) els.hitCount4.textContent = `${distribution[4] || 0}次`;
    if (els.hitCount5) els.hitCount5.textContent = `${distribution[5] || 0}次`;

    renderBacktestResults(results, mode);

    const best = findBestBacktestMode(rows);
    renderBestModeSuggestion(best);
    renderProfitSimulation(results, betAmount);

    alert(
      `回測完成\n\n模式：${MODE_LABELS[mode] || mode}\n回測期數：${total}期\n平均命中：${avg}顆\n最高命中：${max}顆`
    );
  }

  function switchPage(page) {
    Object.entries(els.pages).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("hidden", key !== page);
    });

    els.navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });
  }

  function generatePrediction() {
    const periods = Number(els.analysisPeriods?.value || 120);
    const recommendCount = Number(els.recommendCount?.value || 3);
    const mode = els.predictMode?.value || "balanced";
    const modeLabel = MODE_LABELS[mode] || "均衡型";

    saveUserSettings();

    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const history = sampleHistory(periods, latest.numbers);
    const allPredictions = [];

    for (let i = 0; i < recommendCount; i++) {
      allPredictions.push(predictNumbers(mode, history));
    }

    const primary = allPredictions[0];
    const confidence = estimateConfidence(primary, history, mode);
    const hitCount = compareHit(primary, latest.numbers || DEFAULT_LATEST.numbers);

    savePredictRecord({
      createdAt: new Date().toISOString(),
      mode,
      modeLabel,
      periods,
      recommendCount,
      numbers: primary,
      confidence,
      hitCount
    });

    if (els.historyCount) els.historyCount.textContent = `最近 ${periods} 期`;

    updateDashboard(primary, confidence, mode, history);
    renderPredictResults(allPredictions, mode, confidence);

    alert(
      `539 預測完成\n\n模式：${modeLabel}\n分析期數：${periods}期\n推薦組數：${recommendCount}組\n\n主推薦：${formatNums(primary)}\n主推薦信心：${confidence}`
    );
  }

  async function copyPrediction() {
    const balls = [...document.querySelectorAll("#recommendBalls1 .ball")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean);
    if (!balls.length) return alert("目前沒有可複製的號碼");

    try {
      await navigator.clipboard.writeText(balls.join(" "));
      alert(`已複製：${balls.join(" ")}`);
    } catch {
      alert(`複製失敗，請手動複製：${balls.join(" ")}`);
    }
  }

  function saveFavorite() {
    const balls = [...document.querySelectorAll("#recommendBalls1 .ball")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .map((v) => Number(v));
    saveFavoriteNumbers(balls);
  }

  function showRecent5() {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const history = getRecentFiveDraws(latest);
    const text = history.map((draw, idx) => {
      const nums = formatNums(draw.numbers || []);
      const dateText = draw.date ? `｜${draw.date}` : "";
      const periodText = draw.period ? `第${draw.period}期` : `參考第${idx + 1}筆`;
      return `${idx + 1}. ${periodText}${dateText}｜${nums}`;
    }).join("\n");

    alert(`最近 5 期開獎\n\n${text}`);
  }

  function showDataStatus() {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const status = readJSON(STORAGE_KEYS.status, {
      ok: true,
      source: "local-cache",
      version: APP_VERSION
    });

    alert(
      `資料狀態詳情\n\n` +
      `版本：${status.version || APP_VERSION}\n` +
      `最新期數：${latest.period}\n` +
      `最新日期：${latest.date}\n` +
      `最新號碼：${formatNums(latest.numbers || [])}\n` +
      `最後更新：${latest.updatedAt}\n` +
      `資料來源：${status.source || "local-cache"}\n` +
      `狀態：${status.ok ? "正常" : "異常"}`
    );
  }

  function showFullAnalysis() {
    const periods = Number(els.analysisPeriods?.value || 120);
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const history = sampleHistory(periods, latest.numbers);
    const freq = getFrequency(history);
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);

    const top10 = sorted.slice(0, 10).map(([n, c]) => `${pad2(n)}（${c}次）`).join("\n");
    alert(`完整分析\n\n最近 ${periods} 期熱門號 Top 10：\n${top10}`);
  }

  function showHitTrack() {
    const records = readJSON(STORAGE_KEYS.history, []);
    if (!records.length) return alert("目前還沒有命中追蹤資料");

    const recent = records.slice(-5);
    const text = recent
      .map((r, idx) => `${idx + 1}. ${r.modeLabel}｜${formatNums(r.numbers || [])}｜命中 ${r.hitCount || 0} 顆`)
      .join("\n");

    const stats = calcHitStats(records);
    alert(`最近命中追蹤\n\n${text}\n\n平均：${stats.avg}\n最高：${stats.max}\n最佳模式：${stats.bestMode}`);
  }

  async function reloadData() {
    const latest = await loadLatestFromCandidates();
    renderLatest(latest);
    renderRecent5List();
    renderFavoritesList();
    renderVisualAnalysis();
    fillLatestDragNumber();

    const periods = Number(els.analysisPeriods?.value || 120);
    const currentMode = els.predictMode?.value || "balanced";
    const history = sampleHistory(periods, latest.numbers);
    const primary = predictNumbers(currentMode, history);
    const confidence = estimateConfidence(primary, history, currentMode);

    updateDashboard(primary, confidence, currentMode, history);
    renderPredictResults([primary], currentMode, confidence);

    if (els.dataSourceText) els.dataSourceText.textContent = latest.source || "latest.json";
    alert("資料已重新載入");
  }

  function bindNav() {
    els.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => switchPage(btn.dataset.page));
    });
  }

  function bindActions() {
    if (els.btnPredict) els.btnPredict.addEventListener("click", generatePrediction);
    if (els.btnCopy) els.btnCopy.addEventListener("click", copyPrediction);
    if (els.btnSave) els.btnSave.addEventListener("click", saveFavorite);
    if (els.btnRecent5) els.btnRecent5.addEventListener("click", showRecent5);
    if (els.btnDataStatus) els.btnDataStatus.addEventListener("click", showDataStatus);
    if (els.btnFullAnalysis) els.btnFullAnalysis.addEventListener("click", showFullAnalysis);
    if (els.btnHitTrack) els.btnHitTrack.addEventListener("click", showHitTrack);
    if (els.btnHistoryRefresh) els.btnHistoryRefresh.addEventListener("click", showRecent5);
    if (els.btnRefreshFavorites) els.btnRefreshFavorites.addEventListener("click", renderFavoritesList);
    if (els.btnRefreshVisual) els.btnRefreshVisual.addEventListener("click", renderVisualAnalysis);

    if (els.btnUseLatestDrag) els.btnUseLatestDrag.addEventListener("click", fillLatestDragNumber);
    if (els.btnRunDragQuery) els.btnRunDragQuery.addEventListener("click", runDragQuery);

    if (els.btnRunBacktest) els.btnRunBacktest.addEventListener("click", runBacktest);

    if (els.btnGoPredict) els.btnGoPredict.addEventListener("click", () => switchPage("predict"));
    if (els.btnCopyAllPredict) els.btnCopyAllPredict.addEventListener("click", copyAllPredictions);
    if (els.btnPredictSummary) els.btnPredictSummary.addEventListener("click", showPredictSummary);
    if (els.btnGenerateShareCard) els.btnGenerateShareCard.addEventListener("click", generateShareCard);
    if (els.btnCloseSharePreview) els.btnCloseSharePreview.addEventListener("click", clearSharePreview);

    if (els.btnClearFavorites) {
      els.btnClearFavorites.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.favorites);
        renderFavoritesList();
        alert("收藏已清除");
      });
    }

    if (els.btnClearHistory) {
      els.btnClearHistory.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.history);
        alert("預測記錄已清除");
      });
    }

    if (els.btnReloadData) els.btnReloadData.addEventListener("click", reloadData);

    if (els.analysisPeriods) {
      els.analysisPeriods.addEventListener("change", saveUserSettings);
      els.analysisPeriods.addEventListener("input", saveUserSettings);
    }
    if (els.recommendCount) {
      els.recommendCount.addEventListener("change", saveUserSettings);
      els.recommendCount.addEventListener("input", saveUserSettings);
    }
    if (els.predictMode) {
      els.predictMode.addEventListener("change", saveUserSettings);
      els.predictMode.addEventListener("input", saveUserSettings);
    }

    window.addEventListener("pagehide", saveUserSettings);
    window.addEventListener("beforeunload", saveUserSettings);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveUserSettings();
    });
  }

  async function init() {
    try {
      bindActions();
      bindNav();
      loadUserSettings();

      const latest = await loadLatestFromCandidates();
      renderLatest(latest);
      renderRecent5List();
      renderFavoritesList();
      renderVisualAnalysis();
      fillLatestDragNumber();

      const periods = Number(els.analysisPeriods?.value || 120);
      if (els.historyCount) els.historyCount.textContent = `最近 ${periods} 期`;

      const currentMode = els.predictMode?.value || "balanced";
      const history = sampleHistory(periods, latest.numbers);
      const primary = predictNumbers(currentMode, history);
      const confidence = estimateConfidence(primary, history, currentMode);

      updateDashboard(primary, confidence, currentMode, history);
      renderPredictResults([primary], currentMode, confidence);

      if (els.appVersionText) els.appVersionText.textContent = APP_VERSION;
      if (els.dataSourceText) els.dataSourceText.textContent = latest.source || "latest.json";
      if (els.currentModeText) els.currentModeText.textContent = MODE_LABELS[currentMode] || "均衡型";

      if (els.backtestModeText) els.backtestModeText.textContent = "均衡型";
      if (els.backtestResultsList) {
        els.backtestResultsList.innerHTML = `
          <div class="analysis-item">
            <span class="label">尚未開始回測</span>
            <strong>請選擇期數與模式後按「開始回測」</strong>
          </div>
        `;
      }

      if (els.bestBacktestMode) els.bestBacktestMode.textContent = "尚未分析";
      if (els.bestBacktestSuggestion) els.bestBacktestSuggestion.textContent = "請先執行回測";
      if (els.simTotalBet) els.simTotalBet.textContent = "0元";
      if (els.simTotalReturn) els.simTotalReturn.textContent = "0元";
      if (els.simNetProfit) els.simNetProfit.textContent = "0元";
      if (els.simBetAmountText) els.simBetAmountText.textContent = "50元";

      if (els.dragQuerySummary) els.dragQuerySummary.textContent = "尚未查詢";
      if (els.dragQueryResults) {
        els.dragQueryResults.innerHTML = `<div style="font-size:15px;font-weight:700;color:#64748b;">請輸入號碼後查詢</div>`;
      }

      clearSharePreview();
      switchPage("home");
    } catch (err) {
      console.error("init error:", err);
      alert("頁面初始化失敗，請檢查 index.html 或 app.js 是否有漏貼。");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();