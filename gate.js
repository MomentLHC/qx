/*
[rewrite_local]
^https:\/\/app\.(smartappnet|studiotv|csrqoa|zudanje|mbm06)\.(net|com)\/apim\/v3.* url script-request-header https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com
*/

const scriptName = "开单提醒";
const url = $request.url;

// --- 配置区域 ---
const COOLDOWN_TIME = 5 * 60 * 1000; // 5分钟冷却

// 【核心修改】：定义两个不同的存储 Key
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";   // 普通提醒的时间记录
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME"; // 持仓提醒的时间记录

// --- 路径配置 ---
const holdingPath = "futures/usdt/positions?holding=true";
const targetPaths = [
    "futures/usdt/orders",      
    "futures/usdt/accounts",
];

// 状态标记
let matchType = null; // 'holding' 或 'normal'
let matchedPath = "";
let notifyTitle = "";
let notifyBody = "";

// --- 1. 匹配逻辑 ---

// 优先检查持仓
if (url.indexOf(holdingPath) !== -1) {
    matchType = 'holding';
    matchedPath = "positions(holding)";
    notifyTitle = '⚠️ 当前持有仓位';
    notifyBody = '请严格执行止盈止损，切勿抗单！';
} 
else {
    // 检查普通接口
    for (let path of targetPaths) {
        if (url.indexOf(path) !== -1) {
            matchType = 'normal';
            matchedPath = path;
            notifyTitle = '计划、风控、情绪';
            notifyBody = '请勿随意开单';
            break;
        }
    }
}

// --- 2. 触发与冷却逻辑 ---

if (matchType) {
    const now = Date.now();
    
    // 分别读取两个时间记录
    const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;
    const lastHoldingTime = $persistentStore.read(KEY_HOLDING) || 0;
    
    // 【关键优化逻辑】
    if (matchType === 'holding') {
        // --- 场景 A：命中持仓 ---
        // 只需要判断 持仓记录 的冷却时间，完全无视普通记录
        if (now - Number(lastHoldingTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 发现持仓，发送高优通知`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            // 只更新持仓的时间 Key
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    else if (matchType === 'normal') {
        // --- 场景 B：命中普通接口 ---
        
        // 降噪处理：如果 5 分钟内已经发过“持仓提醒”，则无需发送“普通提醒”
        // 因为持仓提醒更重要，既然已经提示了，就没必要再废话“勿开单”
        if (now - Number(lastHoldingTime) < COOLDOWN_TIME) {
            console.log(`[${scriptName}] 普通接口匹配，但近期已有持仓提醒，主动静默`);
        }

        // 正常的普通冷却判断
        if (now - Number(lastNormalTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 普通接口匹配，发送提醒`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            // 只更新普通的时间 Key
            $persistentStore.write(now.toString(), KEY_NORMAL);
        }
    }
}

$done({});
