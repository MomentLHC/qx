/**
 * Gate Futures 下单拦截脚本 (BoxJs + 日志版)
 * Author: momentLHC
 * * 功能：
 * 1. 读取 BoxJs 开关判断是否拦截。
 * 2. 拦截时返回伪造成功数据。
 * 3. 输出调试日志。
 */

const scriptName = "Gate 风控拦单";
const req = $request || {};
const url = req.url || "";
const method = req.method || "";

// BoxJs 变量 Key
const KEY_BLOCK_TRADE = "GATE_BLOCK_TRADE";

// 伪造的响应数据 (保持不变)
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
    "create_time": Date.now() / 1000, // 稍微动态一点，避免太假
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

// ========================
// 逻辑处理
// ========================

// [日志] 1. 打印当前请求，确认脚本是否被触发
// 如果你在日志里看不到这句话，说明正则没匹配上，或者域名没加到 MITM
console.log(`[${scriptName}] 🔍 检测到请求: ${method} ${url}`);

if (
    method === "POST" &&
    url.includes("/futures/usdt/orders") // 稍微放宽匹配，兼容 v3/v4
) {
    // 读取 BoxJs 开关状态 (字符串 "true" 或 "false")
    const switchStatus = $persistentStore.read(KEY_BLOCK_TRADE);
    const isLockEnabled = switchStatus === "true";

    // [日志] 2. 打印开关状态
    console.log(`[${scriptName}] 🔒 拦截开关状态: ${switchStatus} (解析为: ${isLockEnabled})`);

    if (isLockEnabled) {
        // === 执行拦截 ===
        console.log(`[${scriptName}] 🚫 触发风控，正在拦截...`);

        // 发送通知
        $notification.post(
            scriptName,
            "🚫 已禁止开单",
            "当前处于强制风控状态，已拦截下单请求"
        );

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
        // === 放行请求 ===
        console.log(`[${scriptName}] ✅ 开关未开启，放行实际请求...`);
        $done({});
    }

} else {
    // 路径不匹配，直接放行
    // console.log(`[${scriptName}] ⚠️ 非下单接口，跳过`);
    $done({});
}
