/*
更新时间：2025.12.16  16:51:00
*****************
[rewrite_local]
^https:\/\/app\.(smartappnet|studiotv|csrqoa|zudanje)\.(net|com)\/apim\/v3\/futures\/usdt\/(orders|accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com
*/

const scriptName = "开单提醒";
const url = $request.url;
const body = $response.body; // 获取响应体内容

// --- 配置区域 ---
const COOLDOWN_TIME = 5 * 60 * 1000; // 5分钟冷却
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";   
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME"; 

// --- 路径配置 ---
const holdingPath = "futures/usdt/positions?holding=true";
const targetPaths = [
    "futures/usdt/orders",      
    "futures/usdt/accounts",
];

// 状态标记
let matchType = null; // 'holding' 或 'normal'
let notifyTitle = "";
let notifyBody = "";

// --- 1. 逻辑判断区域 ---

// A. 优先检查持仓接口
if (url.indexOf(holdingPath) !== -1) {
    try {
        // 解析返回的 JSON 数据
        const obj = JSON.parse(body);
        
        // 判断 data 是否存在且数组长度大于 0
        if (obj && obj.data && obj.data.length > 0) {
            // ---> 真的有持仓
            matchType = 'holding';
            notifyTitle = '⚠️ 当前持有仓位';
            notifyBody = '请严格执行止盈止损，切勿抗单！';
        } else {
            // ---> 接口请求了，但没有持仓 (data为空)
            // 既然打开了 App，依然视为普通操作，进行风控提醒
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        console.log(`[${scriptName}] JSON解析失败: ${e}`);
        // 解析失败保底当作普通提醒
        matchType = 'normal';
        notifyTitle = '计划、风控、情绪';
        notifyBody = '请勿随意开单';
    }
} 
// B. 检查其他普通接口
else {
    for (let path of targetPaths) {
        if (url.indexOf(path) !== -1) {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '请勿随意开单';
            break;
        }
    }
}

// --- 2. 触发与冷却逻辑 (保持双轨制不变) ---

if (matchType) {
    const now = Date.now();
    const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;
    const lastHoldingTime = $persistentStore.read(KEY_HOLDING) || 0;
    
    // 如果是持仓提醒
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 检测到真实持仓，发送通知`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    // 如果是普通提醒（包括空仓状态）
    else if (matchType === 'normal') {
        // 降噪：如果近期发过持仓提醒，普通提醒静默
        if (now - Number(lastHoldingTime) < COOLDOWN_TIME) {
            console.log(`[${scriptName}] 命中普通规则，但已有持仓高优提醒，静默`);
            $done({});
            return; 
        }

        if (now - Number(lastNormalTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 普通提醒触发`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_NORMAL);
        }
    }
}

$done({});
