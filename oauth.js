import http from 'http';
import { URL } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

// 加载环境变量
dotenv.config();

// 从.env文件直接读取凭据
let clientId, clientSecret, redirectUri;
const port = 38000;

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('DIDA_CLIENT_ID=')) {
            clientId = line.substring('DIDA_CLIENT_ID='.length);
        } else if (line.startsWith('DIDA_CLIENT_SECRET=')) {
            clientSecret = line.substring('DIDA_CLIENT_SECRET='.length);
        } else if (line.startsWith('DIDA_REDIRECT_URI=')) {
            redirectUri = line.substring('DIDA_REDIRECT_URI='.length);
        }
    }
} catch (error) {
    console.error('无法读取.env文件:', error.message);
    // 回退到环境变量
    clientId = process.env.DIDA_CLIENT_ID;
    clientSecret = process.env.DIDA_CLIENT_SECRET;
    redirectUri = process.env.DIDA_REDIRECT_URI;
}

// 如果没有重定向URI，使用默认值
if (!redirectUri) {
    redirectUri = `http://localhost:${port}/callback`;
}

if (!clientId || !clientSecret) {
    console.error('错误: 缺少OAuth配置。请确保.env文件中包含DIDA_CLIENT_ID和DIDA_CLIENT_SECRET。');
    process.exit(1);
}

console.log('调试信息:');
console.log(`- Client ID: ${clientId}`);
console.log(`- Redirect URI: ${redirectUri}`);
console.log(`- 端口: ${port}`);

// 生成授权URL - 使用正确的官方端点
const authUrl = `https://dida365.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=tasks:read%20tasks:write&state=state123`;

console.log('请在浏览器中打开以下URL进行授权:');
console.log(authUrl);
console.log(`\n授权完成后，系统将在 http://localhost:${port}/callback 接收回调...`);

// 创建临时服务器处理回调
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    
    if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.searchParams.get('code');
        const state = parsedUrl.searchParams.get('state');
        
        console.log(`收到回调: code=${code}, state=${state}`);
        
        if (code) {
            try {
                console.log('\n正在使用授权码交换访问令牌...');
                console.log(`授权码: ${code}`);
                console.log(`状态: ${state}`);
                
                // 调试：打印完整的client_id和client_secret（隐藏部分内容）
                console.log(`使用Client ID: ${clientId}`);
                console.log(`使用Client Secret: ${clientSecret.substring(0, 5)}...`);
                
                // 创建Basic Auth凭证 - 确保正确编码，处理特殊字符
                const authString = `${clientId}:${clientSecret}`;
                // 使用URL编码处理特殊字符，然后再进行Base64编码
                const encodedAuthString = encodeURIComponent(authString);
                const authCredentials = Buffer.from(authString).toString('base64');
                console.log(`原始认证字符串长度: ${authString.length}`);
                console.log(`认证字符串预览: ${authString.substring(0, 10)}...`);
                console.log(`Base64编码后长度: ${authCredentials.length}`);
                console.log(`Base64编码预览: ${authCredentials.substring(0, 20)}...`);
                
                // 使用授权码交换访问令牌 - 按照官方文档要求，包含所有必需参数
                const tokenResponse = await axios.post(
                    'https://dida365.com/oauth/token',
                    new URLSearchParams({
                        code: code,
                        grant_type: 'authorization_code',
                        scope: 'tasks:read tasks:write',
                        redirect_uri: redirectUri
                    }).toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Basic ${authCredentials}`,
                            'Accept': 'application/json',
                            'User-Agent': 'Dida365-MCP-Server/1.0'
                        },
                        timeout: 10000,
                        // 详细日志
                        validateStatus: (status) => true
                    }
                );
                
                console.log(`令牌请求状态码: ${tokenResponse.status}`);
                console.log('令牌响应数据:', tokenResponse.data);
                
                if (tokenResponse.status === 200 && tokenResponse.data.access_token) {
                    const accessToken = tokenResponse.data.access_token;
                    console.log('\n授权成功！');
                    console.log(`获取到访问令牌: ${accessToken}`);
                    
                    // 更新.env文件中的DIDA365_TOKEN
                    let envContent = fs.readFileSync('.env', 'utf8');
                    if (/DIDA365_TOKEN=/.test(envContent)) {
                        envContent = envContent.replace(
                            /DIDA365_TOKEN=.*/,
                            `DIDA365_TOKEN=Bearer ${accessToken}`
                        );
                    } else {
                        envContent += `\nDIDA365_TOKEN=Bearer ${accessToken}`;
                    }
                    fs.writeFileSync('.env', envContent);
                    console.log('已更新.env文件中的DIDA365_TOKEN');
                    
                    // 返回成功页面
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>授权成功</title>
                        </head>
                            <body>
                                <h1>授权成功！</h1>
                                <p>访问令牌已获取并保存到.env文件中。</p>
                                <p>您可以关闭此页面并继续下一步操作。</p>
                            </body>
                        </html>
                    `);
                    
                    // 3秒后关闭服务器
                    setTimeout(() => {
                        console.log('\n服务器将在3秒后关闭...');
                        server.close(() => {
                            console.log('服务器已关闭。您可以运行 node src/index.ts 来启动服务。');
                        });
                    }, 3000);
                } else {
                    throw new Error(`令牌请求失败，状态码: ${tokenResponse.status}, 响应: ${JSON.stringify(tokenResponse.data)}`);
                }
            } catch (error) {
                console.error('获取访问令牌失败:', error.response ? JSON.stringify(error.response.data) : error.message);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>授权失败</title>
                    </head>
                        <body>
                            <h1>授权失败！</h1>
                            <p>请检查控制台错误信息并重试。</p>
                            <p>错误详情: ${error.response ? JSON.stringify(error.response.data) : error.message}</p>
                            <p>请确认client_id和client_secret是否正确，以及是否有权限访问API。</p>
                        </body>
                    </html>
                `);
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>授权失败</title>
                </head>
                    <body>
                        <h1>授权失败！</h1>
                        <p>未收到授权码。</p>
                    </body>
                </html>
            `);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// 启动服务器
server.listen(port, () => {
    console.log(`回调服务器已启动，监听端口 ${port}`);
});

// 处理服务器错误
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`错误: 端口 ${port} 已被占用。请关闭其他使用该端口的应用后重试。`);
    } else {
        console.error('服务器启动失败:', error);
    }
    process.exit(1);
});