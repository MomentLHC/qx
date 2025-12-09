/*
*
*
[rewrite_local]
# > 趣乐转谱 (EditScore) 功能配置/创作者模式
^https?:\/\/editscore-api\.quthing\.com\/user\/config url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/ml/lyte.js

[mitm]
hostname = editscore-api.quthing.com
*
*
*/

var body = $response.body;
var obj = JSON.parse(body);

if (obj.data) {

    
    // 关键：将“普通用户”修改为“制谱师/创作者”
    // 这通常能解锁高级功能，甚至可能绕过部分会员时间限制
    obj.data.scoreCreator = true; 
}

$done({body: JSON.stringify(obj)});
