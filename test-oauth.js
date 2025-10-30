import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

// 加载环境变量
dotenv.config();

let clientId, clientSecret;

// 尝试直接读取.env文件
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('DIDA_CLIENT_ID=')) {
            clientId = line.substring('DIDA_CLIENT_ID='.length);
        } else if (line.startsWith('DIDA_CLIENT_SECRET=')) {
            clientSecret = line.substring('DIDA_CLIENT_SECRET='.length);
        }
    }
    
    console.log('从.env文件直接读取:');
    console.log(`Client ID: ${clientId}`);
    console.log(`Client Secret: ${clientSecret}`);
    console.log(`Client Secret 长度: ${clientSecret ? clientSecret.length : 0}`);
} catch (error) {
    console.error('无法读取.env文件:', error.message);
    // 回退到环境变量
    clientId = process.env.DIDA_CLIENT_ID;
    clientSecret = process.env.DIDA_CLIENT_SECRET;
    
    console.log('从环境变量读取:');
    console.log(`Client ID: ${clientId}`);
    console.log(`Client Secret: ${clientSecret}`);
    console.log(`Client Secret 长度: ${clientSecret ? clientSecret.length : 0}`);
}

// 测试Basic Auth编码
const authString = `${clientId}:${clientSecret}`;
const authCredentials = Buffer.from(authString, 'utf8').toString('base64');

console.log('\n认证信息:');
console.log(`完整认证字符串: ${authString}`);
console.log(`完整认证字符串长度: ${authString.length}`);
console.log(`Base64编码后长度: ${authCredentials.length}`);
console.log(`Base64编码: ${authCredentials}`);

// 验证Base64解码
const decoded = Buffer.from(authCredentials, 'base64').toString('utf8');
console.log(`Base64解码验证: ${decoded}`);
console.log(`原始字符串与解码结果匹配: ${authString === decoded ? '是' : '否'}`);

// 尝试直接请求token端点，不使用授权码
console.log('\n尝试直接请求token端点...');

try {
    const response = await axios.post(
        'https://dida365.com/oauth/token',
        new URLSearchParams({
            grant_type: 'client_credentials'
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authCredentials}`,
                'Accept': 'application/json'
            },
            timeout: 10000,
            validateStatus: (status) => true
        }
    );
    
    console.log(`响应状态码: ${response.status}`);
    console.log('响应数据:', response.data);
} catch (error) {
    console.error('请求失败:', error.message);
    if (error.response) {
        console.error(`响应状态码: ${error.response.status}`);
        console.error('响应数据:', error.response.data);
    }
}