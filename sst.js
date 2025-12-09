[rewrite_local]
# > shuashuati
^https?:\/\/api\.butingxue\.net\/ppxue\/user\/app\/login.* url  script-response-body https://raw.githubusercontent.com/MomentLHC/qx/ml/sst.js

[mitm]
hostname = api.butingxue.net
/*
脚本逻辑：
1. 获取原始响应体。
2. 仅修改 state (状态) 和 vipToTime (时间)。
3. 保留 token, serviceUrl 等动态字段，防止 App 校验失败。
*/

var body = $response.body;
var url = $request.url;

try {
    var obj = JSON.parse(body);

    if (obj.data) {
        // ---------------- 核心破解逻辑 ----------------
        
        // 1. 修改 VIP 状态码
        // 原始是 -1 (int)，修改为 2 (int)，注意类型不要用字符串
        obj.data.state = 2; 

        // 2. 修改过期时间 (2099年)
        obj.data.vipToTimeStr = "2099-09-09 09:09:09";
        obj.data.vipToTime = "Wed Sep 09 09:09:09 CST 2099";

        // 3. 修改金币/豆 (可选，数字类型)
        obj.data.totalCoin = "99999"; 
        obj.data.userDou = "9999";
        
        // 4. 修改显示信息 (可选)
        obj.data.nickName = "Luis_VIP_2099";
        
        // 5. 强制不需要手机号 (防止弹窗)
        obj.data.needPhoneNumber = false;
        
        // --------------------------------------------
        
        console.log("皮皮学脚本执行成功：状态已改为 2，时间已延长");
    } else {
        console.log("皮皮学脚本执行警告：未找到 obj.data 字段");
    }

    $done({body: JSON.stringify(obj)});

} catch (e) {
    // 如果脚本报错，打印日志并返回原始数据，防止 App 崩溃
    console.log("皮皮学脚本错误: " + e);
    $done({});
}
