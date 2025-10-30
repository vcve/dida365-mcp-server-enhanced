#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const axios = require('axios');

// 配置
const port = 38000;
let clientId, clientSecret, redirectUri;

// 读取环境变量
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
    process.exit(1);
}

// 如果没有重定向URI，使用默认值
if (!redirectUri) {
    redirectUri = `http://localhost:${port}/callback`;
}

if (!clientId || !clientSecret) {
    console.error('错误: 缺少OAuth配置。请确保.env文件中包含DIDA_CLIENT_ID和DIDA_CLIENT_SECRET。');
    process.exit(1);
}

console.log('滴答清单Token刷新工具');
console.log('====================');

// 检查当前token状态
function checkCurrentToken() {
    try {
        const envContent = fs.readFileSync('.env', 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('DIDA365_TOKEN=')) {
                const token = line.substring('DIDA365_TOKEN='.length);
                if (token && token !== 'Bearer ') {
                    console.log('✅ 当前存在token');
                    return true;
                }
            }
        }
        console.log('❌ 当前没有有效的token');
        return false;
    } catch (error) {
        console.log('❌ 无法读取当前token状态');
        return false;
    }
}

// 生成授权URL
const authUrl = `https://dida365.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=tasks:read%20tasks:write&state=refresh_${Date.now()}`;

console.log('\n请在浏览器中打开以下URL进行授权:');
console.log(authUrl);
console.log(`\n授权完成后，系统将在 http://localhost:${port}/callback 接收回调...`);

// 创建临时服务器处理回调
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    
    if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.searchParams.get('code');
        const state = parsedUrl.searchParams.get('state');
        
        console.log(`\n收到回调: code=${code}, state=${state}`);
        
        if (code) {
            try {
                console.log('正在使用授权码交换新的访问令牌...');
                
                // 创建Basic Auth凭证
                const authString = `${clientId}:${clientSecret}`;
                const authCredentials = Buffer.from(authString).toString('base64');
                
                // 使用授权码交换访问令牌
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
                        timeout: 10000
                    }
                );
                
                if (tokenResponse.status === 200 && tokenResponse.data.access_token) {
                    const accessToken = tokenResponse.data.access_token;
                    console.log('✅ 授权成功！');
                    console.log(`获取到新的访问令牌`);
                    
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
                    console.log('✅ 已更新.env文件中的DIDA365_TOKEN');
                    
                    // 返回成功页面
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>Token刷新成功</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                .success { color: green; font-size: 24px; }
                            </style>
                        </head>
                        <body>
                            <div class="success">✅ Token刷新成功！</div>
                            <p>新的访问令牌已获取并保存到.env文件中。</p>
                            <p>您可以关闭此页面并重新启动MCP服务。</p>
                        </body>
                        </html>
                    `);
                    
                    // 3秒后关闭服务器
                    setTimeout(() => {
                        console.log('\n服务器将在3秒后关闭...');
                        server.close(() => {
                            console.log('✅ 服务器已关闭。');
                            console.log('✅ 您现在可以重新启动MCP服务：node src/index.ts');
                            process.exit(0);
                        });
                    }, 3000);
                } else {
                    throw new Error(`令牌请求失败，状态码: ${tokenResponse.status}`);
                }
            } catch (error) {
                console.error('❌ 获取访问令牌失败:', error.response ? error.response.data : error.message);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Token刷新失败</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                .error { color: red; font-size: 24px; }
                            </style>
                        </head>
                        <body>
                            <div class="error">❌ Token刷新失败！</div>
                            <p>请检查控制台错误信息并重试。</p>
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
    console.log(`✅ 回调服务器已启动，监听端口 ${port}`);
    
    // 检查当前token状态
    const hasToken = checkCurrentToken();
    
    if (hasToken) {
        console.log('\n⚠️  注意：这将替换当前的token。如果您确定要刷新，请继续。');
    }
    
    console.log('\n请复制上面的URL到浏览器中进行授权...');
});

// 处理服务器错误
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ 错误: 端口 ${port} 已被占用。请关闭其他使用该端口的应用后重试。`);
    } else {
        console.error('❌ 服务器启动失败:', error);
    }
    process.exit(1);
});