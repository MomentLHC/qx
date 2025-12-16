/*
[rewrite_local]
^https:\/\/app\.(smartappnet|studiotv)\.net\/apim\/v3.* url script-request-header https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net
*/


const scriptName = "SmartApp 捕获提醒";
const url = $request.url;

// 这里是你要求监控的路径关键词
// 只需要填入 URL 中具有辨识度的部分即可
const targetPaths = [
    "futures/usdt/orders",         // 对应 v3/futures/usdt/orders
    "copy/api/leader/risk_tips",   // 对应 v3/copy/api/leader/risk_tips
    "user_favorites/markets",      // 对应 v3/user_favorites/markets
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
    console.log(`[${scriptName}] 捕获成功!`);
    console.log(`匹配路径: ${matchedPath}`);
    console.log(`完整URL: ${url}`);

    // 发送通知
    // 标题: 脚本名称
    // 副标题: 显示匹配到了哪一段路径
    // 内容: 提示用户去日志查看完整链接
    $notification.post(scriptName, `🎯 命中: ...${matchedPath}`);
    //$notify(scriptName, `🎯 命中: ...${matchedPath}`, "完整 URL 已记录在脚本日志中");
}

// 结束请求，不影响 App 正常运行
$done({});



        }
    })(name, debug)
}
