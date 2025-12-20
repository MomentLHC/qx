/**************************************
 * Gate 合约风控脚本
 * 功能：
 * 1. 持仓 / 账户数据放大
 * 2. 持仓 / 空仓提醒
 * 3. 🚫 BoxJS 一键禁止开单（拦截 orders）
 *
 * Author: @momentLHC
[rewrite_local]
# Gate 交易助手 (二合一: 风控锁 + 数据修改/提醒)
# 1. 拦截下单请求 (交易锁)
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/orders url script-request-header https://raw.githubusercontent.com/momentLHC/qx/ml/gate.js

# 2. 修改持仓余额 & 发送提醒 (数据放大)
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true) url script-response-body https://raw.githubusercontent.com/momentLHC/qx/ml/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com
 **************************************/

// ================= 基础对象 =================
const url = $request?.url || "";
const method = $request?.method || "";
const body = $request?.body || "";

// ================= BoxJS Keys =================
const KEY_NORMAL_TIME = "GATE_NOTIFY_NORMAL_TIME";
const KEY_HOLDING_TIME = "GATE_NOTIFY_HOLDING_TIME";

const KEY_MAGNIFICATION = "GATE_MAGNIFICATION";
const KEY_COOLDOWN = "GATE_COOLDOWN_MINUTES";
const KEY_SCRIPT_NAME = "GATE_SCRIPT_NAME";

const KEY_TITLE_HOLDING = "GATE_TITLE_HOLDING";
const KEY_BODY_HOLDING = "GATE_BODY_HOLDING";
const KEY_TITLE_NORMAL = "GATE_TITLE_NORMAL";
const KEY_BODY_NORMAL = "GATE_BODY_NORMAL";

// 🚫 禁止开单总开关
const KEY_BLOCK_ORDER = "GATE_BLOCK_ORDER";

// ================= 接口路径 =================
const PATH_HOLDING = "/futures/usdt/positions";
const PATH_ACCOUNT = "/futures/usdt/accounts";
const PATH_ORDER = "/apim/v3/futures/usdt/orders";

// ================= 工具函数 =================
function getScriptName() {
    return $persistentStore.read(KEY_SCRIPT_NAME) || "Gate 风控";
}

function getMultiplier() {
    const v = $persistentStore.read(KEY_MAGNIFICATION);
    return (!v || isNaN(v)) ? 100 : parseFloat(v);
}

function getCooldown() {
    const v = $persistentStore.read(KEY_COOLDOWN);
    return ((v && !isNaN(v)) ? parseFloat(v) : 5) * 60 * 1000;
}

function getNotifyText(type) {
    if (type === "holding") {
        return {
            title: $persistentStore.read(KEY_TITLE_HOLDING) || "⚠️ 当前持有仓位",
            body: $persistentStore.read(KEY_BODY_HOLDING) || "请严格执行止盈止损，切勿抗单！"
        };
    }
    return {
        title: $persistentStore.read(KEY_TITLE_NORMAL) || "计划、风控、情绪",
        body: $persistentStore.read(KEY_BODY_NORMAL) || "请勿随意开单"
    };
}

// ================= 🚫 禁止开单（request 阶段） =================
if (
    method === "POST" &&
    url.includes(PATH_ORDER)
) {
    const block = $persistentStore.read(KEY_BLOCK_ORDER) === "true";
    const scriptName = getScriptName();

    if (block) {
        console.log(`[${scriptName}] 🚫 已拦截下单请求`);

        $notification.post(
            scriptName,
            "🚫 已禁止开单",
            "当前处于风控状态，已拦截下单请求"
        );

        // ⚠️ 直接在 request 阶段返回伪造响应
        $done({
            status: 200,
            body: JSON.stringify({
                code: 200,
                message: "success",
                method: "/apim/v3/futures/usdt/orders",
                data: null
            })
        });
        return;
    }
}

// ================= 以下为 response 处理 =================
let matchType = null;
let modifiedBody = null;
const scriptName = getScriptName();

// === 持仓接口 ===
if (url.includes(PATH_HOLDING) && $response?.body) {
    try {
        const obj = JSON.parse($response.body);

        if (obj?.data?.length > 0) {
            matchType = "holding";
            const m = getMultiplier();

            obj.data.forEach(item => {
                if (item.size) item.size *= m;

                [
                    "initial_margin",
                    "unrealised_pnl",
                    "realised_pnl",
                    "margin_balance",
                    "value"
                ].forEach(k => {
                    if (item[k]) {
                        item[k] = (parseFloat(item[k]) * m) + "";
                    }
                });
            });

            modifiedBody = JSON.stringify(obj);
        } else {
            matchType = "normal";
        }
    } catch (e) {
        console.log(`[${scriptName}] 持仓解析失败`);
    }
}

// === 账户接口 ===
if (url.includes(PATH_ACCOUNT) && $response?.body) {
    try {
        const obj = JSON.parse($response.body);
        matchType = "normal";
        const m = getMultiplier();

        obj?.data?.forEach(acc => {
            [
                "total",
                "available",
                "cross_available",
                "unrealised_pnl",
                "order_margin",
                "position_margin"
            ].forEach(k => {
                if (acc[k]) {
                    acc[k] = (parseFloat(acc[k]) * m) + "";
                }
            });
        });

        modifiedBody = JSON.stringify(obj);
    } catch (e) {
        console.log(`[${scriptName}] 账户解析失败`);
    }
}

// ================= 通知逻辑 =================
if (matchType) {
    const now = Date.now();
    const cooldown = getCooldown();

    const lastHolding = Number($persistentStore.read(KEY_HOLDING_TIME) || 0);
    const lastNormal = Number($persistentStore.read(KEY_NORMAL_TIME) || 0);

    const text = getNotifyText(matchType);

    if (
        matchType === "holding" &&
        now - lastHolding > cooldown
    ) {
        $notification.post(scriptName, text.title, text.body);
        $persistentStore.write(now.toString(), KEY_HOLDING_TIME);
    }

    if (
        matchType === "normal" &&
        now - lastNormal > cooldown &&
        now - lastHolding > cooldown
    ) {
        $notification.post(scriptName, text.title, text.body);
        $persistentStore.write(now.toString(), KEY_NORMAL_TIME);
    }
}

// ================= 返回 =================
if (modifiedBody) {
    $done({ body: modifiedBody });
} else {
    $done({});
}
