/*
更新时间：2025.12.16 19:15:00
功能：开单提醒 + 持仓数据放大100倍
*****************
[rewrite_local]
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com
*/

const scriptName = "开单提醒";
const url = $request.url;
// 注意：这里不要直接 const body = $response.body，后面需要处理可能修改后的 body

// --- 配置区域 ---
const COOLDOWN_TIME = 5 * 60 * 1000; // 5分钟冷却
const KEY_NORMAL = "GATE_NOTIFY_NORMAL_TIME";    
const KEY_HOLDING = "GATE_NOTIFY_HOLDING_TIME"; 

const holdingPath = "futures/usdt/positions?holding=true";
const targetPaths = ["futures/usdt/accounts"];

let matchType = null; 
let notifyTitle = "";
let notifyBody = "";
let modifiedBody = null; // 用于存储修改后的JSON字符串

// --- 1. 逻辑判断 & 数据修改 ---

if (url.indexOf(holdingPath) !== -1) {
    try {
        let obj = JSON.parse($response.body);
        
        // A. 判断持仓状态 (原有逻辑)
        if (obj && obj.data && obj.data.length > 0) {
            matchType = 'holding';
            notifyTitle = '⚠️ 当前持有仓位';
            notifyBody = '请严格执行止盈止损，切勿抗单！';
            
            // B. 数据修改逻辑 (新增逻辑：放大100倍)
            // 遍历 data 数组
            obj.data.forEach(item => {
                // 检查 size 是否存在且不为 0 (过滤掉空单占位符)
                if (item.size && item.size != 0) {
                    
                    // 1. 修改 Size (数量) - JSON中是数字类型
                    item.size = item.size * 100;
                    
                    // 2. 修改 保证金 (initial_margin) - JSON中是字符串类型
                    if (item.initial_margin) {
                        item.initial_margin = (parseFloat(item.initial_margin) * 100) + "";
                    }
                    
                    // 3. 修改 收益金额/未实现盈亏 (unrealised_pnl) - JSON中是字符串类型
                    if (item.unrealised_pnl) {
                        item.unrealised_pnl = (parseFloat(item.unrealised_pnl) * 100) + "";
                    }

                    // 4. (可选) 修改 已实现盈亏 (realised_pnl) 保持数据一致性
                    if (item.realised_pnl) {
                        item.realised_pnl = (parseFloat(item.realised_pnl) * 100) + "";
                    }
                }
            });
            
            // 将修改后的对象转回字符串，准备返回给 App
            modifiedBody = JSON.stringify(obj);

        } else {
            matchType = 'normal';
            notifyTitle = '计划、风控、情绪';
            notifyBody = '空仓状态：请勿随意开单';
        }
    } catch (e) {
        console.log(`[${scriptName}] 解析或修改失败: ${e}`);
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

// --- 3. 结束脚本并返回数据 ---

if (modifiedBody) {
    // 如果修改了数据（即在持仓界面），返回修改后的 body
    $done({ body: modifiedBody });
} else {
    // 否则返回原始数据，不影响 App 正常读取
    $done({});
}
