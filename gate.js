/*
[rewrite_local]
^https:\/\/app\.(smartappnet|studiotv|csrqoa|zudanje)\.(net|com)\/apim\/v3.* url script-request-header https://raw.githubusercontent.com/momentLHC/qx/main/gate.js

[mitm]
hostname = app.smartappnet.net,app.studiotv.net,app.csrqoa.com,app.zudanje.com
*/

const scriptName = "开单提醒";
const url = $request.url;

// --- 配置区域 ---
// 冷却时间，单位毫秒。这里设为 5 分钟 (5 * 60 * 1000)
// 意味着 5 分钟内最多只提醒一次
const COOLDOWN_TIME = 5 * 60 * 1000; 
// 存储 Key，保持唯一性
const STORE_KEY = "GATE_NOTIFY_LAST_TIME"; 

const targetPaths = [
    "futures/usdt/orders",      
    "futures/usdt/accounts",
];

let isMatch = false;
let matchedPath = "";

for (let path of targetPaths) {
    if (url.indexOf(path) !== -1) {
        isMatch = true;
        matchedPath = path;
        break;
    }
}

if (isMatch) {
    // 获取当前时间戳
    const now = Date.now();
    // 读取上一次通知的时间（如果没有记录则默认为 0）
    const lastNotifyTime = $persistentStore.read(STORE_KEY) || 0;

    // 判断：如果 (当前时间 - 上次时间) 大于 冷却时间，才发送通知
    if (now - Number(lastNotifyTime) > COOLDOWN_TIME) {
        console.log(`[${scriptName}] 匹配路径: ${matchedPath}，发送通知`);
        
        $notification.post(scriptName, '计划、风控、情绪', '请勿随意开单');
        
        // 更新本次通知时间到存储中
        $persistentStore.write(now.toString(), STORE_KEY);
    } else {
        console.log(`[${scriptName}] 匹配路径，但处于冷却期，跳过通知`);
    }
}

$done({});
