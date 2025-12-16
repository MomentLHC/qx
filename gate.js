/*
更新时间：2025.12.16 21:00:00
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
const KEY_MAGNIFICATION = "GATE_MAGNIFICATION"; // 放大倍数 Key
const KEY_COOLDOWN = "GATE_COOLDOWN_MINUTES";   // 冷却时间 Key

const holdingPath = "futures/usdt/positions?holding=true";
const targetPaths = ["futures/usdt/accounts"];

let matchType = null; 
let notifyTitle = "";
let notifyBody = "";
let modifiedBody = null; 

// --- 配置读取函数 ---

// 1. 获取放大倍数 (默认 100)
function getMultiplier() {
    const val = $persistentStore.read(KEY_MAGNIFICATION);
    if (!val || isNaN(val)) {
        return 100; 
    }
    return parseFloat(val);
}

// 2. 获取冷却时间 (返回毫秒，默认 5分钟)
function getCooldownTime() {
    const val = $persistentStore.read(KEY_COOLDOWN);
    let minutes = 5; // 默认值
    if (val && !isNaN(val)) {
        minutes = parseFloat(val);
    }
    // 将分钟转换为毫秒
    return minutes * 60 * 1000;
}

// --- 1. 逻辑判断 & 数据修改 ---

if (url.indexOf(holdingPath) !== -1) {
    try {
        let obj = JSON.parse($response.body);
        
        // A. 判断持仓状态
        if (obj && obj.data && obj.data.length > 0) {
            matchType = 'holding';
            notifyTitle = '⚠️ 当前持有仓位';
            notifyBody = '请严格执行止盈止损，切勿抗单！';
            
            const multiplier = getMultiplier();
            // console.log(`[${scriptName}] 当前放大倍数: ${multiplier}`);

            // B. 数据修改逻辑
            obj.data.forEach(item => {
                if (item.size && item.size != 0) {
                    // 修改 Size
                    item.size = item.size * multiplier;
                    // 修改 保证金
                    if (item.initial_margin) item.initial_margin = (parseFloat(item.initial_margin) * multiplier) + "";
                    // 修改 未实现盈亏
                    if (item.unrealised_pnl) item.unrealised_pnl = (parseFloat(item.unrealised_pnl) * multiplier) + "";
                    // 修改 已实现盈亏
                    if (item.realised_pnl) item.realised_pnl = (parseFloat(item.realised_pnl) * multiplier) + "";
                }
            });
            
            modifiedBody = JSON.stringify(obj);

        } else {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        console.log(`[${scriptName}] 解析失败: ${e}`);
        matchType = 'normal';
        notifyTitle = '计划、风控、情绪';
        notifyBody = '请勿随意开单';
    }
} else {
    for (let path of targetPaths) {
        if (url.indexOf(path) !== -1) {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '请勿随意开单';
            break;
        }
    }
}

// --- 2. 触发通知逻辑 ---

if (matchType) {
    const now = Date.now();
    const lastHoldingTime = $persistentStore.read(KEY_HOLDING) || 0;
    
    // 获取当前的冷却时间配置 (毫秒)
    const currentCooldown = getCooldownTime(); 
    
    // === 场景 A: 持仓提醒 ===
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > currentCooldown) {
            console.log(`[${scriptName}] 🔥持仓提醒 (冷却: ${currentCooldown/1000/60}分)`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    // === 场景 B: 普通提醒 ===
    else if (matchType === 'normal') {
        const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;

        if (now - Number(lastNormalTime) < currentCooldown) {
            // 自身冷却中
        } 
        else {
            if (now - Number(lastHoldingTime) < currentCooldown) {
                // 被持仓警告压制
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
