/**
 * Surge WebSocket 脚本 - 抓取并打印日志
 */

// 当收到消息（客户端发给服务器，或服务器发给客户端）时触发
function onMessage(context) {
    // 识别来源：是服务器发来的，还是客户端发的
    const direction = context.fromServer ? "服务器 -> 客户端" : "客户端 -> 服务器";
    const message = context.message;

    // 打印到 Surge 的脚本日志中
    console.log(`[WSS 拦截] ${direction}\n内容: ${message}`);

    // 必须调用 $done，否则消息会被拦截，网页会断线
    // 直接返回原消息，不做修改
    $done({ message: message });
}

// 当连接开启时打印（可选）
function onOpen() {
    console.log("[WSS 拦截] 连接已建立");
    $done();
}

// 当连接关闭时打印（可选）
function onClose() {
    console.log("[WSS 拦截] 连接已关闭");
    $done();
}

