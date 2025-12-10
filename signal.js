/*
 * 2025.12.10
 * Crypto Signal Dashboard - Lite Speed Version
 * 访问地址: https://signal.hub/
 */


const CSS_URL = "https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/ml/signal.css";
const JS_URL = "https://raw.githubusercontent.com/MomentLHC/qx/refs/heads/ml/app.js";

const API_URL = "http://ai.zhixing.icu:5002/api/frontend-messages?type=signal&limit=200";

(async () => {
    try {
        const url = $request.url;

        if (/^https?:\/\/signal\.hub\/?$/.test(url)) {
            // 1. Surge 只负责请求数据，不做任何解析
            const apiData = await httpGet(API_URL);
            
            // 2. 将数据注入到全局变量 window.SIGNAL_DATA
            // 3. 引入外部 CSS 和 JS，利用浏览器缓存
            const html = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
                <meta name="apple-mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
                <meta name="apple-mobile-web-app-title" content="交易助手">
                <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/144/bullish.png">
                <title>交易助手</title>
                <link rel="stylesheet" href="${CSS_URL}">
            </head>
            <body>
                <div class="app-header">
                    <div class="app-title">交易信号</div>
                    <div class="app-subtitle">所有频道的交易信号汇总</div>
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="搜索币种、作者或内容...">
                        <button class="icon-btn" onclick="window.location.reload()"><svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button>
                    </div>
                    <div class="tabs-container">
                        <div class="tab active">全部 <span class="tab-count">0</span></div>
                        <div class="tab">精选</div>
                        <div class="tab">关注</div>
                    </div>
                </div>

                <div id="app">
                    <div style="text-align:center;padding:50px;color:#888;">加载中...</div>
                </div>
                
                <div class="bottom-nav">
                    <div class="nav-item active">
                        <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg></div>
                        交易信号
                    </div>
                    <div class="nav-item">
                        <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg></div>
                        市场分析
                    </div>
                    <div class="nav-item">
                        <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></div>
                        我的
                    </div>
                </div>

                <script>
                    window.SIGNAL_DATA = ${JSON.stringify(apiData)};
                </script>
                
                <script src="${JS_URL}"></script>
            </body>
            </html>
            `;

            $done({
                response: {
                    status: 200,
                    headers: { "Content-Type": "text/html;charset=UTF-8" },
                    body: html
                }
            });
        } else {
            $done({ response: { status: 404, body: "Not Found" } });
        }

    } catch (err) {
        $done({
            response: {
                status: 500,
                headers: { "Content-Type": "text/html;charset=UTF-8" },
                body: `<h1>Error</h1><p>${err}</p>`
            }
        });
    }
})();

function httpGet(url) {
    return new Promise((resolve, reject) => {
        $httpClient.get(url, (error, response, data) => {
            if (error) reject(error);
            else {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject("JSON Parse Error: " + e);
                }
            }
        });
    });
}
