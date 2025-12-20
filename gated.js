#!name=gate
#!desc=Gate 合约风控 + 持仓提醒 + 禁止开单

[Script]
# 1️⃣ 持仓 / 账户数据放大 + 提醒
gate = type=http-response, pattern=^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/(accounts|positions\?holding=true), script-path=https://raw.githubusercontent.com/momentLHC/qx/ml/gate.js, requires-body=true, max-size=-1, timeout=60

# 2️⃣ 🚫 禁止开单（拦截 orders）
gate_block_order = type=http-request, pattern=^https:\/\/(app|m)\.(smartappnet|studiotv|csrqoa|zudanje|bxjddjt)\.(net|com)\/apim\/v3\/futures\/usdt\/orders, script-path=https://raw.githubusercontent.com/momentLHC/qx/ml/gate.js, requires-body=true, timeout=60

[MITM]
hostname = %APPEND% app.smartappnet.net, app.studiotv.net, app.csrqoa.com, app.zudanje.com, app.mbm06.com, m.bxjddjt.com
