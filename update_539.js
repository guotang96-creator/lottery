const fs = require("fs");

async function main() {
  const url = "https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Daily539Result?period&month=2026-03&endMonth=2026-03&pageNum=1&pageSize=50";

  const res = await fetch(url, {
    headers: {
      "accept": "application/json, text/plain, */*"
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

  const output = {
    daily539: {
      period: String(latest.period || ""),
      lotteryDate: latest.lotteryDate || "",
      drawNumberSize: latest.drawNumberSize || []
    },
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync("latest.json", JSON.stringify(output, null, 2), "utf8");
  console.log("latest.json 已更新");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});