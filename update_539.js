const fs = require("fs");

function getMonthText(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getPreviousMonthText(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthText(d);
}

function normalizeRow(row) {
  return {
    period: String(row?.period || ""),
    lotteryDate: row?.lotteryDate || "",
    drawNumberSize: Array.isArray(row?.drawNumberSize) ? row.drawNumberSize : []
  };
}

function readExistingLatest() {
  try {
    if (!fs.existsSync("latest.json")) return null;
    const raw = fs.readFileSync("latest.json", "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("讀取既有 latest.json 失敗：", err.message);
    return null;
  }
}

async function fetch539ByMonth(month) {
  const url = `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Daily539Result?period&month=${month}&endMonth=${month}&pageNum=1&pageSize=50`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}（${month}）`);
  }

  const data = await res.json();
  const rows = data?.content?.daily539Res || [];
  return rows;
}

async function tryFetchMonths(months) {
  for (const month of months) {
    try {
      const rows = await fetch539ByMonth(month);
      if (rows.length) {
        return { month, rows };
      }
      console.log(`月份 ${month} 查無資料`);
    } catch (err) {
      console.warn(`抓取 ${month} 失敗：${err.message}`);
    }
  }
  return null;
}

async function main() {
  const now = new Date();
  const currentMonth = getMonthText(now);
  const previousMonth = getPreviousMonthText(now);
  const existing = readExistingLatest();

  console.log(`先抓當月：${currentMonth}`);
  console.log(`若無資料則抓上月：${previousMonth}`);

  const result = await tryFetchMonths([currentMonth, previousMonth]);

  if (result && result.rows.length) {
    const latest = result.rows[0];
    const recent5 = result.rows.slice(0, 5).map(normalizeRow);

    const output = {
      daily539: normalizeRow(latest),
      recent5,
      updatedAt: new Date().toISOString(),
      sourceMonth: result.month
    };

    fs.writeFileSync("latest.json", JSON.stringify(output, null, 2), "utf8");
    console.log("latest.json 已更新");
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (existing?.daily539?.period) {
    console.log("本次 API 沒抓到新資料，保留既有 latest.json");
    console.log(JSON.stringify(existing, null, 2));
    return;
  }

  throw new Error(`找不到 539 資料（當月：${currentMonth}，上月：${previousMonth}，且無既有 latest.json 可保留）`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});