const fs = require('fs');

console.log("=========================================");
console.log("🚀 V14 雲端量子運算中心：網格搜索啟動");
console.log("=========================================\n");

let historyData = [];
try {
    const rawData = fs.readFileSync('latest.json', 'utf8');
    historyData = JSON.parse(rawData).history;
    console.log(`✅ 成功載入 ${historyData.length} 期 539 數據！\n`);
} catch (e) {
    console.log("❌ 找不到 latest.json，請先執行爬蟲抓取資料。");
    process.exit(1);
}

const TEST_SAMPLE_SIZE = 500; 
const WEIGHT_STEP = 20;       
let bestCombination = { hitRate: 0, wMean: 0, wEma: 0, wMarkov: 0, totalHits: 0 };

console.log(`📊 正在進行近 ${TEST_SAMPLE_SIZE} 期的模擬盲狙測試...`);
console.log(`⏳ 窮舉運算中，請稍候...\n`);

let totalCombinations = 0;
for (let wMean = 0; wMean <= 100; wMean += WEIGHT_STEP) {
    for (let wEma = 0; wEma <= 100; wEma += WEIGHT_STEP) {
        for (let wMarkov = 0; wMarkov <= 100; wMarkov += WEIGHT_STEP) {
            if (wMean === 0 && wEma === 0 && wMarkov === 0) continue;
            totalCombinations++;
            let totalHits = 0;

            for (let i = 0; i < TEST_SAMPLE_SIZE; i++) {
                const currentDraw = historyData[i].numbers; 
                const pastData = historyData.slice(i + 1, i + 1 + 100); 
                if (pastData.length < 50) break; 

                let scores = {};
                for (let n = 1; n <= 39; n++) scores[String(n).padStart(2, '0')] = 0;

                // A. 均值回歸
                const last30 = pastData.slice(0, 30);
                let counts = {};
                last30.forEach(d => d.numbers.forEach(num => counts[num] = (counts[num] || 0) + 1));
                for (let n = 1; n <= 39; n++) {
                    const numStr = String(n).padStart(2, '0');
                    scores[numStr] += ((10 - (counts[numStr] || 0)) * (wMean / 100)); 
                }

                // B. EMA 動能
                const last10 = pastData.slice(0, 10);
                last10.forEach((d, idx) => {
                    const timeWeight = 10 - idx; 
                    d.numbers.forEach(num => scores[num] += (timeWeight * (wEma / 100)));
                });

                // C. 馬可夫鏈
                const lastDrawNums = pastData[0].numbers;
                pastData.forEach((d, idx) => {
                    if (idx === pastData.length - 1) return;
                    let intersect = d.numbers.filter(n => lastDrawNums.includes(n));
                    if (intersect.length > 0) {
                        pastData[idx - 1].numbers.forEach(num => scores[num] += (intersect.length * 2 * (wMarkov / 100)));
                    }
                });

                const predicted = Object.keys(scores).sort((a, b) => scores[b] - scores[a]).slice(0, 5);
                totalHits += predicted.filter(n => currentDraw.includes(n)).length;
            }

            const hitRate = (totalHits / (TEST_SAMPLE_SIZE * 5)) * 100;
            if (hitRate > bestCombination.hitRate) {
                bestCombination = { hitRate, wMean, wEma, wMarkov, totalHits };
            }
        }
    }
}

console.log(`\n🎉 網格搜索完成！共運算了 ${totalCombinations} 種平行時空。`);
console.log(`\n🏆 【歷史最強黃金比例】誕生：`);
console.log(`👉 均值回歸 (抓冷門)：${bestCombination.wMean}`);
console.log(`👉 EMA 動能 (抓熱門)：${bestCombination.wEma}`);
console.log(`👉 馬可夫鏈 (抓拖牌)：${bestCombination.wMarkov}`);
console.log(`-----------------------------------------`);
console.log(`🎯 近 ${TEST_SAMPLE_SIZE} 期盲狙總命中：${bestCombination.totalHits} 顆球`);
console.log(`📈 基礎命中率：${bestCombination.hitRate.toFixed(2)}%`);
console.log(`=========================================\n`);
