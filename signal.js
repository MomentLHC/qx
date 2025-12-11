/*
 * Crypto Signal Dashboard - Minimalist & Robust
 * 1. 移除搜索/Tab/底部导航/AI标签
 * 2. 强健的错误处理，超时也能进入页面
 */

const API_URL = "https://kol.zhixing.icu/api/user/proxy/frontend-messages?type=signal&limit=200";

(async () => {
    // 初始化变量
    let messages = [];
    let errorMsg = null;

    try {
        const url = $request.url;

        if (/^https?:\/\/signal\.hub\/?$/.test(url)) {
            // 尝试请求数据
            try {
                const apiData = await httpGet(API_URL);
                messages = apiData.messages || [];
            } catch (e) {
                // 捕获请求错误（超时、网络断开等），但不抛出，而是记录错误
                console.log(`[Signal Hub] API Error: ${e}`);
                errorMsg = e; 
            }

            // 解析数据（如果有数据的话）
            const parsedSignals = messages.map(msg => {
                return parseSignalLogic(msg.signal, msg.message_content, msg);
            });

            // 渲染页面，传入数据和错误信息
            const html = renderDashboard(parsedSignals, errorMsg);

            // 无论成功失败，总是返回 200 和 HTML
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
        } else {
            $done({ response: { status: 404, body: "Not Found" } });
        }

    } catch (criticalErr) {
        // 极端的脚本内部错误兜底
        $done({
            response: {
                status: 200, // 依然尝试返回200，显示错误UI
                headers: { "Content-Type": "text/html;charset=UTF-8" },
                body: renderCriticalError(criticalErr)
            }
        });
    }
})();

function httpGet(url) {
    return new Promise((resolve, reject) => {
        $httpClient.get({url: url, timeout: 5}, (error, response, data) => { // 设置5秒超时，避免长时间白屏
            if (error) {
                reject(error);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject("JSON Parse Error: " + e);
                }
            }
        });
    });
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
        time: originalMsg.message_time || originalMsg.created_at, 
        rawSignal: S,
        channel: originalMsg.channel_name || "未知频道"
    };

    if (!S) S = "";
    if (!f) f = "";

    // 1. 方向判断
    if (/方向[：:]\s*(多单|做多|Long)/i.test(S)) T.direction = "long";
    else if (/方向[：:]\s*(空单|做空|Short)/i.test(S)) T.direction = "short";
    else if (/方向[：:]\s*(现货)/i.test(S)) T.direction = "spot";
    else if (/方向[：:]\s*(平仓)/i.test(S)) T.direction = "close";
    else if (f.includes("做多") || f.includes("多单") || f.includes("Long")) T.direction = "long";
    else if (f.includes("做空") || f.includes("空单") || f.includes("Short")) T.direction = "short";
    else if (f.includes("现货")) T.direction = "spot";

    // 2. 币种提取
    const D = S.match(/币种[：:]\s*([A-Z0-9]{2,10})/i) || S.match(/([A-Z0-9]{2,10})(\/USDT|USDT)?/i);
    if (D) T.symbol = D[1].toUpperCase();

    // 3. 入场价
    const W = S.match(/入场[价位]*[:：]?\s*([\d.,\-~附近市价]+)/i) || S.match(/价格[:：]?\s*([\d.,\-~]+)/i);
    if (W) T.entryPrice = W[1];

    // 4. 止损
    const $loss = S.match(/止损[:：]?\s*([\d.,]+)/i);
    if ($loss) T.stopLoss = $loss[1];

    // 5. 止盈
    const u = S.match(/止盈[:：]?\s*([\d.,\-~]+)/i) || S.match(/目标[:：]?\s*([\d.,\-~<>]+)/i);
    if (u) T.takeProfit = u[1];

    // 6. 杠杆
    const m = S.match(/杠杆[:：]?\s*([\d]+)\s*倍?/i) || S.match(/([\d]+)\s*倍/i);
    if (m) T.leverage = m[1] + "x";

    // 7. 仓位
    const Y = S.match(/仓位[:：]?\s*([\d]+)%/i);
    if (Y) T.position = Y[1] + "%";

    // 8. 类型判断
    if (f.includes("现货") || T.direction === "spot") T.type = "现货";
    else if ((T.leverage && T.leverage !== "-") || f.includes("合约")) T.type = "合约";

    return T;
}

function renderDashboard(signals, errorMsg) {
    // 1. 生成错误提示 HTML (如果有错误)
    let errorHtml = '';
    if (errorMsg) {
        errorHtml = `
        <div class="error-banner">
            <div class="error-icon">⚠️</div>
            <div class="error-content">
                <div class="error-title">数据更新失败</div>
                <div class="error-desc">${errorMsg}</div>
            </div>
            <button class="retry-btn" onclick="window.location.reload()">重试</button>
        </div>`;
    }

    // 2. 生成空状态提示 (如果没错误但也没数据)
    let emptyHtml = '';
    if (signals.length === 0 && !errorMsg) {
        emptyHtml = `<div style="text-align:center; padding: 40px; color: #999;">暂无交易信号</div>`;
    }

    // 3. 生成卡片 HTML
    const cardsHtml = signals.map(s => {
        let dirLabel = "观望";
        let dirClass = "";
        if (s.direction === 'long') { dirLabel = '↑ 做多'; dirClass = 'long'; }
        if (s.direction === 'short') { dirLabel = '↓ 做空'; dirClass = 'short'; }
        if (s.direction === 'spot') { dirLabel = '现货'; dirClass = 'spot'; }

        return `
        <div class="card">
            <div class="card-header">
                <div class="user-info">
                    <div>
                        <div class="author">${s.author}</div>
                        <div class="channel-name">｜ ${s.channel}</div>
                    </div>
                </div>
                <div class="direction-badge ${dirClass}">${dirLabel}</div>
            </div>
            
            <div class="symbol-title">${s.symbol}</div>
            
            <div class="signal-data">
                <div class="data-row">
                    <div class="data-item">
                        <div class="label">入场</div>
                        <div class="value">${s.entryPrice}</div>
                    </div>
                    <div class="data-item">
                        <div class="label">止盈</div>
                        <div class="value win">${s.takeProfit}</div>
                    </div>
                </div>
                <div class="data-row">
                    <div class="data-item">
                        <div class="label">止损</div>
                        <div class="value loss">${s.stopLoss}</div>
                    </div>
                     <div class="data-item">
                         <div class="label">杠杆/仓位</div>
                        <div class="value">${s.leverage} / ${s.position}</div>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <div class="time">${s.time}</div>
                <div class="footer-buttons">
                    <div class="details-btn" onclick="alert('${s.rawSignal.replace(/\n/g, '\\n')}')">查看原文 ></div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="交易助手">
        <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/144/bullish.png">

        <title>交易助手</title>
        <style>
            :root {
                --bg: #f5f7fa; 
                --card-bg: #ffffff;
                --text-main: #1a1a1a;
                --text-sub: #8c8c8c;
                --green: #3fb950;
                --red: #f85149;
                --blue: #1f6feb;
                --nav-bg: #ffffff; 
                --nav-text: #1a1a1a;
                --safe-top: env(safe-area-inset-top);
                --safe-bottom: env(safe-area-inset-bottom);
            }
            
            body { 
                background: var(--bg); 
                color: var(--text-main); 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                /* 底部不再需要给导航栏留位置了，只需适配安全区 */
                padding-bottom: calc(20px + var(--safe-bottom));
                overscroll-behavior-y: none;
                -webkit-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* 极简 Header */
            .app-header { 
                background: var(--nav-bg); 
                color: var(--nav-text);
                padding: calc(10px + var(--safe-top)) 20px 10px 20px; 
                position: sticky; 
                top: 0; 
                z-index: 100; 
                /* 移除了 Tab 和 搜索栏，给一点下边距 */
                margin-bottom: 10px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }
            
            .app-title { font-size: 24px; font-weight: 800; margin-bottom: 5px; color: #000; }
            .app-subtitle { font-size: 13px; color: #999; margin-bottom: 0; font-weight: 500; }
            
            /* 错误提示条样式 */
            .error-banner {
                margin: 15px 20px;
                background: #fff2f0;
                border: 1px solid #ffccc7;
                border-radius: 12px;
                padding: 12px 15px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .error-icon { font-size: 20px; }
            .error-content { flex: 1; }
            .error-title { font-weight: bold; color: #cf1322; font-size: 14px; }
            .error-desc { color: #cf1322; font-size: 12px; margin-top: 2px; word-break: break-all; }
            .retry-btn {
                background: #fff;
                border: 1px solid #ffccc7;
                color: #cf1322;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
            }

            /* Card 样式 */
            .card { 
                background: var(--card-bg); 
                border-radius: 16px; 
                padding: 20px; 
                margin: 15px 20px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
                border: 1px solid rgba(0,0,0,0.02);
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
            
            .signal-data { background: #f9fafb; padding: 15px; border-radius: 12px; }
            .data-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .data-row:last-child { margin-bottom: 0; }
            .data-item { flex: 1; }
            .data-item .label { font-size: 12px; color: #aaa; margin-bottom: 6px; font-weight: 500; }
            .data-item .value { font-size: 17px; font-weight: 700; font-family: 'Monaco', monospace; color: #333; }
            .value.win { color: var(--green); }
            .value.loss { color: var(--red); }
            
            .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 12px; color: #bbb; font-weight: 500;}
            .footer-buttons { display: flex; gap: 10px; }
            
            .details-btn { 
                background: #f0f2f5; 
                color: #666; 
                padding: 8px 16px; 
                border-radius: 8px; 
                cursor: pointer; 
                font-weight: 600;
                transition: opacity 0.2s;
            }
            .details-btn:active { opacity: 0.8; }
        </style>
    </head>
    <body>
        <div class="app-header">
            <div class="app-title">交易信号</div>
            <div class="app-subtitle">所有频道的交易信号汇总</div>
        </div>

        <div id="app">
            ${errorHtml}
            ${emptyHtml}
            ${cardsHtml}
        </div>
    </body>
    </html>
    `;
}

// 极端的脚本错误兜底页面
function renderCriticalError(err) {
    return `
    <html>
    <body style="padding:40px; font-family:sans-serif; text-align:center;">
        <h2 style="color:#f00">Script Error</h2>
        <p>${err}</p>
        <button onclick="window.location.reload()" style="padding:10px 20px;">Reload</button>
    </body>
    </html>`;
}
