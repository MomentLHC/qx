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
^https?:\/\/gs.gateway.gameley.cn\/np-book-user\/user\/refresh\/token url script-response-body https://raw.githubusercontent.com/momentLHC/qx/ml/sgml.js

[mitm]
hostname = gs.gateway.gameley.cn
*
*
*/

let body = $response.body;
let obj = JSON.parse(body);

if (obj?.info) {

  obj.info.user.normalVipBoolean = true;
  obj.info.user.normalVipForever = true;
  obj.info.user.normalVipDt = 4102444799000;

  obj.info.user.adVipBoolean = true;
  obj.info.user.adVipForever = true;
  obj.info.user.adVipDt = 4102444799000;

  obj.info.user.visitVipBoolean = true;
  obj.info.user.visitVipForever = true;
  obj.info.user.visitVipDt = 4102444799000;

  obj.info.user.countImg = 9999;
  obj.info.user.countImgTotal = 9999;
  obj.info.user.countImgAuto = 9999;
  obj.info.user.countImgAutoTotal = 9999;
  obj.info.user.countReportTotal = 9999;
}

$done({ body: JSON.stringify(obj) });