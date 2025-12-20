/**
 * Gate 下单拦截器 (交易锁)
 * 功能：读取 BoxJs 开关，若开启则拦截下单请求并返回伪造成功数据。
 * Author: momentLHC
 */

const scriptName = "Gate 交易助手";
const req = $request || {};
const method = req.method || "";
const url = req.url || "";

// BoxJs Key
const KEY_BLOCK_TRADE = "GATE_BLOCK_TRADE"; // 拦截开关

// 辅助函数
function getVal(key) {
    const val = $persistentStore.read(key);
    return val;
}

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
    "create_time": Date.now() / 1000,
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

// 逻辑开始
if (
    method === "POST" &&
    url.includes("/apim/v3/futures/usdt/orders") &&
    !url.includes("/precheck")
) {
    // 读取开关，默认为 "false" (关闭拦截)
    const isLockEnabled = getVal(KEY_BLOCK_TRADE) === "true";

    if (isLockEnabled) {
        // 1. 发送通知
        $notification.post(
            scriptName,
            "🚫 已禁止开单",
            "风控开关已开启，已拦截本次下单请求。"
        );

        // 2. 构造响应头
        const headers = {
            "Content-Type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        };

        // 3. 返回伪造响应 (拦截网络请求)
        $done({
            response: {
                status: 200,
                headers: headers,
                body: JSON.stringify(mockResponseData)
            }
        });
    } else {
        // 开关未开，放行
        $done({});
    }
} else {
    $done({});
}
