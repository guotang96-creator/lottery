const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const OUTPUT_CANDIDATES = [
  path.join(ROOT, "latest.json"),
  path.join(ROOT, "docs", "latest.json")
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ 已寫入 ${filePath}`);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getTaiwanDateTime() {
  const now = new Date();
  const taiwan = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const y = taiwan.getUTCFullYear();
  const m = pad2(taiwan.getUTCMonth() + 1);
  const d = pad2(taiwan.getUTCDate());
  const hh = pad2(taiwan.getUTCHours());
  const mm = pad2(taiwan.getUTCMinutes());
  const ss = pad2(taiwan.getUTCSeconds());

  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function normalizeDateOnly(value) {
  if (!value) return "";
  const text = String(value).replace("T00:00:00", "").replace("T", " ");
  return text.slice(0, 10);
}

function uniqueSorted(nums) {
  return [...new Set(nums)].sort((a, b) => a - b);
}

function normalizeRow(item) {
  const period = item?.period ? String(item.period) : "";
  const date = normalizeDateOnly(item?.lotteryDate || item?.drawDate || item?.date || "");
  const numbers = Array.isArray(item?.drawNumberSize)
    ? item.drawNumberSize
        .map(Number)
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 39)
    : [];

  if (!period || numbers.length < 5) return null;

  return {
    period,
    date,
    numbers: uniqueSorted(numbers.slice(0, 5))
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

function sortRowsDesc(rows) {
  return [...rows].sort((a, b) => Number(b.period) - Number(a.period));
}

async function main() {
  const now = new Date();
  const year = now.getFullYear();

  const apiUrl =
    `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Daily539Result?period&month=${year}-01&endMonth=${year}-12&pageNum=1&pageSize=200`;

  console.log("🚀 開始抓取今彩539官方資料...");
  console.log(`📡 API: ${apiUrl}`);

  const raw = await fetchJson(apiUrl);

  if (raw?.rtCode !== 0) {
    throw new Error(`官方 API rtCode 異常: ${raw?.rtCode}`);
  }

  const list = Array.isArray(raw?.content?.daily539Res) ? raw.content.daily539Res : [];
  if (!list.length) {
    throw new Error("官方 API 沒有 daily539Res 資料");
  }

  const normalizedRows = list.map(normalizeRow).filter(Boolean);
  if (!normalizedRows.length) {
    throw new Error("資料正規化後為空");
  }

  const sorted = sortRowsDesc(normalizedRows);
  const latest = sorted[0];

  const output = {
    period: latest.period,
    date: latest.date,
    numbers: latest.numbers,
    recent5: sorted.slice(0, 5),
    recent50: sorted.slice(0, 50),
    updatedAt: getTaiwanDateTime(),
    source: "official-api"
  };

  OUTPUT_CANDIDATES.forEach((filePath) => writeJson(filePath, output));

  console.log("🎉 latest.json 產生完成");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("❌ 抓取失敗:", err);
  process.exit(1);
});
