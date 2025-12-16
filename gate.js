/*
更新时间：2025.12.16  17:50:00
*****************
[rewrite_local]
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com
*/
const scriptName = "开单提醒";
const url = $request.url;
const body = $response.body; 

// --- 配置区域 ---
const COOLDOWN_TIME = 5 * 60 * 1000; // 5分钟冷却
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";   
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME"; 

const holdingPath = "futures/usdt/positions?holding=true";
const targetPaths = ["futures/usdt/accounts"];

let matchType = null; 
let notifyTitle = "";
let notifyBody = "";

// --- 1. 逻辑判断 ---

if (url.indexOf(holdingPath) !== -1) {
    try {
        const obj = JSON.parse(body);
        if (obj && obj.data && obj.data.length > 0) {
            matchType = 'holding';
            notifyTitle = '⚠️ 当前持有仓位';
            notifyBody = '请严格执行止盈止损，切勿抗单！';
        } else {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        matchType = 'normal'; // 解析失败默认按普通处理
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

// --- 2. 触发逻辑 ---

if (matchType) {
    const now = Date.now();
    const lastHoldingTime = $persistentStore.read(KEY_HOLDING) || 0;
    
    // === 场景 A: 持仓提醒 ===
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 🔥检测到持仓，发送通知`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    // === 场景 B: 普通提醒 ===
    else if (matchType === 'normal') {
        const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;

        // 优化步骤1：先检查自己是不是在冷却，如果是，直接退出
        if (now - Number(lastNormalTime) < COOLDOWN_TIME) {
            // 普通提醒冷却中 -> 静默退出
        } 
        else {
            // 优化步骤2：自己准备好了，再检查是不是被"持仓警告"压制了
            if (now - Number(lastHoldingTime) < COOLDOWN_TIME) {
                // 被持仓警告压制 -> 静默退出
            } 
            else {
                // 只有两层关卡都通过，才发送通知并打印日志
                console.log(`[${scriptName}] 🔔发送普通提醒`);
                $notification.post(scriptName, notifyTitle, notifyBody);
                $persistentStore.write(now.toString(), KEY_NORMAL);
            }
        }
    }
}

$done({});
