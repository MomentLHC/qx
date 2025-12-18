/*
 *
[rewrite_local]
    ^https?:\/\/api\.itingnao\.com\/api\/user\/info url  script-response-body https://raw.githubusercontent.com/momentLHC/qx/main/tn.js

[mitm]
hostname = api.itingnao.com
*
*/
let body = $response.body;
let obj = JSON.parse(body);

if (obj.data) {
    // 1. 基础状态修改
    obj.data.is_vip = 1;
    obj.data.is_life_vip = true;
    obj.data.user_type = 2; // 通常 2 或更高代表付费用户
    obj.data.app_status = 1;
    obj.data.web_status = 1;

    // 2. 修改最高权益信息 (界面显示的核心)
    if (obj.data.maximum_equity_vip) {
        obj.data.maximum_equity_vip.vip_id = 99;
        obj.data.maximum_equity_vip.vip_level = 10;
        obj.data.maximum_equity_vip.name = "终身超级会员";
        obj.data.maximum_equity_vip.is_free = 0;
        obj.data.maximum_equity_vip.expiration_time_str = "2099-09-09 09:09:09";
        obj.data.maximum_equity_vip.expiration_time = 4092512949;
    }

    // 3. 关键：解锁特权额度 (解决功能不能用的核心)
    // 参照你提供的 get 笔记代码，这里要把所有 0 或 小额度 改大
    if (obj.data.privilege) {
        let p = obj.data.privilege;
        p.ai_word = 999999;               // AI 字符数
        p.text_to_voice = 999999;         // 文字转语音
        p.audio_to_voice = 999999;        // 音频转语音
        p.free_audio_total_time = 999999; // 免费时长
        p.total_size = 10737418240;       // 存储空间 (10GB)
        p.used_size = 0;
        // 关键：将所有 overdue (过期) 标识设为 0
        p.text_to_voice_overdue = 0;
        p.audio_to_voice_overdue = 0;
        p.ai_word_overdue = 0;
    }

    // 4. 其他潜在校验字段
    obj.data.total_free_num = 999;
    obj.data.use_free_num = 0;
    obj.data.meal_pay_status = 1; // 支付状态改为已支付
}

$done({body: JSON.stringify(obj)});
