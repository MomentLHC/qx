/**
 * Gate Futures 下单拦截脚本
 * Author: momentLHC
[rewrite_local]
# 1. 拦截下单请求 (交易锁)
^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/orders$ url script-request-header https://raw.githubusercontent.com/momentLHC/qx/ml/gatett.js


[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com,app.mbm06.com,m.bxjddjt.com

 */
const scriptName = "Gate 风控拦单";

const req = $request || {};
const url = req.url || "";
const method = req.method || "";

// 定义伪造的响应数据 (根据你提供的 JSON)
// 注意：为了让 App 体验更好，部分字段（如时间戳）可以改为动态生成，
// 但此处严格遵守你提供的静态数据。
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
    "create_time": 1765862119.075,
    "refu": 0,
    "finish_as": "filled",
    "id_string": "32369623556224032",
    "stp_id": 0,
    "size": 1,
    "tif": "gtc",
    "finish_time": 1765862119.075,
    "id": 32369623556224032,
    "user": 18355884,
    "bbo": "opp",
    "left": 0,
    "biz_info": "dual",
    "stp_act": "-",
    "mkfr": "0.0002",
    "is_close": false,
    "contract": "BNB_USDT",
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

// ========================
// 拦截逻辑
// ========================

if (
    method === "POST" &&
    url.includes("/apim/v3/futures/usdt/orders") &&
    !url.includes("/precheck")
) {
    // 1. 发送通知
    $notification.post(
        scriptName,
        "🚫 已禁止开单",
        "风控生效：已拦截下单请求并伪造成功回包"
    );

    // 2. 构造响应头 (确保 App 识别为 JSON)
    const headers = {
        "Content-Type": "application/json;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization" // 简单的 CORS 兼容
    };

    // 3. 返回伪造的响应，终止实际网络请求
    $done({
        response: {
            status: 200,
            headers: headers,
            body: JSON.stringify(mockResponseData)
        }
    });

} else {
    // 如果不符合拦截条件，放行请求
    $done({});
}

