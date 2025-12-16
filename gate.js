/*
更新时间：2025.12.16 22:00:00
*****************
[rewrite_local]
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com
*/

const scriptName = "开单提醒";
const url = $request.url;

// --- BoxJs Keys ---
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME";
const KEY_MAGNIFICATION = "GATE_MAGNIFICATION"; 
const KEY_COOLDOWN = "GATE_COOLDOWN_MINUTES";   

// --- 路径配置 ---
const holdingPath = "futures/usdt/positions?holding=true";
const accountPath = "futures/usdt/accounts"; // 改为单个字符串

let matchType = null; 
let notifyTitle = "";
let notifyBody = "";
let modifiedBody = null; 

// --- 配置读取函数 ---
function getMultiplier() {
    const val = $persistentStore.read(KEY_MAGNIFICATION);
    if (!val || isNaN(val)) return 100; 
    return parseFloat(val);
}

function getCooldownTime() {
    const val = $persistentStore.read(KEY_COOLDOWN);
    let minutes = 5; 
    if (val && !isNaN(val)) minutes = parseFloat(val);
    return minutes * 60 * 1000;
}

// --- 1. 逻辑判断 & 数据修改 ---

// === A. 持仓接口处理 ===
if (url.indexOf(holdingPath) !== -1) {
    try {
        let obj = JSON.parse($response.body);
        
        if (obj && obj.data && obj.data.length > 0) {
            matchType = 'holding';
            notifyTitle = '⚠️ 当前持有仓位';
            notifyBody = '请严格执行止盈止损，切勿抗单！';
            
            const multiplier = getMultiplier();

            obj.data.forEach(item => {
                if (item.size && item.size != 0) {
                    // 1. 修改数量
                    item.size = item.size * multiplier;
                    // 2. 修改金额类字段
                    ['initial_margin', 'unrealised_pnl', 'realised_pnl', 'margin_balance', 'value'].forEach(key => {
                        if (item[key]) item[key] = (parseFloat(item[key]) * multiplier) + "";
                    });
                }
            });
            modifiedBody = JSON.stringify(obj);

        } else {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        console.log(`[${scriptName}] 持仓解析失败: ${e}`);
        matchType = 'normal';
        notifyTitle = '计划、风控、情绪';
        notifyBody = '请勿随意开单';
    }
} 
// === B. 账户/余额接口处理 (新增逻辑) ===
else if (url.indexOf(accountPath) !== -1) {
    try {
        let obj = JSON.parse($response.body);
        const multiplier = getMultiplier();
        
        // 标记为普通类型，用于触发空仓提醒(如果未被压制)
        matchType = 'normal';
        notifyTitle = '计划、风控、情绪';
        notifyBody = '请勿随意开单';

        if (obj && obj.data) {
            obj.data.forEach(acc => {
                // 1. 需要放大的核心资金字段
                const moneyFields = [
                    'total',                    // 总权益
                    'available',                // 可用余额
                    'cross_available',          // 全仓可用
                    'cross_initial_margin',     // 全仓初始保证金(已用)
                    'cross_maintenance_margin', // 维持保证金
                    'unrealised_pnl',           // 未实现盈亏
                    'order_margin',             // 挂单冻结
                    'position_margin',          // 仓位保证金
                ];

                moneyFields.forEach(key => {
                    // 确保值存在且不是布尔值
                    if (acc[key] && typeof acc[key] !== 'boolean') {
                        acc[key] = (parseFloat(acc[key]) * multiplier) + "";
                    }
                });

                // 2. 处理嵌套的 history (历史统计)
                if (acc.history) {
                    ['pnl', 'fee', 'fund', 'dnw'].forEach(hKey => {
                         if (acc.history[hKey]) {
                             acc.history[hKey] = (parseFloat(acc.history[hKey]) * multiplier) + "";
                         }
                    });
                }
            });
            modifiedBody = JSON.stringify(obj);
        }
    } catch (e) {
        console.log(`[${scriptName}] 账户解析失败: ${e}`);
        // 不做额外处理，保持原样返回
    }
}

// --- 2. 触发通知逻辑 ---

if (matchType) {
    const now = Date.now();
    const lastHoldingTime = $persistentStore.read(KEY_HOLDING) || 0;
    const currentCooldown = getCooldownTime(); 
    
    // 场景 A: 持仓提醒
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > currentCooldown) {
            console.log(`[${scriptName}] 🔥持仓提醒 (冷却: ${currentCooldown/1000/60}分)`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    // 场景 B: 普通提醒 (空仓/刷新余额)
    else if (matchType === 'normal') {
        const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;

        // 检查自身冷却
        if (now - Number(lastNormalTime) < currentCooldown) {
            // 冷却中，跳过
        } 
        else {
            // 检查是否被持仓提醒压制 (如果刚报过持仓，就不报普通提醒)
            if (now - Number(lastHoldingTime) < currentCooldown) {
                // 被压制，跳过
            } 
            else {
                console.log(`[${scriptName}] 🔔普通提醒 (冷却: ${currentCooldown/1000/60}分)`);
                $notification.post(scriptName, notifyTitle, notifyBody);
                $persistentStore.write(now.toString(), KEY_NORMAL);
            }
        }
    }
}

// --- 3. 结束 ---
if (modifiedBody) {
    $done({ body: modifiedBody });
} else {
    $done({});
}
