/*******************************
 * Gate 合约风控脚本
 * 作者 @momentLHC
 *******************************/

const url = $request.url;
const method = $request.method;
const body = $request.body || "";

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

// 🚫 禁止开单
const KEY_BLOCK_ORDER = "GATE_BLOCK_ORDER";

// ================= 路径 =================
const holdingPath = "futures/usdt/positions?holding=true";
const accountPath = "futures/usdt/accounts";
const orderPath = "/apim/v3/futures/usdt/orders";

// ================= 通用函数 =================
function getScriptName() {
    return $persistentStore.read(KEY_SCRIPT_NAME) || "开单提醒";
}

function getMultiplier() {
    const v = $persistentStore.read(KEY_MAGNIFICATION);
    return (!v || isNaN(v)) ? 100 : parseFloat(v);
}

function getCooldownTime() {
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

function isOpenPositionOrder(body) {
    try {
        const obj = JSON.parse(body);
        if (obj.reduce_only === true) return false;
        if (obj.close === true) return false;
        return true;
    } catch {
        return true;
    }
}

// ================= 🚫 禁止开单逻辑 =================
const scriptName = getScriptName();

if (url.includes(orderPath) && method === "POST") {
    const blockOrder = $persistentStore.read(KEY_BLOCK_ORDER) === "true";
    if (blockOrder && isOpenPositionOrder(body)) {
        console.log(`[${scriptName}] 🚫 已拦截开仓请求`);

        $notification.post(
            scriptName,
            "🚫 已禁止开单",
            "当前处于风控状态，已拦截本次开仓请求"
        );

        $done({
            status: 200,
            body: JSON.stringify({
                code: 1,
                label: "ORDER_BLOCKED",
                message: "Order blocked by risk control"
            })
        });
        return;
    }
}

// ================= 数据修改 & 提醒 =================
let matchType = null;
let modifiedBody = null;

if (url.includes(holdingPath)) {
    try {
        const obj = JSON.parse($response.body);
        if (obj?.data?.length) {
            matchType = "holding";
            const m = getMultiplier();
            obj.data.forEach(i => {
                if (i.size) i.size *= m;
                ["initial_margin","unrealised_pnl","realised_pnl","margin_balance","value"]
                    .forEach(k => i[k] && (i[k] = (parseFloat(i[k]) * m) + ""));
            });
            modifiedBody = JSON.stringify(obj);
        } else {
            matchType = "normal";
        }
    } catch {}
}

if (url.includes(accountPath)) {
    try {
        const obj = JSON.parse($response.body);
        matchType = "normal";
        const m = getMultiplier();
        obj?.data?.forEach(acc => {
            ["total","available","cross_available","unrealised_pnl","order_margin","position_margin"]
                .forEach(k => acc[k] && (acc[k] = (parseFloat(acc[k]) * m) + ""));
        });
        modifiedBody = JSON.stringify(obj);
    } catch {}
}

// ================= 通知 =================
if (matchType) {
    const now = Date.now();
    const cd = getCooldownTime();
    const lastHold = Number($persistentStore.read(KEY_HOLDING_TIME) || 0);
    const lastNormal = Number($persistentStore.read(KEY_NORMAL_TIME) || 0);

    const { title, body } = getNotifyText(matchType);

    if (matchType === "holding" && now - lastHold > cd) {
        $notification.post(scriptName, title, body);
        $persistentStore.write(now.toString(), KEY_HOLDING_TIME);
    }

    if (matchType === "normal" && now - lastNormal > cd && now - lastHold > cd) {
        $notification.post(scriptName, title, body);
        $persistentStore.write(now.toString(), KEY_NORMAL_TIME);
    }
}

modifiedBody ? $done({ body: modifiedBody }) : $done({});
