/*
更新时间：2025.12.16 20:30:00

*****************
[rewrite_local]
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com
*/

const scriptName = "开单提醒";
const url = $request.url;

// --- 配置区域 ---
const COOLDOWN_TIME = 5 * 60 * 1000; // 5分钟冷却
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME";
// 新增：BoxJs 存储倍数的 Key
const KEY_MAGNIFICATION = "GATE_MAGNIFICATION"; 

const holdingPath = "futures/usdt/positions?holding=true";
const targetPaths = ["futures/usdt/accounts"];

let matchType = null; 
let notifyTitle = "";
let notifyBody = "";
let modifiedBody = null; 

// --- 获取放大倍数 ---
function getMultiplier() {
    const val = $persistentStore.read(KEY_MAGNIFICATION);
    // 如果 BoxJs 里没填或者不是数字，默认返回 100
    if (!val || isNaN(val)) {
        return 100; 
    }
    return parseFloat(val);
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
            
            // 获取当前配置的倍数
            const multiplier = getMultiplier();
            console.log(`[${scriptName}] 当前放大倍数: ${multiplier}`);

            // B. 数据修改逻辑
            obj.data.forEach(item => {
                // 检查 size 是否存在且不为 0
                if (item.size && item.size != 0) {
                    
                    // 1. 修改 Size (数量)
                    item.size = item.size * multiplier;
                    
                    // 2. 修改 保证金 (initial_margin)
                    if (item.initial_margin) {
                        item.initial_margin = (parseFloat(item.initial_margin) * multiplier) + "";
                    }
                    
                    // 3. 修改 收益金额/未实现盈亏 (unrealised_pnl)
                    if (item.unrealised_pnl) {
                        item.unrealised_pnl = (parseFloat(item.unrealised_pnl) * multiplier) + "";
                    }

                    // 4. 修改 已实现盈亏 (realised_pnl)
                    if (item.realised_pnl) {
                        item.realised_pnl = (parseFloat(item.realised_pnl) * multiplier) + "";
                    }
                }
            });
            
            modifiedBody = JSON.stringify(obj);

        } else {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        console.log(`[${scriptName}] 解析或修改失败: ${e}`);
        // 容错处理
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
    
    if (matchType === 'holding') {
        if (now - Number(lastHoldingTime) > COOLDOWN_TIME) {
            console.log(`[${scriptName}] 🔥检测到持仓，发送通知`);
            $notification.post(scriptName, notifyTitle, notifyBody);
            $persistentStore.write(now.toString(), KEY_HOLDING);
        }
    } 
    else if (matchType === 'normal') {
        const lastNormalTime = $persistentStore.read(KEY_NORMAL) || 0;
        if (now - Number(lastNormalTime) < COOLDOWN_TIME) {
            // 冷却中
        } 
        else {
            if (now - Number(lastHoldingTime) < COOLDOWN_TIME) {
                // 被持仓警告压制
            } 
            else {
                console.log(`[${scriptName}] 🔔发送普通提醒`);
                $notification.post(scriptName, notifyTitle, notifyBody);
                $persistentStore.write(now.toString(), KEY_NORMAL);
            }
        }
    }
}

// --- 3. 结束脚本 ---

if (modifiedBody) {
    $done({ body: modifiedBody });
} else {
    $done({});
}
