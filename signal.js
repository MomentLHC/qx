/*
 * Crypto Signal Dashboard - Mobile UI
 * 访问地址: https://signal.hub/
 */

const API_URL = "http://ai.zhixing.icu:5002/api/frontend-messages?type=signal&limit=200";

(async () => {
    try {
        const url = $request.url;

        // 如果是根路径，加载主页
        if (/^https?:\/\/signal\.hub\/?$/.test(url)) {
            const apiData = await httpGet(API_URL);
            const messages = apiData.messages || [];
            const parsedSignals = messages.map(msg => {
                return parseSignalLogic(msg.signal, msg.message_content, msg);
            });

            const html = renderDashboard(parsedSignals);

            $done({
                response: {
                    status: 200,
                    headers: { "Content-Type": "text/html;charset=UTF-8" },
                    body: html
                }
            });
        } else {
            $done({ response: { status: 404, body: "Not Found" } });
        }

    } catch (err) {
        $done({
            response: {
                status: 500,
                headers: { "Content-Type": "text/html;charset=UTF-8" },
                body: `<h1>Error</h1><p>${err}</p >`
            }
        });
    }
})();

function httpGet(url) {
    return new Promise((resolve, reject) => {
        $httpClient.get(url, (error, response, data) => {
            if (error) reject(error);
            else {
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
        author: originalMsg.author_nickname,
        avatar: originalMsg.author_avatar_original || originalMsg.author_avatar,
        time: originalMsg.created_at,
        rawSignal: S,
        channel: originalMsg.channel_name // Added channel name
    };

    if (!S) S = "";
    if (!f) f = "";

    if (/方向[：:]\s*(多单|做多|Long)/i.test(S)) T.direction = "long";
    else if (/方向[：:]\s*(空单|做空|Short)/i.test(S)) T.direction = "short";
    else if (/方向[：:]\s*(现货)/i.test(S)) T.direction = "spot";
    else if (/方向[：:]\s*(平仓)/i.test(S)) T.direction = "close";
    else if (f.includes("做多") || f.includes("多单") || f.includes("Long")) T.direction = "long";
    else if (f.includes("做空") || f.includes("空单") || f.includes("Short")) T.direction = "short";
    else if (f.includes("现货")) T.direction = "spot";

    const D = S.match(/币种[：:]\s*([A-Z0-9]{2,10})/i) || S.match(/([A-Z0-9]{2,10})(\/USDT|USDT)?/i);
    if (D) T.symbol = D[1].toUpperCase();

    const W = S.match(/入场[价位]*[:：]?\s*([\d.,\-~附近市价]+)/i) || S.match(/价格[:：]?\s*([\d.,\-~]+)/i);
    if (W) T.entryPrice = W[1];

    const $loss = S.match(/止损[:：]?\s*([\d.,]+)/i);
    if ($loss) T.stopLoss = $loss[1];

    const u = S.match(/止盈[:：]?\s*([\d.,\-~]+)/i) || S.match(/目标[:：]?\s*([\d.,\-~<>]+)/i);
    if (u) T.takeProfit = u[1];

    const m = S.match(/杠杆[:：]?\s*([\d]+)\s*倍?/i) || S.match(/([\d]+)\s*倍/i);
    if (m) T.leverage = m[1] + "x";

    const Y = S.match(/仓位[:：]?\s*([\d]+)%/i);
    if (Y) T.position = Y[1] + "%";

    if (f.includes("现货") || T.direction === "spot") T.type = "现货";
    else if ((T.leverage && T.leverage !== "-") || f.includes("合约")) T.type = "合约";

    return T;
}

function renderDashboard(signals) {
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
                    < img src="${s.avatar}" alt="avatar" onerror="this.src='https://via.placeholder.com/40'">
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
                        </div>
                </div>
            </div>

            <div class="card-footer">
                <div class="time">${s.time}</div>
                <div class="footer-buttons">
                    <div class="signal-count">3条信号</div>
                    <div class="details-btn">查看详情 ></div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
            }
            body { background: var(--bg); color: var(--text-main); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; padding-bottom: 60px; }
            
            /* Header */
            .app-header { background: var(--nav-bg); padding: 15px; position: sticky; top: 0; z-index: 10; }
            .app-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .app-subtitle { font-size: 12px; color: var(--text-sub); margin-bottom: 15px; }
            
            /* Search Bar */
            .search-container { display: flex; gap: 10px; margin-bottom: 15px; }
            .search-input { flex: 1; background: #f0f2f5; border: none; padding: 10px 15px; border-radius: 8px; font-size: 14px; }
            .icon-btn { background: #f0f2f5; border: none; padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .icon-btn svg { width: 20px; height: 20px; fill: var(--text-sub); }
            
            /* Tabs */
            .tabs-container { display: flex; gap: 15px; margin-bottom: 15px; background: var(--nav-bg); padding: 5px; border-radius: 8px; }
            .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px; border-radius: 6px; font-size: 14px; color: var(--text-sub); cursor: pointer; }
            .tab.active { background: #eef3fd; color: var(--blue); font-weight: bold; }
            .tab-count { background: #eef3fd; color: var(--blue); padding: 2px 6px; border-radius: 10px; font-size: 12px; }
            
            /* Card Style */
            .card { background: var(--card-bg); border-radius: 12px; padding: 15px; margin: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            .user-info { display: flex; align-items: center; gap: 10px; }
            .user-info img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
            .author { font-weight: bold; font-size: 15px; }
            .channel-name { font-size: 12px; color: var(--text-sub); }
            
            .direction-badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
            .direction-badge.long { background-color: #e6f4ea; color: var(--green); }
            .direction-badge.short { background-color: #fdeaea; color: var(--red); }
            .direction-badge.spot { background-color: #fff3e0; color: orange; }
            
            .symbol-title { font-size: 22px; font-weight: 800; margin-bottom: 15px; }
            
            /* Signal Data Grid */
            .signal-data { background: #f9fafb; padding: 15px; border-radius: 8px; }
            .data-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .data-row:last-child { margin-bottom: 0; }
            .data-item { flex: 1; }
            .data-item .label { font-size: 12px; color: var(--text-sub); margin-bottom: 5px; }
            .data-item .value { font-size: 16px; font-weight: 600; font-family: 'Monaco', monospace; }
            .value.win { color: var(--green); }
            .value.loss { color: var(--red); }
            
            /* Card Footer */
            .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 12px; color: var(--text-sub); }
            .footer-buttons { display: flex; gap: 10px; }
            .signal-count { background: #eef3fd; color: var(--blue); padding: 4px 8px; border-radius: 4px; }
            .details-btn { background: #1a1a1a; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; }

            /* Bottom Navigation */
            .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--nav-bg); display: flex; justify-content: space-around; padding: 10px 0; border-top: 1px solid #eee; }
            .nav-item { display: flex; flex-direction: column; align-items: center; font-size: 10px; color: var(--text-sub); }
            .nav-item.active { color: var(--blue); }
            .nav-icon { width: 24px; height: 24px; margin-bottom: 2px; }
            .nav-icon svg { fill: currentColor; }
        </style>
    </head>
    <body>
        <div class="app-header">
            <div class="app-title">交易信号</div>
            <div class="app-subtitle">所有频道的交易信号汇总</div>
            
            <div class="search-container">
                <input type="text" class="search-input" placeholder="搜索币种、作者或内容...">
                <button class="icon-btn"><svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg></button>
                <button class="icon-btn" onclick="window.location.reload()"><svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button>
            </div>
            
            <div class="tabs-container">
                <div class="tab active">Is 122 <span class="tab-count">122</span></div>
                <div class="tab">★ 0</div>
                <div class="tab">○ 122</div>
            </div>
        </div>

        <div id="app">
            ${cardsHtml}
        </div>
        
        <div class="bottom-nav">
            <div class="nav-item active">
                <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg></div>
                交易信号
            </div>
            <div class="nav-item">
                <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg></div>
                市场分析
            </div>
            <div class="nav-item">
                <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></div>
                我的
            </div>
        </div>
    </body>
    </html>
    `;
}
