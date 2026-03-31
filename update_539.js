const fs = require("fs");

function getMonthText(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function normalizeRow(row) {
  return {
    period: String(row.period || ""),
    lotteryDate: row.lotteryDate || "",
    drawNumberSize: Array.isArray(row.drawNumberSize) ? row.drawNumberSize : []
  };
}

async function main() {
  const month = getMonthText();
  const url = `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Daily539Result?period&month=${month}&endMonth=${month}&pageNum=1&pageSize=50`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  const rows = data?.content?.daily539Res || [];

  if (!rows.length) {
    throw new Error("找不到 539 資料");
  }

  const latest = rows[0];
  const recent5 = rows.slice(0, 5).map(normalizeRow);

  const output = {
    daily539: normalizeRow(latest),
    recent5,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync("latest.json", JSON.stringify(output, null, 2), "utf8");
  console.log("latest.json 已更新");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});