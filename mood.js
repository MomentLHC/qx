/*
 *
[rewrite_local]
# > Moodjiallinone (Moo日记) 会员解锁
^https?:\/\/api\.flowzland\.com\/moodjiallinone\/v1\/updateuserinfo url script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/mood.js

[mitm]
hostname = api.flowzland.com
*
*/

var body = $response.body;
var obj = JSON.parse(body);

if (obj.userInfo) {
    // 1. 核心会员标识改为 true
    obj.userInfo.isPlus = true;
    
    // 2. 参照模板修改状态和昵称
    obj.userInfo.state = 2;
    obj.userInfo.nickname = "IMPWELL";
    
    // 3. 勋章/标识类型修改 (通常 1 为高级用户)
    obj.userInfo.badgeType = 1;
    obj.userInfo.userAvatarFrameVisable = 1;

    // 4. 预防性添加过期时间字段 (部分版本可能隐藏了这些字段，手动注入以防万一)
    obj.userInfo.vipExpireTime = 4092512949; // 2099-09-09
    obj.userInfo.isForeverPlus = true;
}

$done({body: JSON.stringify(obj)});
