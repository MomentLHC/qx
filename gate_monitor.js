/**
 * Gate 数据监控与修改
 * 功能：持仓/余额翻倍显示 + 周期性通知
 * Author: momentLHC
 */

const url = $request.url;
const scriptName = "Gate 交易助手";

// --- BoxJs Keys ---
const KEY_MAGNIFICATION = "GATE_MAGNIFICATION"; 
const KEY_COOLDOWN = "GATE_COOLDOWN_MINUTES";
const KEY_CUSTOM_NAME = "GATE_SCRIPT_NAME";
// 文案
const KEY_TITLE_HOLDING = "GATE_TITLE_HOLDING";
const KEY_BODY_HOLDING = "GATE_BODY_HOLDING";
const KEY_TITLE_NORMAL = "GATE_TITLE_NORMAL";
const KEY_BODY_NORMAL = "GATE_BODY_NORMAL";
// 时间记录
const KEY_NORMAL_TIME = "GATE_NOTIFY_NORMAL_TIME";
const KEY_HOLDING_TIME = "GATE_NOTIFY_HOLDING_TIME";

// 路径配置
const holdingPath = "futures/usdt/positions?holding=true";
const accountPath = "futures/usdt/accounts";

// 辅助函数
function getVal(key, defaultVal) {
    const val = $persistentStore.read(key);
    return (val === null || val === undefined) ? defaultVal : val;
}

// 主逻辑
let matchType = null; 
let modifiedBody = null; 

// A. 持仓处理
if (url.indexOf(holdingPath) !== -1) {
    try {
        let obj = JSON.parse($response.body);
        if (obj && obj.data && obj.data.length > 0) {
            matchType = 'holding';
            const multiplier = parseFloat(getVal(KEY_MAGNIFICATION, "100"));
            
            obj.data.forEach(item => {
                if (item.size && item.size != 0) {
                    item.size = item.size * multiplier;
                    ['initial_margin', 'unrealised_pnl', 'realised_pnl', 'margin_balance', 'value'].forEach(key => {
                        if (item[key]) item[key] = (parseFloat(item[key]) * multiplier) + "";
                    });
                }
            });
            modifiedBody = JSON.stringify(obj);
        } else {
            matchType = 'normal';
        }
    } catch (e) {
        console.log(`[Gate Monitor] 持仓解析失败: ${e}`);
        matchType = 'normal';
    }
} 
// B. 账户/余额处理
else if (url.indexOf(accountPath) !== -1) {
    try {
        let obj = JSON.parse($response.body);
        matchType = 'normal';
        const multiplier = parseFloat(getVal(KEY_MAGNIFICATION, "100"));

        if (obj && obj.data) {
            obj.data.forEach(acc => {
                const moneyFields = [
                    'total', 'available', 'cross_available', 
                    'cross_initial_margin', 'cross_maintenance_margin', 
                    'unrealised_pnl', 'order_margin', 'position_margin'
                ];
                moneyFields.forEach(key => {
                    if (acc[key] && typeof acc[key] !== 'boolean') {
                        acc[key] = (parseFloat(acc[key]) * multiplier) + "";
                    }
                });
                if (acc.history) {
                    ['pnl', 'fee', 'fund', 'dnw'].forEach(hKey => {
                         if (acc.history[hKey]) acc.history[hKey] = (parseFloat(acc.history[hKey]) * multiplier) + "";
                    });
                }
            });
            modifiedBody = JSON.stringify(obj);
        }
    } catch (e) {
        console.log(`[Gate Monitor] 账户解析失败: ${e}`);
    }
}

// C. 通知逻辑
if (matchType) {
    const now = Date.now();
    const lastHoldingTime = getVal(KEY_HOLDING_TIME, "0");
    const lastNormalTime = getVal(KEY_NORMAL_TIME, "0");
    const cooldown = parseFloat(getVal(KEY_COOLDOWN, "5")) * 60 * 1000;
    const customTitle = getVal(KEY_CUSTOM_NAME, "Gate提醒");

    // 持仓提醒
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > cooldown) {
            $notification.post(
                customTitle,
                getVal(KEY_TITLE_HOLDING, "⚠️ 当前持有仓位"),
                getVal(KEY_BODY_HOLDING, "请严格执行止盈止损，切勿抗单！")
            );
            $persistentStore.write(now.toString(), KEY_HOLDING_TIME);
        }
    } 
    // 常规提醒
    else if (matchType === 'normal') {
        // 如果最近没有触发持仓提醒，且常规提醒也冷却了，才发送
        if ((now - Number(lastNormalTime) > cooldown) && (now - Number(lastHoldingTime) > cooldown)) {
            $notification.post(
                customTitle,
                getVal(KEY_TITLE_NORMAL, "计划、风控、情绪"),
                getVal(KEY_BODY_NORMAL, "请勿随意开单")
            );
            $persistentStore.write(now.toString(), KEY_NORMAL_TIME);
        }
    }
}

// 结束
if (modifiedBody) {
    $done({ body: modifiedBody });
} else {
    $done({});
}
