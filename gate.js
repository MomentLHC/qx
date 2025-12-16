/*
更新时间：2025.12.16  17:35:00
*****************
[rewrite_local]
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com
*/

const scriptName = "开单提醒";
const url = $request.url;
// 必须开启 binary-body=0 或者不设置，确保 body 是字符串
const body = $response.body; 

// --- 配置区域 ---
const COOLDOWN_TIME = 5 * 60 * 1000; // 5分钟冷却
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";   
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME"; 

// --- 路径配置 ---
const holdingPath = "futures/usdt/positions?holding=true";

// 已移除 orders，仅保留 accounts
const targetPaths = [
    "futures/usdt/accounts",
];

// 状态标记
let matchType = null; 
let notifyTitle = "";
let notifyBody = "";

// --- 1. 逻辑判断区域 ---

// A. 优先检查持仓接口
if (url.indexOf(holdingPath) !== -1) {
    try {
        const obj = JSON.parse(body);
        // 判断 data 是否存在且数组长度大于 0
        if (obj && obj.data && obj.data.length > 0) {
            matchType = 'holding';
            notifyTitle = '⚠️ 当前持有仓位';
            notifyBody = '请严格执行止盈止损，切勿抗单！';
        } else {
            // 没持仓，降级为普通提醒
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        console.log(`[${scriptName}] JSON解析失败: ${e}`);
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

// --- 2. 触发与冷却逻辑 ---

if (matchType) {
    const now = Date.now();
    const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;
    const lastHoldingTime = $persistentStore.read(KEY_HOLDING) || 0;
    
    // 场景一：持仓提醒 (高优先级)
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 检测到真实持仓，发送通知`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    // 场景二：普通提醒
    else if (matchType === 'normal') {
        
        // 【逻辑修复】这里改用 if-else 结构，避免使用 return
        
        // 1. 检查是否需要降噪（近期是否发过持仓警告）
        if (now - Number(lastHoldingTime) < COOLDOWN_TIME) {
            // 满足降噪条件：仅打印日志，不执行后续通知代码
            console.log(`[${scriptName}] 命中普通规则，但已有持仓高优提醒，静默`);
        } 
        else {
            // 2. 不需要降噪，才进行普通冷却时间检查
            if (now - Number(lastNormalTime) > COOLDOWN_TIME) {
                console.log(`[${scriptName}] 普通提醒触发`);
                $notification.post(scriptName, notifyTitle, notifyBody);
                $persistentStore.write(now.toString(), KEY_NORMAL);
            }
        }
    }
}

// 脚本统一在这里结束
$done({});
