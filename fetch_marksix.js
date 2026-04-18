const fs = require('fs');
async function fetchMarksixData() {
    let history = [];
    try {
        const res = await fetch("https://bet.hkjc.com/contentserver/jcbw/cmc/last30draw.json");
        let text = await res.text();
        const data = JSON.parse(text.replace(/^\uFEFF/, ''));
        data.forEach(item => {
            const issue = "20" + item.id.replace('/', '');
            const d = item.date.split('/').reverse().join('-');
            const nums = item.no.split('+').map(n => String(n).padStart(2, '0'));
            nums.push(String(item.sno).padStart(2, '0'));
            history.push({ issue, date: d, numbers: nums });
        });
        history.sort((a, b) => parseInt(b.issue) - parseInt(a.issue));
        fs.writeFileSync('marksix.json', JSON.stringify({ history: history.slice(0, 150) }, null, 2));
        console.log("✅ 六合彩官方數據同步成功");
    } catch (e) { console.log("六合彩同步失敗"); }
}
fetchMarksixData();
