/*
 *
 *
脚本功能：Crypto Signal Dashboard (悬浮导航版)
脚本作者：MomentLHC
更新时间：2025
问题反馈：
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！
***************************
[rewrite_local]
# > 交易信号看板 (访问 https://kol.zhixing.icu/dashboard)
^https?:\/\/kol\.zhixing\.icu\/dashboard url script-analyze-echo-response https://raw.githubusercontent.com/MomentLHC/qx/ml/sgml.js

[mitm]
hostname = kol.zhixing.icu
*
*
*/

const API_URL = "https://kol.zhixing.icu/api/user/proxy/frontend-messages?type=signal&limit=50";

(async () => {
    // 1. 生成 HTML 骨架
    const html = renderPageSkeleton();

    // 2. QX 返回响应的标准格式 (Mock Response)
    const response = {
        status: "HTTP/1.1 200 OK",
        headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "no-store, no-cache, must-revalidate"
        },
        body: html
    };

    $done(response);
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
        <meta name="theme-color" content="#ffffff">
        
        <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/144/bullish.png">
        <title>交易信号</title>
        <style>
            :root {
                --page-bg: #f5f7fa;   
                --header-bg: #ffffff;
                --card-bg: #ffffff;
                --text-main: #1a1a1a;
                --text-sub: #8c8c8c;
                --green: #3fb950;
                --red: #f85149;
                --blue: #1f6feb;
                --purple: #7048e8;
                --safe-top: env(safe-area-inset-top);
                --safe-bottom: env(safe-area-inset-bottom);
            }
            
            html {
                background-color: var(--header-bg);
            }
            
            body { 
                background-color: var(--page-bg); 
                color: var(--text-main); 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                padding-bottom: calc(90px + var(--safe-bottom));
                overscroll-behavior-y: none;
                -webkit-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
                min-height: 100vh;
            }
            
            /* 顶部标题栏 */
            .app-header { 
                background: var(--header-bg); 
                color: var(--text-main);
                padding: calc(12px + var(--safe-top)) 20px 12px 20px; 
                position: sticky; 
                top: 0; 
                z-index: 100; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .app-title { 
                font-size: 22px; font-weight: 800; margin: 0; color: #000; letter-spacing: -0.5px;
            }
            
            /* 状态提示区域 */
            #status-bar { padding: 40px 20px; text-align: center; }
            
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
                border: 3px solid rgba(0,0,0,0.1); border-radius: 50%; border-top: 3px solid var(--blue);
                width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px auto;
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
            
            .signal-data { 
                background: #f9fafb; padding: 15px; border-radius: 12px; 
                cursor: pointer; transition: background-color 0.2s;
            }
            .signal-data:active { background: #eef0f5; }

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
            .ai-btn { background: #f3f0ff; color: var(--purple); }

            /* 悬浮式底部导航栏 */
            .bottom-nav { 
                position: fixed; 
                bottom: calc(20px + var(--safe-bottom)); 
                left: 20px; 
                right: 20px; 
                height: 60px;
                background: rgba(255, 255, 255, 0.85); 
                backdrop-filter: blur(12px); 
                -webkit-backdrop-filter: blur(12px);
                display: flex; 
                justify-content: space-around; 
                align-items: center;
                border-radius: 30px; 
                box-shadow: 0 10px 40px rgba(0,0,0,0.1); 
                z-index: 200;
                border: 1px solid rgba(255,255,255,0.5); 
            }
            .nav-item { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
                font-size: 10px; 
                color: #999; 
                width: 60px;
                font-weight: 600;
            }
            .nav-item.active { color: var(--blue); }
            .nav-icon { width: 24px; height: 24px; margin-bottom: 2px; }
            .nav-icon svg { fill: currentColor; }
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

        <div class="bottom-nav">
            <div class="nav-item active">
                <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg></div>
                交易信号
            </div>
            <div class="nav-item">
                <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></div>
                我的
            </div>
        </div>

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

            // 时间格式化：强制使用 UTC 时间，不转换本地时区
            function formatDate(isoString) {
                if (!isoString) return '';
                const date = new Date(isoString);
                if (isNaN(date.getTime())) return isoString;

                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                const hours = String(date.getUTCHours()).padStart(2, '0'); 
                const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                const seconds = String(date.getUTCSeconds()).padStart(2, '0');

                return \`\${year}-\${month}-\${day} \${hours}:\${minutes}:\${seconds}\`;
            }

            function escapeText(text) {
                if (!text) return '';
                return text.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/\\n/g, '\\\\n').replace(/\\r/g, '');
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
