/*
 * Crypto Signal Dashboard
 * 访问地址: https://signal.hub/
 */

const API_URL = "http://ai.zhixing.icu:5002/api/frontend-messages?type=signal&limit=200";

(async () => {
    try {
        const url = $request.url;

        // 如果是根路径，加载主页
        if (/^https?:\/\/signal\.hub\/?$/.test(url)) {
            // 1. 请求外部 API
            const apiData = await httpGet(API_URL);
            
            // 2. 解析数据
            const messages = apiData.messages || [];
            const parsedSignals = messages.map(msg => {
                // 结合原始信息和提取后的信号字段进行解析
                return parseSignalLogic(msg.signal, msg.message_content, msg);
            });

            // 3. 渲染 HTML
            const html = renderDashboard(parsedSignals);

            $done({
                response: {
                    status: 200,
                    headers: { "Content-Type": "text/html;charset=UTF-8" },
                    body: html
                }
            });
        } else {
            // 其他路径返回 404
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

// --- 辅助函数：封装 Surge 的 httpClient 为 Promise ---
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

// --- 核心逻辑：你的正则解析代码 ---
function parseSignalLogic(S, f, originalMsg) {
    // S: msg.signal (主要提取源)
    // f: msg.message_content (辅助判断源)
    // originalMsg: 原始对象，用于补充头像、时间等

    let T = {
        direction: "unknown", // long, short, spot, close
        symbol: "UNKNOWN",
        entryPrice: "-",
        stopLoss: "-",
        takeProfit: "-",
        leverage: "-",
        position: "-",
        type: "合约", // 默认
        // 补充显示的元数据
        author: originalMsg.author_nickname,
        avatar: originalMsg.author_avatar_original || originalMsg.author_avatar,
        time: originalMsg.created_at,
        rawSignal: S // 保留原始文本用于展示
    };

    if (!S) S = "";
    if (!f) f = "";

    // 1. 判断方向
    if (/方向[：:]\s*(多单|做多|Long)/i.test(S)) T.direction = "long";
    else if (/方向[：:]\s*(空单|做空|Short)/i.test(S)) T.direction = "short";
    else if (/方向[：:]\s*(现货)/i.test(S)) T.direction = "spot";
    else if (/方向[：:]\s*(平仓)/i.test(S)) T.direction = "close";
    else if (f.includes("做多") || f.includes("多单") || f.includes("Long")) T.direction = "long";
    else if (f.includes("做空") || f.includes("空单") || f.includes("Short")) T.direction = "short";
    else if (f.includes("现货")) T.direction = "spot";

    // 2. 提取币种
    const D = S.match(/币种[：:]\s*([A-Z0-9]{2,10})/i) || S.match(/([A-Z0-9]{2,10})(\/USDT|USDT)?/i);
    if (D) T.symbol = D[1].toUpperCase();

    // 3. 入场价格
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

// --- 渲染 HTML 页面 ---
function renderDashboard(signals) {
    // 生成卡片 HTML
    const cardsHtml = signals.map(s => {
        // 根据方向定义颜色类
        let dirClass = "neutral";
        let dirLabel = "观望";
        if (s.direction === 'long') { dirClass = 'long'; dirLabel = '做多 (Long)'; }
        if (s.direction === 'short') { dirClass = 'short'; dirLabel = '做空 (Short)'; }
        if (s.direction === 'spot') { dirClass = 'spot'; dirLabel = '现货买入'; }

        return `
        <div class="card">
            <div class="card-header">
                <div class="user-info">
                    < img src="${s.avatar}" alt="avatar" onerror="this.src='https://via.placeholder.com/40'">
                    <div>
                        <div class="author">${s.author}</div>
                        <div class="time">${s.time}</div>
                    </div>
                </div>
                <div class="badge ${dirClass}">${dirLabel}</div>
            </div>
            
            <div class="symbol-title">${s.symbol} <span style="font-size:12px; color:#888; font-weight:normal">${s.type}</span></div>
            
            <div class="grid-info">
                <div class="info-item">
                    <div class="label">入场</div>
                    <div class="value">${s.entryPrice}</div>
                </div>
                <div class="info-item">
                    <div class="label">止盈</div>
                    <div class="value win">${s.takeProfit}</div>
                </div>
                <div class="info-item">
                    <div class="label">止损</div>
                    <div class="value loss">${s.stopLoss}</div>
                </div>
                <div class="info-item">
                    <div class="label">杠杆/仓位</div>
                    <div class="value">${s.leverage} / ${s.position}</div>
                </div>
            </div>

            <div class="raw-content">
                <strong>原始信号:</strong><br>
                ${s.rawSignal.replace(/\n/g, '<br>')}
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
        <title>Crypto Signals Hub</title>
        <style>
            :root {
                --bg: #0d1117;
                --card-bg: #161b22;
                --text-main: #c9d1d9;
                --text-sub: #8b949e;
                --green: #238636;
                --red: #da3633;
                --blue: #1f6feb;
                --orange: #d29922;
            }
            body { background: var(--bg); color: var(--text-main); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 15px; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 20px; color: #fff; }
            
            .card { background: var(--card-bg); border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #30363d; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .user-info { display: flex; align-items: center; gap: 10px; }
            .user-info img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
            .author { font-weight: 600; font-size: 14px; color: #fff; }
            .time { font-size: 12px; color: var(--text-sub); }
            
            .badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: white; }
            .badge.long { background-color: var(--green); }
            .badge.short { background-color: var(--red); }
            .badge.spot { background-color: var(--orange); }
            .badge.neutral { background-color: var(--text-sub); }

            .symbol-title { font-size: 24px; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px; }

            .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .info-item { background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px; }
            .info-item .label { font-size: 11px; color: var(--text-sub); margin-bottom: 2px; }
            .info-item .value { font-size: 15px; font-weight: 600; font-family: 'Monaco', monospace; }
            .value.win { color: #3fb950; }
            .value.loss { color: #f85149; }

            .raw-content { font-size: 12px; color: var(--text-sub); background: #000; padding: 10px; border-radius: 6px; line-height: 1.4; border-left: 3px solid #30363d; }
            
            /* 刷新按钮 */
            .fab { position: fixed; bottom: 20px; right: 20px; background: var(--blue); width: 50px; height: 50px; border-radius: 25px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); cursor: pointer; }
            .fab svg { fill: white; width: 24px; height: 24px; }
        </style>
    </head>
    <body>
        <h1>加密交易信号聚合</h1>
        <div id="app">
            ${cardsHtml}
        </div>
        
        <div class="fab" onclick="window.location.reload()">
            <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </div>
    </body>
    </html>
    `;
}
