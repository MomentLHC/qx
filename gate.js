/*
[rewrite_local]
^https:\/\/app\.(smartappnet|studiotv|csrqoa|zudanje)\.(net|com)\/apim\/v3.* url script-request-header https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com


*/


const scriptName = "开单提醒";
const url = $request.url;

// 这里是你要求监控的路径关键词
// 只需要填入 URL 中具有辨识度的部分即可
const targetPaths = [
    "futures/usdt/orders",        
    "futures/usdt/accounts",
];

let isMatch = false;
let matchedPath = "";

// 遍历检查当前 URL 是否包含上述关键字
for (let path of targetPaths) {
    if (url.indexOf(path) !== -1) {
        isMatch = true;
        matchedPath = path;
        break;
    }
}

if (isMatch) {
    console.log(`匹配路径: ${matchedPath}`);

    // 发送通知
    // 标题: 脚本名称
    // 副标题: 显示匹配到了哪一段路径
    // 内容: 提示用户去日志查看完整链接
    $notification.post(scriptName, '计划、风控、情绪','请勿随意开单');
}

// 结束请求，不影响 App 正常运行
$done({});



