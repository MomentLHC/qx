document.addEventListener("DOMContentLoaded", () => {
    // 从 window 对象中获取 Surge 注入的数据
    const rawData = window.SIGNAL_DATA || {};
    const messages = rawData.messages || [];
    
    if (messages.length === 0) {
        document.getElementById('app').innerHTML = '<div style="text-align:center;padding:20px;color:#888">暂无信号数据</div>';
        return;
    }

    const parsedSignals = messages.map(msg => parseSignalLogic(msg.signal, msg.message_content, msg));
    renderDashboard(parsedSignals);
});

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
        // 核心修改：使用 message_time
        time: originalMsg.message_time || originalMsg.created_at, 
        rawSignal: S || "",
        channel: originalMsg.channel_name || "未知频道"
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
                    <div class="signal-count">AI识别</div>
                    <div class="details-btn" onclick="alert('${s.rawSignal.replace(/\n/g, '\\n')}')">查看原文 ></div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    document.getElementById('app').innerHTML = cardsHtml;
    // 更新数量 Tab
    document.querySelector('.tab.active span').innerText = signals.length;
}
