import axios from 'axios';
import fs from 'fs';
import { config } from 'dotenv';

// 加载环境变量
config();

// 从.env文件读取token
let accessToken;
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('DIDA365_TOKEN=')) {
            accessToken = line.substring('DIDA365_TOKEN='.length);
            break;
        }
    }
} catch (error) {
    console.error('无法读取.env文件:', error.message);
    process.exit(1);
}

if (!accessToken) {
    console.error('未找到DIDA365_TOKEN，请先运行OAuth认证');
    process.exit(1);
}

console.log('检查滴答清单API token信息...\n');

// 测试API调用，查看响应头
async function checkTokenInfo() {
    try {
        const response = await axios.get('https://api.dida365.com/open/v1/project', {
            headers: {
                'Authorization': accessToken,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API调用成功！');
        console.log('响应状态码:', response.status);
        
        // 检查响应头中是否有token过期信息
        console.log('\n响应头信息:');
        console.log('- Cache-Control:', response.headers['cache-control']);
        console.log('- Expires:', response.headers['expires']);
        console.log('- Authorization:', response.headers['authorization']);
        
        // 检查响应数据
        console.log('\n响应数据示例:');
        if (response.data && response.data.length > 0) {
            console.log('- 项目数量:', response.data.length);
            console.log('- 第一个项目ID:', response.data[0].id);
            console.log('- 第一个项目名称:', response.data[0].name);
        }
        
    } catch (error) {
        console.error('API调用失败:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('错误详情:', error.response.data);
            console.error('响应头:', error.response.headers);
        }
    }
}

// 尝试解析token本身（JWT格式）
function parseToken() {
    try {
        // 移除Bearer前缀
        const token = accessToken.replace('Bearer ', '');
        
        // JWT由三部分组成，用点分隔
        const parts = token.split('.');
        
        if (parts.length !== 3) {
            console.log('Token不是标准JWT格式');
            return;
        }
        
        // 解码payload部分（中间部分）
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        console.log('\nToken解析结果:');
        console.log('- 发行者:', payload.iss);
        console.log('- 主题:', payload.sub);
        console.log('- 签发时间:', payload.iat ? new Date(payload.iat * 1000).toLocaleString() : '未提供');
        console.log('- 过期时间:', payload.exp ? new Date(payload.exp * 1000).toLocaleString() : '未提供');
        
        if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            const timeToExpiry = payload.exp - now;
            
            if (timeToExpiry > 0) {
                const hours = Math.floor(timeToExpiry / 3600);
                const minutes = Math.floor((timeToExpiry % 3600) / 60);
                console.log(`- 剩余有效时间: ${hours}小时${minutes}分钟`);
            } else {
                console.log('- Token已过期');
            }
        }
        
        console.log('- 其他信息:', JSON.stringify(payload, null, 2));
        
    } catch (error) {
        console.error('Token解析失败:', error.message);
    }
}

// 执行检查
parseToken();
checkTokenInfo();