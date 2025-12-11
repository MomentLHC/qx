/*
 * Crypto Signal Dashboard - CSR Version (CF Bypass Ready)
 * Updates:
 * 1. 时间格式化：GMT -> YYYY-MM-DD HH:mm:ss
 * 2. 交互增强：点击数据区域看识别结果，新增AI分析按钮，查看原文看原始内容
 */

const API_URL = "https://kol.zhixing.icu/api/user/proxy/frontend-messages?type=signal&limit=50";

(async () => {
    // Surge 脚本只负责返回 HTML 骨架
    const html = renderPageSkeleton();

    $done({
        response: {
            status: 200,
            headers: { 
                "Content-Type": "text/html;charset=UTF-8",
                "Cache-Control": "no-store"
            },
            body: html
        }
    });
})();

// --- 生成 HTML 骨架 ---
function renderPageSkeleton() {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <title>交易信号</title>
        <style>
            :root {
                --bg: #f5f7fa; 
                --card-bg: #ffffff;
                --text-main: #1a1a1a;
                --text-sub: #8c8c8c;
                --green: #3fb950;
                --red: #f85149;
                --blue: #1f6feb;
                --purple: #7048e8; /* 新增 AI 按钮颜色 */
                --nav-bg: #ffffff; 
                --nav-text: #1a1a1a;
                --safe-top: env(safe-area-inset-top);
                --safe-bottom: env(safe-area-inset-bottom);
            }
            
            body { 
                background: var(--bg); 
                color: var(--text-main); 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                margin: 0; padding: 0; 
                padding-bottom: calc(20px + var(--safe-bottom));
                overscroll-behavior-y: none;
                -webkit-user-select: none; user-select: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* 顶部标题栏 */
            .app-header { 
                background: var(--nav-bg); color: var(--nav-text);
                padding: calc(15px + var(--safe-top)) 20px 15px 20px; 
                position: sticky; top: 0; z-index: 100; 
                border-bottom: 1px solid rgba(0,0,0,0.05);
            }
            .app-title { font-size: 22px; font-weight: 800; margin: 0; color: #000; letter-spacing: -0.5px;}
            
            /* 状态提示区域 */
            #status-bar { padding: 20px; text-align: center; }
            
            /* 错误提示条 */
            .error-banner {
                margin: 15px 20px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 12px;
                padding: 12px 15px; display: flex; align-items: center; gap: 12px; text-align: left;
            }
            .error-icon { font-size: 20px; }
            .error-content { flex: 1; }
            .error-title { font-weight: bold; color: #cf1322; font-size: 14px; }
            .error-desc { color: #cf1322; font-size: 12px; margin-top: 2px; word-break: break-all; }
            .retry-btn {
                background: #fff; border: 1px solid #ffccc7; color: #cf1322;
                padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;
            }

            /* 加载动画 */
            .loader {
                border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid var(--blue);
                width: 24px; height: 24px; margin: 0 auto 10px auto;
                animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            
            /* Card 样式 */
            .card { 
                background: var(--card-bg); border-radius: 16px; padding: 20px; margin: 15px 20px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02);
            }
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            
            .user-info { display: flex; align-items: center; gap: 0; }
            .author { font-weight: 700; font-size: 16px; color: #333; }
            .channel-name { font-size: 12px; color: #999; margin-top: 4px; }
            
            .direction-badge { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
            .direction-badge.long { background-color: #e6f4ea; color: var(--green); }
            .direction-badge.short { background-color: #fdeaea; color: var(--red); }
            .direction-badge.spot { background-color: #fff3e0; color: orange; }
            
            .symbol-title { font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #000; letter-spacing: -0.5px; }
            
            /* 数据区域 - 可点击效果 */
            .signal-data { 
                background: #f9fafb; padding: 15px; border-radius: 12px; 
                cursor: pointer; /* 提示可点击 */
                transition: background-color 0.2s;
            }
            .signal-data:active { background: #eef0f5; } /* 点击反馈 */

            .data-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .data-row:last-child { margin-bottom: 0; }
            .data-item { flex: 1; }
            .data-item .label { font-size: 12px; color: #aaa; margin-bottom: 6px; font-weight: 500; }
            .data-item .value { font-size: 17px; font-weight: 700; font-family: 'Monaco', monospace; color: #333; }
            .value.win { color: var(--green); }
            .value.loss { color: var(--red); }
            
            .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 12px; color: #bbb; font-weight: 500;}
            .footer-buttons { display: flex; gap: 8px; }
            
            .details-btn { 
                background: #f0f2f5; color: #666; padding: 8px 12px; 
                border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;
                transition: opacity 0.2s;
            }
            .details-btn:active { opacity: 0.8; }
            
            /* AI 按钮特殊样式 */
            .ai-btn {
                background: #f3f0ff; color: var(--purple);
            }
        </style>
    </head>
    <body>
        <div class="app-header">
            <div class="app-title">交易信号</div>
        </div>

        <div id="status-bar">
            <div class="loader"></div>
            <div style="color:#999; font-size:13px;">正在连接信号源...</div>
        </div>

        <div id="content-area"></div>

        <script>
            const API_URL = "${API_URL}";

            document.addEventListener('DOMContentLoaded', () => {
                fetchData();
            });

            async function fetchData() {
                const statusEl = document.getElementById('status-bar');
                const contentEl = document.getElementById('content-area');
                
                statusEl.innerHTML = '<div class="loader"></div><div style="color:#999; font-size:13px;">正在获取数据...</div>';
                statusEl.style.display = 'block';

                try {
                    const response = await fetch(API_URL);
                    if (!response.ok) throw new Error("HTTP Status: " + response.status);
                    
                    const data = await response.json();
                    const messages = data.messages || [];

                    if (messages.length === 0) {
                        statusEl.innerHTML = '<div style="color:#999; padding:20px;">暂无信号数据</div>';
                    } else {
                        statusEl.style.display = 'none';
                        const parsed = messages.map(msg => parseSignalLogic(msg.signal, msg.message_content, msg));
                        contentEl.innerHTML = renderCards(parsed);
                    }

                } catch (err) {
                    console.error(err);
                    statusEl.innerHTML = \`
                        <div class="error-banner">
                            <div class="error-icon">⚠️</div>
                            <div class="error-content">
                                <div class="error-title">请求失败</div>
                                <div class="error-desc">\${err.message || err}</div>
                            </div>
                            <button class="retry-btn" onclick="fetchData()">重试</button>
                        </div>
                    \`;
                }
            }

            // --- 时间格式化辅助函数 ---
            function formatDate(isoString) {
                if (!isoString) return '';
                const date = new Date(isoString);
                if (isNaN(date.getTime())) return isoString; // 如果解析失败返回原字符串

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                return \`\${year}-\${month}-\${day} \${hours}:\${minutes}:\${seconds}\`;
            }

            // --- 文本安全转义 (防止 Alert 报错) ---
            function escapeText(text) {
                if (!text) return '';
                // 转义反斜杠、单引号、换行符
                return text.replace(/\\\\/g, '\\\\\\\\')
                           .replace(/'/g, "\\\\'")
                           .replace(/\\n/g, '\\\\n')
                           .replace(/\\r/g, '');
            }

            function parseSignalLogic(S, f, originalMsg) {
                let T = {
                    direction: "unknown",
                    symbol: "UNKNOWN",
                    entryPrice: "-",
                    stopLoss: "-",
                    takeProfit: "-",
                    leverage: "-",
                    position: "-",
                    type: "合约",
                    author: originalMsg.author_nickname || "未知分析师",
                    // 修改1：使用 formatDate 格式化 created_at
                    time: formatDate(originalMsg.created_at), 
                    rawSignal: S || "",
                    message_content: originalMsg.message_content || "",
                    analysis: originalMsg.analysis || "暂无分析内容",
                    channel: originalMsg.channel_name || "未知频道"
                };

                if (!S) S = "";
                if (!f) f = "";

                if (/方向[：:]\\s*(多单|做多|Long)/i.test(S)) T.direction = "long";
                else if (/方向[：:]\\s*(空单|做空|Short)/i.test(S)) T.direction = "short";
                else if (/方向[：:]\\s*(现货)/i.test(S)) T.direction = "spot";
                else if (/方向[：:]\\s*(平仓)/i.test(S)) T.direction = "close";
                else if (f.includes("做多") || f.includes("多单") || f.includes("Long")) T.direction = "long";
                else if (f.includes("做空") || f.includes("空单") || f.includes("Short")) T.direction = "short";
                else if (f.includes("现货")) T.direction = "spot";

                const D = S.match(/币种[：:]\\s*([A-Z0-9]{2,10})/i) || S.match(/([A-Z0-9]{2,10})(\\/USDT|USDT)?/i);
                if (D) T.symbol = D[1].toUpperCase();

                const W = S.match(/入场[价位]*[:：]?\\s*([\\d.,\\-~附近市价]+)/i) || S.match(/价格[:：]?\\s*([\\d.,\\-~]+)/i);
                if (W) T.entryPrice = W[1];

                const loss = S.match(/止损[:：]?\\s*([\\d.,]+)/i);
                if (loss) T.stopLoss = loss[1];

                const u = S.match(/止盈[:：]?\\s*([\\d.,\\-~]+)/i) || S.match(/目标[:：]?\\s*([\\d.,\\-~<>]+)/i);
                if (u) T.takeProfit = u[1];

                const m = S.match(/杠杆[:：]?\\s*([\\d]+)\\s*倍?/i) || S.match(/([\\d]+)\\s*倍/i);
                if (m) T.leverage = m[1] + "x";

                const Y = S.match(/仓位[:：]?\\s*([\\d]+)%/i);
                if (Y) T.position = Y[1] + "%";

                if (f.includes("现货") || T.direction === "spot") T.type = "现货";
                else if ((T.leverage && T.leverage !== "-") || f.includes("合约")) T.type = "合约";

                return T;
            }

            function renderCards(signals) {
                return signals.map(s => {
                    let dirLabel = "观望";
                    let dirClass = "";
                    if (s.direction === 'long') { dirLabel = '↑ 做多'; dirClass = 'long'; }
                    if (s.direction === 'short') { dirLabel = '↓ 做空'; dirClass = 'short'; }
                    if (s.direction === 'spot') { dirLabel = '现货'; dirClass = 'spot'; }

                    // 预处理用于 Alert 的文本
                    const safeRaw = escapeText(s.rawSignal);
                    const safeAnalysis = escapeText(s.analysis);
                    const safeContent = escapeText(s.message_content);

                    return \`
                    <div class="card">
                        <div class="card-header">
                            <div class="user-info">
                                <div>
                                    <div class="author">\${s.author}</div>
                                    <div class="channel-name">｜ \${s.channel}</div>
                                </div>
                            </div>
                            <div class="direction-badge \${dirClass}">\${dirLabel}</div>
                        </div>
                        
                        <div class="symbol-title">\${s.symbol}</div>
                        
                        <div class="signal-data" onclick="alert('\${safeRaw}')">
                            <div class="data-row">
                                <div class="data-item">
                                    <div class="label">入场</div>
                                    <div class="value">\${s.entryPrice}</div>
                                </div>
                                <div class="data-item">
                                    <div class="label">止盈</div>
                                    <div class="value win">\${s.takeProfit}</div>
                                </div>
                            </div>
                            <div class="data-row">
                                <div class="data-item">
                                    <div class="label">止损</div>
                                    <div class="value loss">\${s.stopLoss}</div>
                                </div>
                                 <div class="data-item">
                                     <div class="label">杠杆/仓位</div>
                                    <div class="value">\${s.leverage} / \${s.position}</div>
                                </div>
                            </div>
                        </div>

                        <div class="card-footer">
                            <div class="time">\${s.time}</div>
                            <div class="footer-buttons">
                                <div class="details-btn ai-btn" onclick="alert('\${safeAnalysis}')">AI 分析</div>
                                <div class="details-btn" onclick="alert('\${safeContent}')">查看原文 ></div>
                            </div>
                        </div>
                    </div>
                    \`;
                }).join('');
            }
        </script>
    </body>
    </html>
    `;
}
