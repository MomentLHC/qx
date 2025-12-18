/*
 *
[rewrite_local]
^https?:\/\/api\.itingnao\.com\/api\/user\/info url  script-response-body https://raw.githubusercontent.com/你的路径/itingnao.js

[mitm]
hostname = api.itingnao.com
*
*/

var body = $response.body;
var obj = JSON.parse(body);

if (obj.data) {
    // 1. 修改基础会员标识
    obj.data.is_vip = 1;
    obj.data.is_life_vip = true;
    obj.data.nick_name = "IMPWELL";

    // 2. 修改具体会员权益详情
    if (obj.data.maximum_equity_vip) {
        obj.data.maximum_equity_vip.vip_id = 1;
        obj.data.maximum_equity_vip.vip_level = 1;
        obj.data.maximum_equity_vip.name = "终身超级会员";
        obj.data.maximum_equity_vip.expiration_time_str = "2099-09-09 09:09:09";
        obj.data.maximum_equity_vip.expiration_time = 4092512949; // 对应 2099 年时间戳
    }

    // 3. 修改特权限制 (ai次数、存储空间等)
    if (obj.data.privilege) {
        obj.data.privilege.ai_word = 999999;
        obj.data.privilege.text_to_voice = 999999;
        obj.data.privilege.total_size = 1073741824; // 增加空间
    }
}

$done({body: JSON.stringify(obj)});
