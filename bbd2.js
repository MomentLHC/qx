/*
 *
 *
脚本功能：百度网盘 _在线倍速播放,在线播放清晰度,后台播放,字幕,听。
更新时间：2025年
问题反馈：
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
# >百度网盘
^https?:\/\/pan.baidu.com.+(rest\/.+\/membership\/user|api\/user\/getinfo|act\/v2\/welfare\/list|api\/taskscore\/tasklist)\? url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/ml/bbd2.js

[mitm] 
hostname = pan.baidu.com

*
*
*/





// 响应体内容
var responseBody = $response.body;
// 请求的 URL
var requestUrl = $request.url;

// 判断响应体是否是字符串
if (typeof responseBody === 'string') {
    // 如果 URL 包含 '/membership/user?'，则对响应体内容进行替换
    if (requestUrl.indexOf('/membership/user?') !== -1) {
        responseBody = responseBody.replace(/.+/g, 
        "{\"currenttime\":1573473597,\"request_id\":7501873289383875000,\"product_infos\":[{\"product_id\":\"5310897792128633390\",\"end_time\":32493834549,\"buy_time\":\"1417260485\",\"cluster\":\"offlinedl\",\"start_time\":1417260485,\"detail_cluster\":\"offlinedl\",\"product_name\":\"gz_telecom_exp\"},{\"product_name\":\"svip2_nd\",\"product_description\":\"超级会员\",\"function_num\":0,\"start_time\":1553702399,\"buy_description\":\"\",\"buy_time\":1417260485,\"product_id\":\"1\",\"auto_upgrade_to_svip\":0,\"end_time\":32493834549,\"cluster\":\"vip\",\"detail_cluster\":\"svip\",\"status\":0}],\"reminder\":{\"reminderWithContent\":[],\"advertiseContent\":[]}}");
    }

    var parsedJson; // 解析后的 JSON 对象
    try {
        // 将响应体字符串解析为 JSON 对象
        parsedJson = JSON.parse(responseBody);

        // 如果 URL 包含 '/user/getinfo?'，则修改 JSON 数据中的用户信息
        if (requestUrl.indexOf('/user/getinfo?') !== -1) {
            parsedJson.records[0].nick_name = 'IMPWELL';
            parsedJson.records[0].priority_name = 'IMPWELL';
            responseBody = JSON.stringify(parsedJson); // 将修改后的 JSON 对象转换为字符串
        }

        // 如果 URL 包含 '/welfare/list?'，则删除 JSON 数据中的 data 字段
        if (requestUrl.indexOf('/welfare/list?') !== -1) {
            delete parsedJson.data;
            responseBody = JSON.stringify(parsedJson);
        }

        // 如果 URL 包含 '/taskscore/tasklist?'，则删除 JSON 数据中的 result 字段
        if (requestUrl.indexOf('/taskscore/tasklist?') !== -1) {
            delete parsedJson.result;
            responseBody = JSON.stringify(parsedJson);
        }
    } catch (error) {
        // 捕获解析 JSON 时的错误，并打印错误信息
        console.log('JSON 解析错误: ' + error.message);
    }
}

// 将修改后的响应体返回
$done({
    'body': responseBody
});
