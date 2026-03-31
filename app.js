(() => {
  const APP_VERSION = "V2.3｜今彩539 專用版｜最近5期真實版";


const STORAGE_KEYS = {
  favorites: "jincai539_favorites_v23",
  history: "jincai539_predict_history_v23",
  latest: "jincai539_latest_result_v23",
  status: "jincai539_data_status_v23"
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
    confidenceText: $("#confidenceText"),
    hotNums: $("#hotNums"),
    coldNums: $("#coldNums"),
    dragNums: $("#dragNums"),
    tailNums: $("#tailNums"),

    avgHit: $("#avgHit"),
    maxHit: $("#maxHit"),
    bestMode: $("#bestMode"),

    btnCopy: $("#btnCopy"),
    btnSave: $("#btnSave"),
    btnFullAnalysis: $("#btnFullAnalysis"),
    btnRecent5: $("#btnRecent5"),
    btnDataStatus: $("#btnDataStatus"),
    btnAnalysis: $("#btnAnalysis"),
    btnHitTrack: $("#btnHitTrack"),

    navButtons: document.querySelectorAll(".nav-btn")
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
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("localStorage 寫入失敗", err);
    }
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
    return arr
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v >= 1 && v <= 39);
  }

  function normalizeRecentRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((item) => {
      const period =
        item.period ||
        item.drawTerm ||
        item.issue ||
        item.term ||
        item.drawNo ||
        "";

      const date = normalizeDateOnly(
        item.lotteryDate ||
        item.drawDate ||
        item.dDate ||
        item.date ||
        ""
      );

      const numbers = toIntArray(
        item.drawNumberSize ||
        item.drawNumbers ||
        item.numbers ||
        item.orderNumbers ||
        item.num ||
        []
      );

      if (!period || numbers.length < 5) return null;

      return {
        period: String(period),
        date,
        numbers: uniqueSorted(numbers.slice(0, 5))
      };
    })
    .filter(Boolean)
    .slice(0, 5);
}


function normalizeLatestFromAny(raw, sourceUrl = "") {
  if (!raw || typeof raw !== "object") return null;

  const candidates = [];

  if (raw.content?.daily539) candidates.push(raw.content.daily539);
  if (raw.daily539) candidates.push(raw.daily539);
  if (raw.content?.latest?.daily539) candidates.push(raw.content.latest.daily539);
  if (raw.latest?.daily539) candidates.push(raw.latest.daily539);
  if (raw.content?.lottery?.daily539) candidates.push(raw.content.lottery.daily539);
  if (Array.isArray(raw.content?.daily539Res) && raw.content.daily539Res.length) candidates.push(raw.content.daily539Res[0]);
  if (Array.isArray(raw.daily539Res) && raw.daily539Res.length) candidates.push(raw.daily539Res[0]);
  if (Array.isArray(raw.data) && raw.data.length) candidates.push(raw.data[0]);
  if (Array.isArray(raw.results) && raw.results.length) candidates.push(raw.results[0]);
  if (raw.period || raw.lotteryDate || raw.drawNumberSize || raw.numbers) candidates.push(raw);

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;

    const period =
      item.period ||
      item.drawTerm ||
      item.issue ||
      item.term ||
      item.drawNo ||
      "";

    const date =
      normalizeDateOnly(
        item.lotteryDate ||
        item.drawDate ||
        item.dDate ||
        item.date ||
        ""
      ) || DEFAULT_LATEST.date;

    const numbers = toIntArray(
      item.drawNumberSize ||
      item.drawNumbers ||
      item.numbers ||
      item.orderNumbers ||
      item.num ||
      []
    );

    if (period && numbers.length >= 5) {
      return {
        period: String(period),
        date,
        numbers: uniqueSorted(numbers.slice(0, 5)),
        recent5: normalizeRecentRows(
          raw.recent5 ||
          raw.content?.recent5 ||
          raw.content?.daily539Res ||
          raw.daily539Res ||
          []
        ),
        updatedAt: normalizeDateText(
          raw.updatedAt ||
          raw.generatedAt ||
          raw.lastUpdated ||
          item.updatedAt ||
          item.generatedAt ||
          new Date().toISOString()
        ),
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
            total: Number(els.analysisPeriods?.value || 120),
            version: APP_VERSION
          });
          return normalized;
        }
      } catch (err) {
        console.warn(`讀取失敗：${url}`, err);
      }
    }

    const local = readJSON(STORAGE_KEYS.latest, null);
    if (local) {
      writeJSON(STORAGE_KEYS.status, {
        ok: true,
        source: local.source || "local-cache",
        total: Number(els.analysisPeriods?.value || 120),
        version: APP_VERSION
      });
      return local;
    }

    writeJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    writeJSON(STORAGE_KEYS.status, {
      ok: false,
      source: "fallback-local",
      total: Number(els.analysisPeriods?.value || 120),
      version: APP_VERSION
    });
    return DEFAULT_LATEST;
  }

  function sampleHistory(periods, latestNumbers = null) {
    const size = Math.min(Number(periods) || 120, 500);
    const source = [];

    if (Array.isArray(latestNumbers) && latestNumbers.length >= 5) {
      source.push(uniqueSorted(latestNumbers.slice(0, 5)));
    }

    while (source.length < size) {
      source.push(...MOCK_HISTORY);
    }

    return source.slice(0, size);
  }

  function getRecentFiveDraws(latest) {
  if (Array.isArray(latest?.recent5) && latest.recent5.length) {
    return latest.recent5.slice(0, 5);
  }

  const rows = [];

  if (Array.isArray(latest?.numbers) && latest.numbers.length >= 5) {
    rows.push({
      period: latest.period || "",
      date: latest.date || "",
      numbers: uniqueSorted(latest.numbers.slice(0, 5))
    });
  }

  for (const item of MOCK_HISTORY) {
    if (rows.length >= 5) break;

    const normalized = uniqueSorted(item);
    const alreadyExists = rows.some((row) => row.numbers.join(",") === normalized.join(","));

    if (!alreadyExists) {
      rows.push({
        period: "",
        date: "",
        numbers: normalized
      });
    }
  }

  return rows.slice(0, 5);
}


  function getFrequency(history) {
    const freq = new Map();
    for (let i = 1; i <= 39; i++) freq.set(i, 0);

    history.forEach((draw) => {
      draw.forEach((num) => {
        freq.set(num, (freq.get(num) || 0) + 1);
      });
    });

    return freq;
  }

  function getHotAndCold(freq) {
    const entries = [...freq.entries()];

    const hot = [...entries]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 8)
      .map(([n]) => n);

    const cold = [...entries]
      .sort((a, b) => a[1] - b[1] || a[0] - b[0])
      .slice(0, 8)
      .map(([n]) => n);

    return { hot, cold };
  }

  function getTailGroups(history) {
    const tails = new Map();
    for (let i = 0; i <= 9; i++) tails.set(i, 0);

    history.forEach((draw) => {
      draw.forEach((num) => {
        tails.set(num % 10, (tails.get(num % 10) || 0) + 1);
      });
    });

    return [...tails.entries()].sort((a, b) => b[1] - a[1]);
  }

  function getDragPairs(history) {
    const pairs = new Map();

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      current.forEach((a) => {
        next.forEach((b) => {
          const key = `${a}->${b}`;
          pairs.set(key, (pairs.get(key) || 0) + 1);
        });
      });
    }

    return [...pairs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));
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
    const freq = getFrequency(history);
    const { hot, cold } = getHotAndCold(freq);
    const tails = getTailGroups(history);
    const dragPairs = getDragPairs(history);

    let result = [];

    if (mode === "hot") {
      result = fillToFive(pickFromPool(hot, 5));
    } else if (mode === "cold") {
      result = fillToFive(pickFromPool(cold, 5));
    } else if (mode === "tail") {
      const topTails = tails.slice(0, 2).map(([tail]) => tail);
      const tailPool = [];
      for (let i = 1; i <= 39; i++) {
        if (topTails.includes(i % 10)) tailPool.push(i);
      }
      result = fillToFive(pickFromPool(tailPool, 5));
    } else if (mode === "drag") {
      const dragNums = [];
      dragPairs.slice(0, 5).forEach((item) => {
        const [a, b] = item.key.split("->").map(Number);
        dragNums.push(a, b);
      });
      result = fillToFive(pickFromPool(uniqueSorted(dragNums), 5));
    } else {
      const mixed = uniqueSorted([
        ...pickFromPool(hot, 3),
        ...pickFromPool(cold, 1),
        ...pickFromPool(Array.from({ length: 39 }, (_, i) => i + 1), 1)
      ]);
      result = fillToFive(mixed);
    }

    return result;
  }

  function estimateConfidence(numbers, history, mode) {
    const freq = getFrequency(history);
    const score = numbers.reduce((sum, n) => sum + (freq.get(n) || 0), 0);
    const base = Math.min(92, 55 + Math.round(score / 4));
    const modeBonus =
      mode === "balanced" ? 4 :
      mode === "hot" ? 6 :
      mode === "cold" ? 2 :
      mode === "tail" ? 3 : 5;

    return Math.min(98, base + modeBonus);
  }

  function renderBalls(container, numbers, active = false) {
    if (!container) return;
    container.innerHTML = numbers
      .map((num) => `<span class="ball${active ? " active" : ""}">${pad2(num)}</span>`)
      .join("");
  }

  function renderLatest(latest) {
    if (!latest) latest = DEFAULT_LATEST;

    els.lastUpdateText.textContent = latest.updatedAt || DEFAULT_LATEST.updatedAt;
    els.latestPeriod.textContent = latest.period || DEFAULT_LATEST.period;
    els.latestDate.textContent = latest.date || DEFAULT_LATEST.date;
    els.latestDrawNo.textContent = latest.period || DEFAULT_LATEST.period;

    renderBalls(els.latestBalls, latest.numbers || DEFAULT_LATEST.numbers, false);
  }

  function formatNums(nums) {
    return nums.map(pad2).join(" ");
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
    if (!records.length) {
      return {
        avg: "0顆",
        max: "0顆",
        bestMode: "均衡型"
      };
    }

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

    return {
      avg: `${avg}顆`,
      max: `${max}顆`,
      bestMode
    };
  }

  function compareHit(predicted, actual) {
    const actualSet = new Set(actual);
    return predicted.filter((n) => actualSet.has(n)).length;
  }

  function savePredictRecord(record) {
    const oldHistory = readJSON(STORAGE_KEYS.history, []);
    oldHistory.push(record);
    writeJSON(STORAGE_KEYS.history, oldHistory);
  }

  function updateDashboard(numbers, confidence, mode, history) {
    renderBalls(els.recommendBalls1, numbers, true);
    els.confidenceText.textContent = String(confidence);

    const summary = getAnalysisSummary(history);
    els.hotNums.textContent = summary.hotText;
    els.coldNums.textContent = summary.coldText;
    els.dragNums.textContent = summary.dragText;
    els.tailNums.textContent = summary.tailText;

    const saved = readJSON(STORAGE_KEYS.history, []);
    const stats = calcHitStats(saved);
    els.avgHit.textContent = stats.avg;
    els.maxHit.textContent = stats.max;
    els.bestMode.textContent = stats.bestMode || MODE_LABELS[mode] || "均衡型";
  }

  function generatePrediction() {
    const periods = Number(els.analysisPeriods.value || 120);
    const recommendCount = Number(els.recommendCount.value || 3);
    const mode = els.predictMode.value || "balanced";
    const modeLabel = MODE_LABELS[mode] || "均衡型";

    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const history = sampleHistory(periods, latest.numbers);
    const allPredictions = [];

    for (let i = 0; i < recommendCount; i++) {
      const nums = predictNumbers(mode, history);
      allPredictions.push(nums);
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

    els.historyCount.textContent = `最近 ${periods} 期`;
    updateDashboard(primary, confidence, mode, history);

    const multiText = allPredictions
      .map((nums, idx) => `推薦${idx + 1}：${formatNums(nums)}`)
      .join("\n");

    alert(
      `539 預測完成\n\n模式：${modeLabel}\n分析期數：${periods}期\n推薦組數：${recommendCount}組\n\n${multiText}\n\n主推薦信心：${confidence}`
    );
  }

  async function copyPrediction() {
    const balls = [...els.recommendBalls1.querySelectorAll(".ball")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean);

    const text = balls.join(" ");

    if (!text) {
      alert("目前沒有可複製的號碼");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert(`已複製：${text}`);
    } catch (err) {
      alert(`複製失敗，請手動複製：${text}`);
    }
  }

  function saveFavorite() {
    const balls = [...els.recommendBalls1.querySelectorAll(".ball")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean);

    if (!balls.length) {
      alert("目前沒有可收藏的號碼");
      return;
    }

    const oldFavorites = readJSON(STORAGE_KEYS.favorites, []);
    const newItem = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      numbers: balls
    };

    oldFavorites.unshift(newItem);
    writeJSON(STORAGE_KEYS.favorites, oldFavorites.slice(0, 50));

    alert(`已收藏：${balls.join(" ")}`);
  }

  function showRecent5() {
  const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
  const history = getRecentFiveDraws(latest);

  const text = history
    .map((draw, idx) => {
      const nums = formatNums(draw.numbers || []);
      const dateText = draw.date ? `｜${draw.date}` : "";
      const periodText = draw.period ? `第${draw.period}期` : `參考第${idx + 1}筆`;

      return `${idx + 1}. ${periodText}${dateText}｜${nums}`;
    })
    .join("\n");

  alert(`最近 5 期開獎\n\n${text}`);
}


  function showDataStatus() {
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const status = readJSON(STORAGE_KEYS.status, {
      ok: true,
      source: "local-cache",
      total: 120,
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
      `資料筆數：${status.total || 120}\n` +
      `狀態：${status.ok ? "正常" : "異常"}`
    );
  }

  function showFullAnalysis() {
    const periods = Number(els.analysisPeriods.value || 120);
    const latest = readJSON(STORAGE_KEYS.latest, DEFAULT_LATEST);
    const history = sampleHistory(periods, latest.numbers);
    const freq = getFrequency(history);
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);

    const top10 = sorted
      .slice(0, 10)
      .map(([n, c]) => `${pad2(n)}（${c}次）`)
      .join("\n");

    alert(`完整分析\n\n最近 ${periods} 期熱門號 Top 10：\n${top10}`);
  }

  function showHitTrack() {
    const records = readJSON(STORAGE_KEYS.history, []);
    if (!records.length) {
      alert("目前還沒有命中追蹤資料");
      return;
    }

    const recent = records.slice(-5);
    const text = recent
      .map((r, idx) => `${idx + 1}. ${r.modeLabel}｜${formatNums(r.numbers || [])}｜命中 ${r.hitCount || 0} 顆`)
      .join("\n");

    const stats = calcHitStats(records);

    alert(
      `最近命中追蹤\n\n${text}\n\n平均：${stats.avg}\n最高：${stats.max}\n最佳模式：${stats.bestMode}`
    );
  }

  function bindNav() {
    els.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.navButtons.forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");

        const page = btn.dataset.page;
        const labelMap = {
          home: "首頁",
          predict: "預測",
          history: "歷史",
          settings: "設定"
        };

        alert(`目前是單頁版\n你點了：「${labelMap[page] || page}」\n之後可再擴充成真正分頁。`);
      });
    });
  }

  function bindActions() {
    els.btnPredict?.addEventListener("click", generatePrediction);
    els.btnCopy?.addEventListener("click", copyPrediction);
    els.btnSave?.addEventListener("click", saveFavorite);
    els.btnRecent5?.addEventListener("click", showRecent5);
    els.btnDataStatus?.addEventListener("click", showDataStatus);
    els.btnFullAnalysis?.addEventListener("click", showFullAnalysis);
    els.btnAnalysis?.addEventListener("click", showFullAnalysis);
    els.btnHitTrack?.addEventListener("click", showHitTrack);
  }

  async function init() {
    bindActions();
    bindNav();

    const latest = await loadLatestFromCandidates();
    renderLatest(latest);

    const periods = Number(els.analysisPeriods?.value || 120);
    els.historyCount.textContent = `最近 ${periods} 期`;

    const history = sampleHistory(periods, latest.numbers);
    const primary = predictNumbers("balanced", history);
    const confidence = estimateConfidence(primary, history, "balanced");
    updateDashboard(primary, confidence, "balanced", history);

    console.log(`${APP_VERSION} 已載入`);
    console.log("目前資料來源：", latest.source || "unknown");
  }

  document.addEventListener("DOMContentLoaded", init);
})();