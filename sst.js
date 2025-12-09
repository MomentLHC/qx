[rewrite_local]
# > shuashuati
^https?:\/\/api\.butingxue\.net\/ppxue\/user\/app\/login.* url  script-response-body https://raw.githubusercontent.com/MomentLHC/qx/ml/sst.js

[mitm]
hostname = api.butingxue.net

var body = $response.body || "{}";
var obj = {};

try {
    // 1. 解析原始响应，目的是提取你真实的 Token 和 UserId
    // 这样即使 APP 升级了 Token 校验机制，脚本也能长期有效
    var originalObj = JSON.parse(body);
} catch (e) {
    var originalObj = {};
}

// 提取原始 Token，如果没有则使用备用防错
var userToken = (originalObj.data && originalObj.data.token) ? originalObj.data.token : "eyJhbGciOiJIUzUxMiJ9.e30.fake_token_fallback";
var userId = (originalObj.data && originalObj.data.sstUserId) ? originalObj.data.sstUserId : "SST88888888";

// 2. 构造强制覆盖的 VIP 数据
// 重点：使用提取到的 userToken，但强制修改时间、金额和 State
obj = {
  "code" : 10000,
  "message" : "成功",
  "state" : "ok",
  "data" : {
    "serviceUrl" : "https://app.pipixue.com",
    "sstUserId" : userId,             // 保持真实 ID
    "nickName" : "Luis_VIP",
    "province" : null,
    "language" : null,
    "country" : null,
    "totalCoin" : "99999",
    "learnCoin" : 99999,
    "vipToTimeStr" : "2099-09-09 09:09:09", // 锁定时间
    "userDou" : "9999",
    "needPhoneNumber" : false,
    "first" : 0,
    "avatarUrl" : "https://cdn.butingxue.net/app/userheader.png",
    "city" : null,
    "homePage" : 0,
    "ai" : 3,
    "balance" : "¥9999",
    "state" : 2,                      // 必须是 2 (VIP状态)
    "gender" : null,
    "token" : userToken,              // 必须是真实 Token
    "uid" : null,
    "wrongNum" : "0",
    "shuaCoin" : "0",
    "qq" : "888888",
    "followNum" : "0",
    "phoneNumber" : 1,
    "vipToTime" : "Wed Sep 09 09:09:09 CST 2099" // 锁定时间
  }
};

$done({body: JSON.stringify(obj)});
