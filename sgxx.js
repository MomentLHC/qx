/*
 *
 *
[rewrite_local]
# > 趣乐转谱 (EditScore)
^https?:\/\/editscore-api\.quthing\.com\/rolls\/score\/(limit|query) url script-response-body https://raw.githubusercontent.com/MomentLHC/qx/ml/lyzp.js


[mitm]
hostname = editscore-api.quthing.com
*
*
*/
