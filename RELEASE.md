# 发布说明

## 版本 1.0.6

### 发布日期
2024年10月30日

### 新功能
- 完整的任务和项目管理功能
- OAuth认证支持
- 安全的API访问
- 完善的错误处理
- 环境变量配置支持

### 改进
- 优化API请求性能
- 增强代码可读性和维护性
- 完善文档和注释

### 修复
- 修复令牌刷新机制
- 修复日期处理问题
- 修复错误处理逻辑

### 安装说明
1. 从GitHub克隆仓库：
   ```bash
   git clone https://github.com/vcve/dida365-mcp-server-enhanced.git
   cd dida365-mcp-server-enhanced
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建项目：
   ```bash
   npm run build
   ```

4. 配置环境变量：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入您的滴答清单API凭据
   ```

5. 运行服务器：
   ```bash
   npm start
   ```

### 配置说明
您需要设置以下环境变量：
- `DIDA365_ACCESS_TOKEN`: 您的滴答清单访问令牌
- `DIDA365_CLIENT_ID`: OAuth客户端ID（可选）
- `DIDA365_CLIENT_SECRET`: OAuth客户端密钥（可选）
- `DIDA365_REDIRECT_URI`: OAuth重定向URI（可选）

### 使用方法
1. 在Claude Desktop中配置MCP服务器
2. 添加以下配置到您的Claude Desktop配置文件：
   ```json
   {
     "mcpServers": {
       "dida365": {
         "command": "node",
         "args": ["/path/to/dida365-mcp-server-enhanced/dist/index.js"]
       }
     }
   }
   ```

### 故障排除
- 如果遇到认证问题，请检查您的API令牌是否正确
- 如果遇到网络问题，请确保您的网络连接正常
- 如果遇到其他问题，请查看日志文件或提交issue

### 支持与反馈
如果您遇到任何问题或有任何建议，请：
1. 查看现有的Issues
2. 创建新的Issue
3. 发送邮件至：vcve@hotmail.com