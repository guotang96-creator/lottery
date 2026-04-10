/**
 * 彩券 AI 分析中心 V5.3 - 雙核心引擎 & 6碼包牌版 (完整防呆版)
 */
const API_BASE = "https://lottery-k099.onrender.com";
let currentType = "539"; 
let globalHistoryData = []; 

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initTypeSelector();
    loadLatestData();
    initTools(); 
    
    document.getElementById("btn-run-ai").addEventListener("click", runGeminiAI);
    document.getElementById("btn-reload").addEventListener("click", loadLatestData);
    document.getElementById("btn-clear-fav").addEventListener("click", clearFavorites);
    
    const btnBt = document.getElementById("btn-run-bt");
    if(btnBt) btnBt.addEventListener("click", runBacktest);
    
    renderFavorites();
});

function pad2(num) { return String(num).padStart(2, "0"); }
function cleanDateStr(d) { return d ? d.split('T')[0].split(' ')[0] : ""; }

function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

function initTypeSelector() {
    const btn539 = document.getElementById("tab-539");
    const btnDaily = document.getElementById("tab-daily");
    const descText = document.getElementById("ai-desc");
    const placeholderText = document.getElementById("ai-placeholder-text");

    const updateUIState = (type) => {
        currentType = type;
        const label = type === "539" ? "今彩 539" : "加州天天樂";
        
        if(type === "539") {
            btn539.style.background = "rgba(59,130,246,0.2)"; btn539.style.borderColor = "#3b82f6"; btn539.style.color = "white";
            btnDaily.style.background = "rgba(255,255,255,0.05)"; btnDaily.style.borderColor = "rgba(255,255,255,0.1)"; btnDaily.style.color = "#94a3b8";
        } else {
            btnDaily.style.background = "rgba(59,130,246,0.2)"; btnDaily.style.borderColor = "#3b82f6"; btnDaily.style.color = "white";
            btn539.style.background = "rgba(255,255,255,0.05)"; btn539.style.borderColor = "rgba(255,255,255,0.1)"; btn539.style.color = "#94a3b8";
        }

        if(descText) descText.textContent = `目前針對 [${label}] 執行深度學習趨勢分析。`;
        if(placeholderText) placeholderText.textContent = `${label} 分析引擎就緒，準備產生推薦號碼`;
        
        const homeLabel = document.getElementById("home-type-label");
        if(homeLabel) homeLabel.textContent = label;
        
        const btLabel = document.getElementById("bt-type-label");
        if(btLabel) btLabel.textContent = label;
        
        loadLatestData();
    };

    if(btn539) btn539.addEventListener("click", () => updateUIState("539"));
    if(btnDaily) btnDaily.addEventListener("click", () => updateUIState("daily"));
}

async function loadLatestData() {
    const ballsContainer = document.getElementById("latest-balls");
    if(ballsContainer) ballsContainer.innerHTML = `<div style="font-size: 12px; color: #475569;"><i class="fas fa-sync fa-spin"></i> 同步 ${currentType} 資料中...</div>`;

    try {
        const fileName = currentType === "539" ? "latest.json" : "daily.json";
        const res = await fetch(`./${fileName}?t=${Date.now()}`);
        if (!res.ok) throw new Error("尚未生成資料庫");
        
        const data = await res.json();
        let latest = data.daily_latest || data.daily539 || (Array.isArray(data) ? data[0] : data);
        
        document.getElementById("draw-period").textContent = latest.period || "---";
        document.getElementById("draw-date").textContent = cleanDateStr(latest.lotteryDate || latest.date);
        
        if (data.updatedAt) {
            const d = new Date(data.updatedAt);
            document.getElementById("update-time").textContent = `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }

        let nums = latest.drawNumberSize || latest.numbers || [];
        if(ballsContainer) ballsContainer.innerHTML = nums.map(n => `<div class="ball">${pad2(n)}</div>`).join("");

        globalHistoryData = data.history || data.recent50 || data.data || (Array.isArray(data) ? data : []);
        renderHistory();

    } catch (err) {
        if(ballsContainer) ballsContainer.innerHTML = `<div style="color:#64748b; font-size:12px;">${currentType} 數據載入中</div>`;
        globalHistoryData = [];
        renderHistory();
    }
}

async function runGeminiAI() {
    const btn = document.getElementById("btn-run-ai");
    const outputArea = document.getElementById("ai-output-area");
    if(!btn || !outputArea) return;
    
    btn.disabled = true;
    const apiPath = currentType === "539" ? "/api/predict" : "/api/predict_daily";
    const label = currentType === "539" ? "539" : "天天樂";

    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在分析 ${label} 500期大數據...`;
    outputArea.innerHTML = `<div style="text-align:center; padding:25px; color:#60a5fa;"><i class="fas fa-microchip fa-spin"></i> 正在回溯神經網路模型...</div>`;

    try {
        const res = await fetch(`${API_BASE}${apiPath}`);
        const data = await res.json();
        if (data.status === "success") {
            
            // 🔥 5碼主力 + 1碼防漏 的精美排版
            const mainBalls = data.predicted_numbers.slice(0, 5).map(n => `<div class="ball ai-ball">${pad2(n)}</div>`).join("");
            const extraBalls = data.predicted_numbers.slice(5, 6).map(n => `<div class="ball" style="background: linear-gradient(145deg, #10b981, #059669); text-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid #34d399; color: white;">${pad2(n)}</div>`).join("");
            
            const detailsHtml = data.details.map((d, i) => `
                <div class="ai-row" style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;">
                    <span style="color:${i < 5 ? '#e2e8f0' : '#10b981'}">${i+1}. 號碼 <b>${pad2(d.num)}</b></span>
                    <span class="ai-score" style="color:#94a3b8">權重: ${d.score.toFixed(2)}</span>
                </div>`).join("");
            
            outputArea.innerHTML = `
                <div style="padding: 15px; background: rgba(0,0,0,0.2); border-radius: 16px;">
                    <div style="margin-bottom:12px; font-weight:bold; color:#e2e8f0; font-size:14px;">[${label}] 6 碼精選包牌池：</div>
                    
                    <div style="font-size: 11px; color: #60a5fa; margin-bottom: 5px; text-align: left;">🔥 主力推薦 (5碼)</div>
                    <div class="balls-display" style="margin-top: 0; margin-bottom: 15px;">${mainBalls}</div>
                    
                    <div style="font-size: 11px; color: #10b981; margin-bottom: 5px; text-align: left;">🛡️ 防漏保險 (1碼)</div>
                    <div class="balls-display" style="margin-top: 0; margin-bottom: 15px;">${extraBalls}</div>
                    
                    <div class="ai-details" style="margin-top:15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">
                        ${detailsHtml}
                    </div>
                    <button class="action-btn secondary-btn" style="margin-top:15px;" onclick="saveFavorite('${data.predicted_numbers.join(',')}', '${label}')">
                        <i class="fas fa-save"></i> 儲存分析結果
                    </button>
                </div>`;
            btn.innerHTML = `<i class="fas fa-check-circle"></i> 分析完成`;
        } else throw new Error();
    } catch (err) {
        outputArea.innerHTML = `<div style="color:#fca5a5; padding:15px; text-align:center; font-size:13px;">⚠️ 伺服器暖機中或數據過大，請再次點擊。</div>`;
        btn.innerHTML = `<i class="fas fa-redo"></i> 再次啟動智能分析`;
    } finally { btn.disabled = false; }
}

function renderHistory() {
    const container = document.getElementById("history-list");
    if(!container) return;
    if (!globalHistoryData || globalHistoryData.length === 0) {
        return container.innerHTML = "<p class='desc-text'>暫無資料</p>";
    }
    
    container.innerHTML = globalHistoryData.map(item => {
        let nums = item.drawNumberSize || item.numbers || [];
        let date = cleanDateStr(item.lotteryDate || item.date);
        return `<div class="list-item" style="flex-direction: column; align-items: flex-start; gap: 12px;">
            <div style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                <span><i class="far fa-calendar-alt"></i> ${date}</span>
                <span>第 ${item.period || '---'} 期</span>
            </div>
            <div class="balls-display" style="margin: 0; gap: 8px;">
                ${nums.map(n=>`<div class="ball" style="width:32px;height:32px;font-size:13px;">${pad2(n)}</div>`).join("")}
            </div>
        </div>`;
    }).join("");
}

function saveFavorite(numsStr, label) {
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    const d = new Date();
    favs.unshift({ 
        date: `${d.getMonth()+1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`, 
        label: label, 
        numbers: numsStr.split(',').map(Number) 
    });
    localStorage.setItem('v5_favorites', JSON.stringify(favs));
    showToast(`已收藏 ${label} 分析結果`);
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    if(!container) return;
    const favs = JSON.parse(localStorage.getItem('v5_favorites') || '[]');
    if (!favs.length) return container.innerHTML = "<p class='desc-text'>尚無收藏。</p>";
    container.innerHTML = favs.map(item => `
        <div class="list-item" style="flex-direction: column; align-items: flex-start; gap: 12px;">
            <div style="width: 100%; font-size: 13px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                <i class="fas fa-tag"></i> [${item.label}] ${item.date}
            </div>
            <div class="balls-display" style="margin: 0; gap: 8px;">
                ${item.numbers.map(n=>`<div class="ball ai-ball" style="width:32px;height:32px;font-size:13px;">${pad2(n)}</div>`).join("")}
            </div>
        </div>`).join("");
}

function clearFavorites() {
    if (confirm("確定清空所有紀錄？")) { localStorage.removeItem('v5_favorites'); renderFavorites(); showToast("已清空", true); }
}

function initTabs() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
            document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
            
            const targetId = item.getAttribute("data-target");
            const targetEl = document.getElementById(targetId);
            if(targetEl) targetEl.classList.remove("hidden");
            
            item.classList.add("active");
            window.scrollTo(0,0);
        });
    });
}

async function runBacktest() {
    const btn = document.getElementById("btn-run-bt");
    const listArea = document.getElementById("bt-list");
    const statsArea = document.getElementById("bt-stats-panel");
    
    if (!globalHistoryData || globalHistoryData.length < 6) {
        showToast(`歷史數據不足 (目前 ${globalHistoryData ? globalHistoryData.length : 0} 筆)，無法執行回測`, true);
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 回測運算中...';
    listArea.innerHTML = "";
    statsArea.innerHTML = "";

    await new Promise(r => setTimeout(r, 800)); 

    let hitsTotal = 0;
    let html = "";
    const testCount = Math.min(5, globalHistoryData.length - 2); 

    for (let i = 0; i < testCount; i++) {
        if(!globalHistoryData[i] || !globalHistoryData[i+1]) continue;
        const targetDraw = globalHistoryData[i];
        const trainData = globalHistoryData.slice(i + 1, i + 21); 
        
        const freqs = {};
        trainData.forEach(d => {
            let nums = d.drawNumberSize || d.numbers || [];
            nums.forEach(n => freqs[n] = (freqs[n] || 0) + 1);
        });
        
        const predicted = Object.entries(freqs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(x => parseInt(x[0]));
        
        const actual = targetDraw.drawNumberSize || targetDraw.numbers || [];
        const hits = predicted.filter(n => actual.includes(n));
        hitsTotal += hits.length;

        let dateStr = cleanDateStr(targetDraw.lotteryDate || targetDraw.date);
        
        html += `
        <div class="list-item" style="flex-direction: column; align-items: flex-start; gap: 10px;">
            <div style="font-size: 12px; color: #94a3b8;">第 ${targetDraw.period || '---'} 期 (${dateStr})</div>
            <div style="display: flex; gap: 15px; width: 100%;">
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: #3b82f6; margin-bottom: 5px;"><i class="fas fa-robot"></i> 趨勢預測</div>
                    <div class="balls-display" style="gap: 4px; margin: 0;">${predicted.map(n => `<div class="ball ai-ball" style="width:26px;height:26px;font-size:11px;">${pad2(n)}</div>`).join("")}</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: #e2e8f0; margin-bottom: 5px;"><i class="fas fa-trophy"></i> 實際開出</div>
                    <div class="balls-display" style="gap: 4px; margin: 0;">${actual.map(n => `<div class="ball ${hits.includes(n) ? 'ai-ball' : ''}" style="width:26px;height:26px;font-size:11px;${hits.includes(n) ? 'box-shadow: 0 0 8px #3b82f6;' : ''}">${pad2(n)}</div>`).join("")}</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #10b981; align-self: flex-end; font-weight: bold;">命中 ${hits.length} 碼</div>
        </div>`;
    }

    statsArea.innerHTML = `
        <div style="padding: 15px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; text-align: center;">
            <div style="font-size: 14px; color: #e2e8f0;">近 ${testCount} 期總命中</div>
            <div style="font-size: 28px; font-weight: bold; color: #3b82f6; margin: 5px 0;">${hitsTotal} 顆</div>
        </div>
    `;
    listArea.innerHTML = html;

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-redo"></i> 重新執行回測';
}

function initTools() {
    const select = document.getElementById("tool-target-num");
    if(!select) return;
    
    select.innerHTML = Array.from({length: 39}, (_, i) => `<option value="${i + 1}">${pad2(i + 1)}</option>`).join("");

    document.getElementById("btn-run-tool").addEventListener("click", () => {
        const target = parseInt(select.value);
        const resArea = document.getElementById("tool-result-area");
        
        if (!globalHistoryData || globalHistoryData.length < 5) {
            resArea.innerHTML = `<div style="color:#fca5a5; font-size:13px; text-align:center;">⚠️ 歷史數據不足，無法分析版路。</div>`;
            return;
        }

        resArea.innerHTML = `<div style="text-align:center; color:#3b82f6; font-size:14px;"><i class="fas fa-spinner fa-spin"></i> 正在比對歷史版路...</div>`;

        setTimeout(() => {
            const nextNums = {};
            let matchCount = 0;

            for (let i = 1; i < globalHistoryData.length; i++) {
                const currentDraw = globalHistoryData[i].drawNumberSize || globalHistoryData[i].numbers || [];
                
                if (currentDraw.includes(target)) {
                    matchCount++;
                    const nextDraw = globalHistoryData[i - 1].drawNumberSize || globalHistoryData[i - 1].numbers || [];
                    nextDraw.forEach(n => {
                        nextNums[n] = (nextNums[n] || 0) + 1;
                    });
                }
            }

            const sorted = Object.entries(nextNums).sort((a, b) => b[1] - a[1]).slice(0, 5); 

            if (sorted.length === 0) {
                resArea.innerHTML = `<div style="color:#94a3b8; font-size:13px; text-align:center;">目前數據庫中尚未有足夠的跟牌紀錄。</div>`;
                return;
            }

            let html = `
                <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px;">
                    <div style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">在目前的數據庫中，號碼 <b style="color:#fff;">${pad2(target)}</b> 共出現過 ${matchCount} 次。其下一期最常開出的號碼為：</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
            `;
            
            sorted.forEach((item, index) => {
                const isTop = index === 0;
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: ${isTop ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)'}; padding: 10px 15px; border-radius: 8px; border: 1px solid ${isTop ? 'rgba(16, 185, 129, 0.3)' : 'transparent'};">
                        <div class="ball ${isTop ? 'ai-ball' : ''}" style="width:30px; height:30px; font-size:12px;">${pad2(item[0])}</div>
                        <div style="font-size: 13px; color: ${isTop ? '#10b981' : '#e2e8f0'}; font-weight: bold;">跟出 ${item[1]} 次</div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
            resArea.innerHTML = html;
        }, 500); 
    });
}
