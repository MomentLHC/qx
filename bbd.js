
#!name= 百度网盘播放增强（倍速+高清+后台播放）
#!desc= 解锁百度网盘在线倍速播放、高清清晰度、后台播放及字幕功能，仅供学习交流
#!author= ML
#!homepage =
#!icon= 
#!date = 2025-12-07 00:00:00
#===================================
#⚠️【免责声明】
#-----------------------------------
#1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
#2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
#3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
#4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
#5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
#6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
#7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。

[Rule]
DOMAIN, pan.baidu.com, MITM

[Rewrite]
^https?://pan.baidu.com.+(rest/.+/membership/user|api/user/getinfo|act/v2/welfare/list|api/taskscore/tasklist)? url script-response-body baidu-pan-enhance.js

[Script]
http-response ^https?://pan.baidu.com.+(rest/.+/membership/user|api/user/getinfo|act/v2/welfare/list|api/taskscore/tasklist)? script-path=baidu-pan-enhance.js, timeout=60, tag=百度网盘播放增强

[Mitm]
hostname = pan.baidu.com

#===================================

var responseBody = $response.body;
var requestUrl = $request.url;

if (typeof responseBody === 'string') {
// 模拟超级会员信息，解锁会员专属播放权限
if (requestUrl.indexOf('/membership/user?') !== -1) {
responseBody = responseBody.replace(/.+/g,
"{"currenttime":1573473597,"request_id":7501873289383875000,"product_infos":[{"product_id":"5310897792128633390","end_time":32493834549,"buy_time":"1417260485","cluster":"offlinedl","start_time":1417260485,"detail_cluster":"offlinedl","product_name":"gz_telecom_exp"},{"product_name":"svip2_nd","product_description":"超级会员","function_num":0,"start_time":1553702399,"buy_description":"","buy_time":1417260485,"product_id":"1","auto_upgrade_to_svip":0,"end_time":32493834549,"cluster":"vip","detail_cluster":"svip","status":0}],"reminder":{"reminderWithContent":[],"advertiseContent":[]}}");
}

var parsedJson;
try {
parsedJson = JSON.parse(responseBody);

// 自定义用户信息
if (requestUrl.indexOf('/user/getinfo?') !== -1) {
parsedJson.records[0].nick_name = 'ml';
parsedJson.records[0].priority_name = 'ml';
parsedJson.records[0].avatar_url = 'https://zdimg.lifeweek.com.cn/app/20230410/16810960185662892.jpg';
responseBody = JSON.stringify(parsedJson);
}

// 清除福利列表冗余内容
if (requestUrl.indexOf('/welfare/list?') !== -1) {
delete parsedJson.data;
responseBody = JSON.stringify(parsedJson);
}

// 清除任务列表冗余内容
if (requestUrl.indexOf('/taskscore/tasklist?') !== -1) {
delete parsedJson.result;
responseBody = JSON.stringify(parsedJson);
}
} catch (error) {
console.log('百度网盘脚本 JSON 解析错误: ' + error.message);
}
}

$done({
'body': responseBody
});
