/**
 * Gate Futures 下单拦截脚本
 * Author: momentLHC
[rewrite_local]
# 1. 拦截下单请求 (交易锁)
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/orders url script-request-header https://raw.githubusercontent.com/momentLHC/qx/ml/gatett.js


[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com

 */

const scriptName = "Gate 风控拦单";
let isHandled = false;

const req = $request || {};
const url = req.url || "";
const method = req.method || "";


// ========================
// 拦截下单（request）
// ========================
if (
    method === "POST" &&
    url.includes("/apim/v3/futures/usdt/orders") &&
    !url.includes("/precheck")
) {
    isHandled = true;

    // 通知
    $notification.post(
        scriptName,
        "🚫 已禁止开单",
        "当前处于风控状态，已拦截下单请求"
    );

    // 返回伪成功响应（阻断真实下单）
    $done({
        status: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            code: 200,
            message: "success",
            method: "/apim/v3/futures/usdt/orders",
            data: null
        })
    });
}


// ========================
// 非下单请求，直接放行
// ========================
if (!isHandled) {
    $done({});
}
