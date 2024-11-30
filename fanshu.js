
/*
 *
 *
脚本功能：番薯小说阅读器—百万正版小说听书看书神器（解锁会员）
软件版本：2.5.76
下载地址：
脚本作者：
更新时间：2024年
问题反馈：
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
# >番薯小说阅读器—百万正版小说听书看书神器（解锁会员）
^https?:\/\/g20.manmeng168.com\/v1\/client\/user\/completeUserInfo\? url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/main/fanshu.js


[mitm] 
hostname = g20.manmeng168.com

*
*


// 从响应中获取数据体
var responseBody = $response['body'];
// 从请求中获取数据体
var requestBody = $request['url'];
// 定义特定匹配的关键字
const keyword = '/api/v1/resource';

// 定义用于解析的 JSON 对象
var parsedResponse;

try {
  // 尝试将响应的 JSON 数据解析为对象
  parsedResponse = JSON.parse(responseBody);

  // 如果请求 URL 包含特定关键字，则执行修改逻辑
  if (requestBody.indexOf(keyword) !== -1) {
    // 分割逻辑操作步骤为数组
    var steps = 'updateId|setActive|setStatus|updateName|setDescription|stringify'.split('|');
    var stepIndex = 0;

    // 遍历每个逻辑操作
    while (true) {
      switch (steps[stepIndex++]) {
        case 'updateId':
          // 更新 ID 字段
          parsedResponse['data']['id'] = 12345678901234; // 示例 ID
          continue;
        case 'setActive':
          // 设置激活状态为 true
          parsedResponse['data']['active'] = true;
          continue;
        case 'setStatus':
          // 设置状态为 1（示例值）
          parsedResponse['data']['status'] = 1;
          continue;
        case 'updateName':
          // 更新名称字段
          parsedResponse['data']['name'] = 'Updated Name'; // 示例名称
          continue;
        case 'setDescription':
          // 更新描述字段
          parsedResponse['data']['description'] = 'This is an updated description'; // 示例描述
          continue;
        case 'stringify':
          // 将更新后的对象重新转为 JSON 字符串
          responseBody = JSON.stringify(parsedResponse);
          continue;
      }
      break; // 结束循环
    }
  }
} catch (error) {
  // 捕获并记录解析或更新过程中的错误
  console.error('Error processing response: ' + error.message);
}

// 返回修改后的响应数据
$done({
  'body': responseBody
});
