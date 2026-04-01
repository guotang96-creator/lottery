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
    period: String(row.period || ""),
    lotteryDate: row.lotteryDate || "",
    drawNumberSize: Array.isArray(row.drawNumberSize) ? row.drawNumberSize : []
  };
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

async function main() {
  const now = new Date();
  const currentMonth = getMonthText(now);
  const previousMonth = getPreviousMonthText(now);

  let rows = [];
  let usedMonth = currentMonth;

  try {
    rows = await fetch539ByMonth(currentMonth);
  } catch (err) {
    console.error(`抓取當月失敗：${currentMonth}`, err);
  }

  if (!rows.length) {
    console.log(`當月 ${currentMonth} 尚無資料，改抓上月 ${previousMonth}`);
    rows = await fetch539ByMonth(previousMonth);
    usedMonth = previousMonth;
  }

  if (!rows.length) {
    throw new Error(`找不到 539 資料（當月：${currentMonth}，上月：${previousMonth}）`);
  }

  const latest = rows[0];
  const recent5 = rows.slice(0, 5).map(normalizeRow);

  const output = {
    daily539: normalizeRow(latest),
    recent5,
    updatedAt: new Date().toISOString(),
    sourceMonth: usedMonth
  };

  fs.writeFileSync("latest.json", JSON.stringify(output, null, 2), "utf8");
  console.log("latest.json 已更新");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});