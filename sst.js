[rewrite_local]
# > shuashuati
^https?:\/\/api\.butingxue\.net\/ppxue\/user\/app\/login url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/new/ml/sst.js

[mitm]
hostname = api.butingxue.net


var body = $response.body;
var obj = JSON.parse(body);

if (obj.data) {
    // 固定设置为 2099 年 9 月 9 日
    obj.data.vipToTimeStr = "2099-09-09 09:09:09";
    
    // 对应 Java Date.toString() 格式: Wed Sep 09 09:09:09 CST 2099
    obj.data.vipToTime = "Wed Sep 09 09:09:09 CST 2099";
    
    // 附加修改：昵称和状态
    obj.data.nickName = "Luis";
    obj.data.state = 1;
}

$done({body: JSON.stringify(obj)});
