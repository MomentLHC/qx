/**
 * Gate 交易助手 (All-in-One)
 * * 功能：
 * 1. [Request]  根据 BoxJs 开关拦截下单请求，返回伪造成功数据（戒断模式）。
 * 2. [Response] 修改持仓/账户数据的显示倍数（装逼模式）。
 * 3. [Notify]   根据持仓状态发送周期性通知。
 * * Author: momentLHC
 
[rewrite_local]
# 1. 拦截下单请求 (交易锁)
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/orders$ url script-request-header https://raw.githubusercontent.com/momentLHC/qx/ml/gatett.js
# 2. 修改持仓余额 & 发送提醒 (数据放大)
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/ml/gatett.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com

 */

const scriptName = "Gate 交易助手";
const req = $request || {};
const url = req.url || "";
const method = req.method || "";

// ============================================
// BoxJs Keys & 配置读取
// ============================================
const KEY_BLOCK_TRADE = "GATE_BLOCK_TRADE";       // 拦截开关 (Boolean)
const KEY_MAGNIFICATION = "GATE_MAGNIFICATION";   // 放大倍数
const KEY_COOLDOWN = "GATE_COOLDOWN_MINUTES";     // 冷却时间
const KEY_SCRIPT_NAME = "GATE_SCRIPT_NAME";       // 脚本自定义名称
// 通知文案
const KEY_TITLE_HOLDING = "GATE_TITLE_HOLDING";
const KEY_BODY_HOLDING = "GATE_BODY_HOLDING";
const KEY_TITLE_NORMAL = "GATE_TITLE_NORMAL";
const KEY_BODY_NORMAL = "GATE_BODY_NORMAL";
// 时间记录
const KEY_NORMAL_TIME = "GATE_NOTIFY_NORMAL_TIME";
const KEY_HOLDING_TIME = "GATE_NOTIFY_HOLDING_TIME";

// 辅助函数：读取配置
function getVal(key, defaultVal) {
    const val = $persistentStore.read(key);
    return val === null || val === undefined ? defaultVal : val;
}

// ============================================
// 模块 A: 拦截下单逻辑 (Request Phase)
// ============================================
// 触发条件: POST 方法且路径包含 orders
if (method === "POST" && url.includes("/apim/v3/futures/usdt/orders") && !url.includes("/precheck")) {
    
    // 读取开关，默认为 false (不拦截)
    const isBlockEnabled = getVal(KEY_BLOCK_TRADE, "false") === "true";

    if (isBlockEnabled) {
        // 伪造的成功响应数据
        const mockResponseData = {
            "code": 200,
            "message": "success",
            "method": "/apim/v3/futures/usdt/orders",
            "data": {
                "update_id": 1,
                "pnl": "0",
                "pnl_margin": "0",
                "status": "finished",
                "refr": "0",
                "create_time": Date.now() / 1000, // 动态生成时间戳
                "refu": 0,
                "finish_as": "filled",
                "id_string": "32369623556224032",
                "stp_id": 0,
                "size": 1,
                "tif": "gtc",
                "finish_time": Date.now() / 1000,
                "id": 32369623556224032,
                "user": 18355884,
                "bbo": "opp",
                "left": 0,
                "biz_info": "dual",
                "stp_act": "-",
                "mkfr": "0.0002",
                "is_close": false,
                "contract": "BNB_USDT", // 注意：此处币种是写死的，仅做拦截展示
                "text": "app",
                "is_reduce_only": false,
                "is_liq": false,
                "tkfr": "0.0005",
                "price": "853.15",
                "iceberg": 0,
                "fill_price": "853.15",
                "amend_text": "-"
            }
        };

        // 发送拦截通知
        $notification.post(
            getVal(KEY_SCRIPT_NAME, scriptName),
            "🚫 已禁止开单",
            "风控开关已开启，已拦截本次下单请求并伪造成功回包。"
        );

        // 返回伪造数据，阻止网络请求
        const headers = {
            "Content-Type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        };
        
        $done({
            response: {
                status: 200,
                headers: headers,
                body: JSON.stringify(mockResponseData)
            }
        });
    } else {
        // 开关未开启，放行请求
        $done({});
    }
}

// ============================================
// 模块 B: 数据修改与监控逻辑 (Response Phase)
// ============================================
// 触发条件: 存在 response 且 路径匹配 account 或 positions
else if (typeof $response !== "undefined") {
    
    const holdingPath = "futures/usdt/positions?holding=true";
    const accountPath = "futures/usdt/accounts";
    let matchType = null;
    let modifiedBody = null;
    
    // 获取配置参数
    const multiplier = parseFloat(getVal(KEY_MAGNIFICATION, "100")) || 100;
    const cooldownTime = (parseFloat(getVal(KEY_COOLDOWN, "5")) || 5) * 60 * 1000;
    const customName = getVal(KEY_SCRIPT_NAME, scriptName);

    // --- B1. 持仓接口修改 ---
    if (url.indexOf(holdingPath) !== -1) {
        try {
            let obj = JSON.parse($response.body);
            if (obj && obj.data && obj.data.length > 0) {
                matchType = 'holding';
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
            console.log(`[Gate] 持仓解析失败: ${e}`);
            matchType = 'normal';
        }
    } 
    // --- B2. 账户接口修改 ---
    else if (url.indexOf(accountPath) !== -1) {
        try {
            let obj = JSON.parse($response.body);
            matchType = 'normal'; // 只要访问账户就视为常规活跃
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
            console.log(`[Gate] 账户解析失败: ${e}`);
        }
    }

    // --- B3. 通知触发逻辑 ---
    if (matchType) {
        const now = Date.now();
        const lastHoldingTime = getVal(KEY_HOLDING_TIME, "0");
        const lastNormalTime = getVal(KEY_NORMAL_TIME, "0");

        if (matchType === 'holding') {
            if (now - Number(lastHoldingTime) > cooldownTime) {
                $notification.post(
                    customName, 
                    getVal(KEY_TITLE_HOLDING, "⚠️ 当前持有仓位"), 
                    getVal(KEY_BODY_HOLDING, "请严格执行止盈止损，切勿抗单！")
                );
                $persistentStore.write(now.toString(), KEY_HOLDING_TIME);
            }
        } else if (matchType === 'normal') {
            // 如果最近刚报过持仓，就不报普通通知，防止刷屏
            if (now - Number(lastNormalTime) > cooldownTime && now - Number(lastHoldingTime) > cooldownTime) {
                 $notification.post(
                    customName, 
                    getVal(KEY_TITLE_NORMAL, "计划、风控、情绪"), 
                    getVal(KEY_BODY_NORMAL, "请勿随意开单")
                );
                $persistentStore.write(now.toString(), KEY_NORMAL_TIME);
            }
        }
    }

    // 返回修改后的数据
    if (modifiedBody) {
        $done({ body: modifiedBody });
    } else {
        $done({});
    }
} 
// 其他情况直接放行
else {
    $done({});
}
