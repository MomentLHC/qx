/*
 *
 *
脚本功能：团团记账-自动记账ai聊天记账软件
软件版本：2.6.1
下载地址：
脚本作者：
更新时间：2025
问题反馈：
***************************
[rewrite_local]
# > 团团记账-自动记账ai聊天记账软件
^https?:\/\/gs.gateway.gameley.cn\/np-book-user\/user\/refresh\/token url script-response-body https://raw.githubusercontent.com/momentLHC/qx/mp/sgml.js

[mitm]
hostname = gs.gateway.gameley.cn
*
*
*/

let body = $response.body;
let obj = JSON.parse(body);

if (obj?.user) {

  obj.user.normalVipBoolean = true;
  obj.user.normalVipForever = true;
  obj.user.normalVipDt = 9999999999999;

  obj.user.adVipBoolean = true;
  obj.user.adVipForever = true;
  obj.user.adVipDt = 9999999999999;

  obj.user.visitVipBoolean = true;
  obj.user.visitVipForever = true;
  obj.user.visitVipDt = 9999999999999;

  obj.user.countImg = 9999;
  obj.user.countImgTotal = 9999;
  obj.user.countImgAuto = 9999;
  obj.user.countImgAutoTotal = 9999;
  obj.user.countReportTotal = 9999;
}

$done({ body: JSON.stringify(obj) });