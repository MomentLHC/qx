/**
 * 当 WebSocket 连接收到新消息时触发
 */
function onMessage(context) {
    // context.message 是当前收到的消息内容（字符串或 ArrayBuffer）
    let msg = context.message;

    // 1. 打印日志到 Surge 的脚本日志中
    console.log("收到 WS 消息: " + msg);

    // 2. 如果你想修改消息并转发给浏览器
    // if (msg.includes("login")) {
    //    msg = msg.replace("old_value", "new_value");
    // }

    // 必须调用 $done 才能将消息传递下去
    // 如果不传任何参数，表示拦截该消息（不发给客户端/服务端）
    $done({ message: msg });
}

/**
 * 当连接建立时触发（可选）
 */
function onOpen() {
    console.log("WebSocket 连接已开启");
    $done();
}
