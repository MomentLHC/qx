/*
[rewrite_local]
# > 趣乐转谱 (EditScore)
^https?:\/\/editscore-api\.quthing\.com\/rolls\/score\/(limit|query) url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/ml/lyzp.js


[mitm]
hostname = editscore-api.quthing.com

*/

// ---------------- 下面是 JS 脚本内容 ----------------

var body = $response.body;
var url = $request.url;
var obj = JSON.parse(body);

const limitPath = '/rolls/score/limit';
const queryPath = '/rolls/score/query';

// 处理限制接口 (limit)
if (url.indexOf(limitPath) !== -1) {
    if (obj.data) {
        // 修改每月和每日免费次数为 99999
        obj.data.maxMonthlyFreeCount = 99999;
        obj.data.maxDailyFreeCount = 99999;
    }
    body = JSON.stringify(obj);
} 

// 处理查询接口 (query)
if (url.indexOf(queryPath) !== -1) {
    if (obj.data) {
        // 强制开启转换权限
        obj.data.transferable = true;
        
        // 修改各类券的数量为 99999
        obj.data.vipFreeCoupon = 99999;
        obj.data.vipMonthlyFreeCoupon = 99999;
        obj.data.countCoupon = 99999;
        
        // 修改提示文案，不仅为了美观，有时客户端会读取这个字段显示
        obj.data.couponMessage = "破解成功，剩余99999张";
    }
    body = JSON.stringify(obj);
} 

$done({body});
