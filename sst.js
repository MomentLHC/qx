[rewrite_local]
# > shuashuati
^https?:\/\/api\.butingxue\.net\/ppxue\/user\/app\/login url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/ml/sst.js

[mitm]
hostname = api.butingxue.net


var body = $response.body || "{}";
var obj = {};

try {
    // 尝试解析原始数据，为了拿到你真实的 Token 和 UserID
    var originalObj = JSON.parse(body);
} catch (e) {
    var originalObj = {};
}

// 提取原始 Token 和 ID，如果提取不到（比如服务器挂了），才使用备用的假数据
// 这样可以保证你的登录状态是真实的，不会因为 Token 验证失败而无法加载内容
var userToken = (originalObj.data && originalObj.data.token) ? originalObj.data.token : "eyJhbGciOiJIUzUxMiJ9.e30.fake_token_fallback";
var userId = (originalObj.data && originalObj.data.sstUserId) ? originalObj.data.sstUserId : "SST88888888";

// 构建完美的 VIP 响应体
obj = {
  "code" : 10000,
  "message" : "成功",
  "state" : "ok",
  "data" : {
    "serviceUrl" : "https://app.pipixue.com",
    "sstUserId" : userId,             // 使用真实的 ID
    "nickName" : "Luis_VIP",
    "province" : null,
    "language" : null,
    "country" : null,
    "totalCoin" : "99999",
    "learnCoin" : 99999,
    "vipToTimeStr" : "2099-09-09 09:09:09", // 修改时间
    "userDou" : "9999",
    "needPhoneNumber" : false,
    "first" : 0,
    "avatarUrl" : "https://cdn.butingxue.net/app/userheader.png",
    "city" : null,
    "homePage" : 0,
    "ai" : 3,
    "balance" : "¥9999",
    "state" : 2,                      // 你发现的正确状态码
    "gender" : null,
    "token" : userToken,              // 关键：使用真实的 Token
    "uid" : null,
    "wrongNum" : "0",
    "shuaCoin" : "0",
    "qq" : "888888",
    "followNum" : "0",
    "phoneNumber" : 1,
    "vipToTime" : "Wed Sep 09 09:09:09 CST 2099" // 修改时间
  }
};

$done({body: JSON.stringify(obj)});
