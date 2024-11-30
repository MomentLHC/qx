/*
*
*
脚本功能：keep 课程预览 直播课。会员付费课跟练 会员训练计划

[rewrite_local]
# >keep 课程预览 直播课。会员付费课跟练 会员训练计划
^https?:\/\/(api|kit).gotokeep\.com\/(nuocha|gerudo|athena|nuocha\/plans|suit\/v5\/smart|kprime\/v4\/suit\/sales)\/ url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/main/keep.js

[mitm]
hostname = *keep*,162.14.5.*,42.187.199.*,101.42.124.*

*
*
*/
// 定义响应体并通过正则表达式替换特定字段
var modifiedBody = $response['body']
  .replace(/\"memberStatus":\d+/g, '"memberStatus":1') // 设置会员状态为1
  .replace(/\"username":".*?"/g, '"username":"Luis"') // 修改用户名
  .replace(/\"buttonText":".*?"/g, '"buttonText":"会员已解锁"') // 修改按钮文本
  .replace(/\"hasPaid\":\w+/g, '"hasPaid":true') // 设置支付状态为 true
  .replace(/\"downLoadAll\":\w+/g, '"downLoadAll":true') // 设置下载权限为 true
  .replace(/\"videoTime\":\d+/g, '"videoTime":999999') // 修改视频时间为 999999
  .replace(/\"startEnable\":\w+/g, '"startEnable":true') // 设置启动权限为 true
  .replace(/\"memberStatus\":\d+/g, '"memberStatus":1') // 再次设置会员状态为1
  .replace(/\"preview\":\w+/g, '"preview":true') // 设置预览权限为 true
  .replace(/\"errorCode\":\d+/g, '"errorCode":0') // 设置错误码为 0
  .replace(/\"status\":\w+/g, '"status":"active"') // 修改状态为 active
  .replace(/\"member\":\w+/g, '"member":true') // 设置会员标识为 true
  .replace(/\"limitFree\":\w+/g, '"limitFree":true') // 设置免费限制为 true
  .replace(/\"limitCount\":\d/g, '"limitCount":100') // 修改限制计数为 100
  .replace(/\"limitFreeType\":"\w+/g, '"limitFreeType":"premium"') // 修改免费类型为 premium
  .replace(/\"free\":\w+/g, '"free":true') // 设置免费状态为 true
  .replace(/\"userLiveMemberStatus\":\w+/g, '"userLiveMemberStatus":"active"') // 修改直播会员状态
  .replace(/\"canWatchLive\":\w+/g, '"canWatchLive":true') // 设置可以观看直播为 true
  .replace(/\"userMemberAutoRenew\":\w+/g, '"userMemberAutoRenew":true') // 设置自动续费为 true
  .replace(/\"userUseLiveMemberRights\":\w+/g, '"userUseLiveMemberRights":true') // 设置使用直播会员权限为 true
  .replace(/\"userLiveMemberExpireTime\":\d/g, '"userLiveMemberExpireTime":9999999999') // 修改会员到期时间
  .replace(/\":false/g, '":true') // 全局替换 false 为 true
  .replace(/\"code\":\d+/g, '"code":200'); // 设置返回代码为 200

// 构造最终返回对象
var responseObject = {
  body: modifiedBody
};

// 返回修改后的响应体
$done(responseObject);
