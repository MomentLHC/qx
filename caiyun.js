
/*
 *
 *
脚本功能：彩云天气
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************

====================================
[rewrite_local]
# 普通版广告
^https:\/\/ad\.cyapi\.cn\/v2\/req\?app_name=weather url reject-dict
# 赏叶赏花
^https:\/\/wrapper\.cyapi\.cn\/v1\/activity\?app_name=weather url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/main/caiyun.js

^https:\/\/biz\.cyapi\.cn\/v2\/user url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/main/caiyun.js

# 卫星云图 48小时预报
^https:\/\/wrapper\.cyapi\.cn\/v1\/(satellite|nafp\/origin_images) url script-request-header https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/main/caiyun.js

[mitm]
hostname = *.cyapi.cn
====================================
 *
 *
 */


// 定义一个空对象来存储最终的处理结果
var responseObject = {};

// 获取当前请求的 URL
var requestUrl = $request['url'];

// 检查 URL 是否包含特定路径（通过正则匹配）
if (requestUrl.includes('some/specific/endpoint')) {
  // 解析响应数据为 JSON 对象
  let responseJson = JSON.parse($response['body']);

  // 修改 JSON 数据中的字段值
  responseJson['userInfo']['isPremium'] = true; // 设置用户为高级会员
  responseJson['userInfo']['expireTime'] = 2034567890; // 修改过期时间为未来某个时间戳
  responseJson['userInfo']['status'] = 'active'; // 修改状态为 active
  responseJson['userInfo']['plan'] = 'premium'; // 修改计划为 premium

  // 将修改后的 JSON 数据转换回字符串并存入响应对象
  responseObject['body'] = JSON.stringify(responseJson);
}

// 针对另一个 URL 路径的特殊处理
if (/v1\/(satellite|nafp\/origin_images)/g.test(requestUrl)) {
  responseObject['body'] = $request['body']; // 保留原始请求体
  responseObject['headers'] = { 'Content-Type': 'application/json' }; // 修改请求头
}

// 针对特定路径，直接替换响应体内容
if (requestUrl.includes('another/specific/endpoint')) {
  let modifiedResponseBody = $response['body'];
  modifiedResponseBody = 'New static response content'; // 替换为静态内容
  responseObject['body'] = modifiedResponseBody;
}

// 完成处理并返回修改后的结果
$done(responseObject);
