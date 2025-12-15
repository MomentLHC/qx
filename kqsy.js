/*
 *
 *

[rewrite_local]
# >酷雀水印管家+酷雀水印相机 会员
^https?:\/\/front-gw.kuque.com\/productAuthorizeService\/user\/auth\/query\/allAuthSimple url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/kqsy.js


[mitm]
hostname = front-gw.kuque.com

*
*
*/


let body = JSON.parse($response.body);

if (body.data) {
    // 强制写入VIP策略数据
    body.data.strategies = [
      {
        "status" : 4,
        "strategyName" : "LuckPik_App订阅",
        "businessType" : "luckpik_auth",
        "strategyCode" : "ksKlVezXF",
        "expireTime" : "32493834549000",
        "businessCode" : "luckpik_ai_vip"
      }
    ];

    // 强制写入VIP总览数据
    body.data.total = {
      "status" : 4,
      "auths" : [
        {
          "totalNumber" : 0,
          "type" : "device_use_number",
          "description" : "同时设备登录数--同时设备使用数",
          "unit" : "台"
        },
        {
          "totalNumber" : 168,
          "type" : "effective_time",
          "description" : "有效期",
          "unit" : "小时"
        }
      ],
      "businessType" : "luckpik_auth",
      "expireTime" : "32493834549000"
    };
}

$done({ body: JSON.stringify(body) });