/*
* Surge Script Config:
* [Panel]
* AI 交易分析 = script-name=ai-analysis, title="AI 交易分析", content="请点击运行", update-interval=1
* * [Script]
* ai-analysis = type=generic, timeout=60, script-path=ai_analysis.js
*/

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImlraWtpayIsInJvbGUiOjAsImlhdCI6MTc2NTczMjM5MiwiZXhwIjoxNzY2MzM3MTkyfQ.pLMjE919nl9m8LY96kaOFWfc7lTe5vHHlVL5fC--Fmo";
const API_BASE = "http://api.xiaokai.icu/:4004/api/hangqing"; // 注意：修正了端口前的斜杠

(async () => {
    const html = renderPageSkeleton();
    $done({
        response: {
            status: 200,
            headers: { 
                "Content-Type": "text/html;charset=UTF-8",
                "Cache-Control": "no-store"
            },
            body: html
        }
    });
})();

function renderPageSkeleton() {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <title>AI 策略分析</title>
        <style>
            :root {
                --page-bg: #f5f7fa;
                --header-bg: #ffffff;
                --card-bg: #ffffff;
                --primary-color: #7048e8;
                --text-main: #1a1a1a;
                --text-sub: #8c8c8c;
                --border-color: #e1e4e8;
            }
            
            body { 
                background-color: var(--page-bg); 
                color: var(--text-main); 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                padding-bottom: 40px;
                -webkit-tap-highlight-color: transparent;
            }

            /* 头部 */
            .app-header { 
                background: var(--header-bg); 
                padding: calc(12px + env(safe-area-inset-top)) 20px 15px 20px; 
                position: sticky; top: 0; z-index: 100; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                display: flex; justify-content: space-between; align-items: center;
            }
            .app-title { font-size: 20px; font-weight: 800; color: #000; display: flex; align-items: center; gap: 8px;}
            
            /* 卡片通用样式 */
            .card { 
                background: var(--card-bg); border-radius: 16px; padding: 20px; margin: 15px 20px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02);
            }

            /* 表单样式 */
            .form-group { margin-bottom: 15px; }
            .form-label { display: block; font-size: 12px; color: var(--text-sub); margin-bottom: 6px; font-weight: 600; }
            .form-input, .form-select { 
                width: 100%; box-sizing: border-box; padding: 12px; border-radius: 10px; 
                border: 1px solid var(--border-color); font-size: 16px; background: #fff;
                appearance: none; -webkit-appearance: none;
            }
            .form-row { display: flex; gap: 15px; }
            .form-col { flex: 1; }

            /* 按钮 */
            .btn-main {
                width: 100%; background: var(--primary-color); color: white; border: none;
                padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 700;
                cursor: pointer; transition: opacity 0.2s; margin-top: 10px;
                display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .btn-main:active { opacity: 0.8; }
            .btn-main:disabled { background: #ccc; cursor: not-allowed; }

            /* 结果显示区 */
            .result-area { min-height: 100px; display: none; }
            .result-content { 
                white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333; 
                font-family: 'Monaco', 'Courier New', monospace;
            }
            
            /* 状态日志 */
            .status-log { font-size: 12px; color: var(--text-sub); text-align: center; margin-top: 10px; height: 20px; }

            /* 加载动画 */
            .loader {
                border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 2px solid white;
                width: 16px; height: 16px; animation: spin 0.8s linear infinite; display: none;
            }
            .btn-main.loading .loader { display: block; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        </style>
    </head>
    <body>
        <div class="app-header">
            <div class="app-title">
                <span style="font-size:24px">🧠</span> AI 策略分析
            </div>
        </div>

        <div class="card">
            <div class="form-group">
                <label class="form-label">币种 (Symbol)</label>
                <input type="text" id="symbol" class="form-input" value="BTC" placeholder="例如 BTC, ETH" oninput="this.value = this.value.toUpperCase()">
            </div>
            
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="form-label">周期 (Interval)</label>
                        <select id="interval" class="form-select">
                            <option value="1m">1m</option>
                            <option value="5m" selected>5m</option>
                            <option value="15m">15m</option>
                            <option value="30m">30m</option>
                            <option value="1h">1h</option>
                            <option value="4h">4h</option>
                            <option value="1d">1d</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="form-label">K线根数 (Limit)</label>
                        <input type="number" id="limit" class="form-input" value="200">
                    </div>
                </div>
            </div>

            <button id="startBtn" class="btn-main" onclick="runWorkflow()">
                <div class="loader"></div>
                <span id="btnText">开始 AI 分析</span>
            </button>
            <div id="statusLog" class="status-log"></div>
        </div>

        <div class="card result-area" id="resultCard">
            <div style="font-weight:700; margin-bottom:10px; color:var(--primary-color);">分析报告</div>
            <div id="resultContent" class="result-content"></div>
        </div>

        <script>
            const API_RUN = "${API_BASE}/run_workflow";
            const API_RESULT = "${API_BASE}/get_result/";
            const AUTH_TOKEN = "${TOKEN}";

            let isProcessing = false;

            async function runWorkflow() {
                if (isProcessing) return;
                
                const symbol = document.getElementById('symbol').value;
                const interval = document.getElementById('interval').value;
                const limit = parseInt(document.getElementById('limit').value);

                if (!symbol) return showStatus("请输入币种", true);

                setLoading(true);
                clearResult();
                showStatus("正在初始化 AI 引擎...");

                try {
                    // 1. 发起请求
                    const response = await fetch(API_RUN, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'token': AUTH_TOKEN
                        },
                        body: JSON.stringify({
                            limit: limit,
                            interval: interval,
                            symbol: symbol.toLowerCase()
                        })
                    });

                    if (!response.ok) throw new Error("API 请求失败: " + response.status);
                    
                    const resJson = await response.json();
                    
                    if (resJson.code !== 0) throw new Error(resJson.message || "未知错误");

                    const uuid = resJson.data.uuid;
                    showStatus("任务已提交，正在分析中 (UUID: " + uuid.substring(0,6) + "...)");
                    
                    // 2. 开始轮询结果
                    await pollResult(uuid);

                } catch (err) {
                    console.error(err);
                    showStatus("错误: " + err.message, true);
                    setLoading(false);
                }
            }

            // 轮询函数
            async function pollResult(uuid) {
                let attempts = 0;
                const maxAttempts = 30; // 最多尝试30次 (约60秒)

                const timer = setInterval(async () => {
                    attempts++;
                    try {
                        const res = await fetch(API_RESULT + uuid, {
                            method: 'GET',
                            headers: { 'token': AUTH_TOKEN }
                        });
                        
                        const data = await res.json();
                        
                        if (data.data && data.data.status === 'completed') {
                            clearInterval(timer);
                            showResult(data.data.result);
                            showStatus("分析完成 ✅");
                            setLoading(false);
                        } else {
                            showStatus(\`AI 正在思考中... (\${attempts}s)\`);
                        }

                        if (attempts >= maxAttempts) {
                            clearInterval(timer);
                            showStatus("请求超时，请重试", true);
                            setLoading(false);
                        }
                    } catch (e) {
                        // 网络波动，继续尝试
                        console.log("Polling error:", e);
                    }
                }, 2000); // 每2秒查询一次
            }

            function setLoading(loading) {
                isProcessing = loading;
                const btn = document.getElementById('startBtn');
                const btnText = document.getElementById('btnText');
                if (loading) {
                    btn.classList.add('loading');
                    btnText.innerText = "分析中...";
                    btn.disabled = true;
                } else {
                    btn.classList.remove('loading');
                    btnText.innerText = "开始 AI 分析";
                    btn.disabled = false;
                }
            }

            function showStatus(msg, isError = false) {
                const el = document.getElementById('statusLog');
                el.style.color = isError ? '#f85149' : '#8c8c8c';
                el.innerText = msg;
            }

            function showResult(text) {
                const card = document.getElementById('resultCard');
                const content = document.getElementById('resultContent');
                card.style.display = 'block';
                content.innerText = text;
                // 简单滚动到底部
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }

            function clearResult() {
                document.getElementById('resultCard').style.display = 'none';
                document.getElementById('resultContent').innerText = '';
            }
        </script>
    </body>
    </html>
    `;
}
