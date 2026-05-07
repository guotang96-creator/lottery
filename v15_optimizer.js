const fs = require('fs');

const games = [
    { id: '539', file: 'latest.json', max: 39, pick: 5 },
    { id: 'daily', file: 'daily.json', max: 39, pick: 5 },
    { id: 'lotto', file: 'lotto.json', max: 49, pick: 6 },
    { id: 'weili', file: 'weili.json', max: 38, pick: 6 },
    { id: 'marksix', file: 'marksix.json', max: 49, pick: 6 }
];

const ITERATIONS = 3000; // 每天跑 3000 次隨機配方盲測
const TEST_WINDOW = 30;  // 測試過去 30 期的命中率

let globalWeights = {};

console.log("=========================================");
console.log("🚀 V15 蒙地卡羅多因子最佳化引擎 啟動");
console.log("=========================================\n");

games.forEach(game => {
    try {
        if (!fs.existsSync(game.file)) return;
        const data = JSON.parse(fs.readFileSync(game.file, 'utf8'));
        const history = data.history || data.recent50 || [];
        if (history.length < 50) return;

        console.log(`\n🔍 正在最佳化 [${game.id}] 權重矩陣...`);
        let bestConfig = { hitRate: -1, weights: {} };

        // 蒙地卡羅隨機搜索
        for (let i = 0; i < ITERATIONS; i++) {
            // 隨機生成 7 大因子權重 (0~100)
            let w = {
                ema: Math.random() * 100,
                mean: Math.random() * 100,
                gap: Math.random() * 100,
                cooc: Math.random() * 100,
                anom: Math.random() * 100,
                vol: Math.random() * 100,
                pat: Math.random() * 100
            };

            let totalHits = 0;
            // 滾動回測過去 30 期
            for (let testIdx = 0; testIdx < TEST_WINDOW; testIdx++) {
                const targetDraw = history[testIdx].numbers.slice(0, game.pick);
                const pastData = history.slice(testIdx + 1, testIdx + 51);
                if (pastData.length < 30) break;

                let scores = {};
                for (let n = 1; n <= game.max; n++) scores[String(n).padStart(2, '0')] = 0;

                // 基礎統計特徵
                let counts = {}, gaps = {};
                for (let n = 1; n <= game.max; n++) {
                    const sn = String(n).padStart(2, '0');
                    counts[sn] = 0;
                    gaps[sn] = pastData.findIndex(d => d.numbers.includes(sn));
                    if(gaps[sn] === -1) gaps[sn] = 50;
                }
                pastData.slice(0, 30).forEach(d => d.numbers.slice(0, game.pick).forEach(n => { if(counts[n]!==undefined) counts[n]++; }));

                const avgFreq = 30 * (game.pick / game.max);

                // 7 大因子計分核心
                for (let n = 1; n <= game.max; n++) {
                    const sn = String(n).padStart(2, '0');
                    
                    // 1. EMA (近期熱度)
                    let emaScore = 0;
                    pastData.slice(0, 5).forEach((d, idx) => { if(d.numbers.includes(sn)) emaScore += (5 - idx); });
                    scores[sn] += emaScore * (w.ema / 100);

                    // 2. Mean (冷號回補)
                    scores[sn] += (10 - counts[sn]) * (w.mean / 100);

                    // 3. Gap (末次距離)
                    scores[sn] += gaps[sn] * (w.gap / 100);

                    // 4. Anomaly (異常偏離)
                    scores[sn] += Math.abs(counts[sn] - avgFreq) * (w.anom / 100);
                    
                    // 5. Volatility (這裡簡化為出現極端冷熱的懲罰/獎勵)
                    scores[sn] += (gaps[sn] > 15 ? 1 : 0) * (w.vol / 100);
                }

                // 6. Cooc (拖牌共現)
                const lastNums = pastData[0].numbers.slice(0, game.pick);
                pastData.slice(1, 30).forEach((d, idx, arr) => {
                    let intersect = d.numbers.slice(0, game.pick).filter(n => lastNums.includes(n));
                    if (intersect.length > 0 && idx > 0) {
                        arr[idx - 1].numbers.slice(0, game.pick).forEach(n => { if (scores[n] !== undefined) scores[n] += intersect.length * (w.cooc / 100); });
                    }
                });

                // 排序並對獎
                const predicted = Object.keys(scores).sort((a, b) => scores[b] - scores[a]).slice(0, game.pick);
                totalHits += predicted.filter(n => targetDraw.includes(n)).length;
            }

            if (totalHits > bestConfig.hitRate) {
                bestConfig = { hitRate: totalHits, weights: w };
            }
        }

        // 正規化權重 (讓總和變為視覺化的百分比)
        const totalW = Object.values(bestConfig.weights).reduce((a, b) => a + b, 0);
        for (let k in bestConfig.weights) {
            bestConfig.weights[k] = Math.round((bestConfig.weights[k] / totalW) * 100);
        }

        globalWeights[game.id] = bestConfig.weights;
        console.log(`🏆 最佳配方鎖定！預期勝率評分: ${bestConfig.hitRate}`);
        console.log(`📊 權重分配:`, bestConfig.weights);

    } catch (e) {
        console.log(`❌ [${game.id}] 最佳化失敗: ${e.message}`);
    }
});

// 儲存結果供前端讀取
fs.writeFileSync('v15_weights.json', JSON.stringify(globalWeights, null, 2));
console.log("\n✅ V15 權重矩陣已生成：v15_weights.json");
