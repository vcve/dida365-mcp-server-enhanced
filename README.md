# 滴答清单 MCP 服务器

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue.svg)](https://spec.modelcontextprotocol.io/)
[![Security](https://img.shields.io/badge/security-important-yellow.svg)](SECURITY.md)

## ⚠️ 安全警告

**重要提示**: 在使用本项目前，请务必阅读并理解以下安全注意事项：

- 🔐 **保护您的API密钥**: 不要在任何公开渠道分享您的 `DIDA_CLIENT_ID`、`DIDA_CLIENT_SECRET` 或 `DIDA365_TOKEN`
- 📁 **安全配置**: 确保 `.env` 文件被正确添加到 `.gitignore` 中，避免意外提交到版本控制系统
- 🔄 **定期轮换密钥**: 建议定期在滴答清单开发者平台轮换您的API密钥
- 🚫 **不要使用示例密钥**: 本项目中所有密钥均为示例值，您必须替换为自己的真实密钥

**安全最佳实践**:
1. 使用环境变量管理敏感信息
2. 为不同的环境使用不同的API密钥
3. 定期审查API使用日志
4. 及时撤销不再使用的密钥

一个功能完整的 Model Context Protocol (MCP) 服务器，用于与滴答清单（TickTick/Dida365）API 进行交互。通过标准化的 MCP 接口，AI 助手可以无缝管理您的任务和项目。

## ✨ 功能特性

- ✅ **完整的任务管理** - 创建、读取、更新、删除任务
- ✅ **项目管理** - 管理项目列表和项目详情
- ✅ **智能任务操作** - 设置优先级、截止日期、完成任务
- ✅ **OAuth 2.0 认证** - 安全的授权流程
- ✅ **Token 管理** - 自动检测和刷新过期 token
- ✅ **TypeScript 支持** - 完整的类型安全和开发体验
- ✅ **错误处理** - 完善的错误处理和用户友好的提示

## 🚀 快速开始

### 前置要求

- Node.js 16.0 或更高版本
- 滴答清单账号
- 支持 MCP 的 AI 助手（如 Claude Desktop）

### 安装方法

#### 方法一：从 npm 安装（推荐）

```bash
npm install dida365-mcp-servers
```

#### 方法二：从源码安装

```bash
# 克隆仓库
git clone https://github.com/your-username/dida365-mcp-servers.git
cd dida365-mcp-servers

# 安装依赖
npm install

# 构建项目
npm run build
```

### 配置 MCP 客户端

#### Claude Desktop 配置

编辑 Claude Desktop 的配置文件（通常位于 `~/Library/Application Support/Claude/claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": [
        "/path/to/dida365-mcp-servers/dist/index.js"
      ],
      "env": {
        "DIDA365_TOKEN": "Bearer your_access_token_here"
      }
    }
  }
}
```

#### 其他 MCP 客户端

请参考您使用的 MCP 客户端的文档，配置方式类似。

## 🔑 获取 API 访问权限

### 首次设置 OAuth 认证

1. **获取 Client ID 和 Secret**
   - 访问 [滴答清单开放平台](https://developer.dida365.com/)
   - 登录您的滴答清单账号
   - 创建新应用，获取 `DIDA_CLIENT_ID` 和 `DIDA_CLIENT_SECRET`

2. **配置环境变量**
   
   项目已提供安全的 `.env` 示例文件，您需要编辑此文件并填入真实的API信息：
   
   编辑 `.env` 文件：
   ```bash
   # 将示例值替换为您的真实API信息
   DIDA_CLIENT_ID=your_client_id_here
   DIDA_CLIENT_SECRET=your_client_secret_here
   DIDA_REDIRECT_URI=http://localhost:38000/callback
   DIDA365_TOKEN=Bearer your_access_token_here
   ```
   
   **重要**: 确保 `.env` 文件已被添加到 `.gitignore` 中，避免意外提交敏感信息。

3. **运行 OAuth 认证**
   ```bash
   node oauth.js
   ```
   
   按照提示在浏览器中完成授权，系统会自动获取并保存访问令牌。

### Token 过期处理

如果 token 过期，可以使用以下工具重新获取：

```bash
# 检查当前 token 状态
node check-token-expiry.js

# 刷新 token
node refresh-token.js
```

## 🛠️ 可用工具

### 任务管理工具

#### `create_task` - 创建新任务
创建带有详细信息的任务。

**参数：**
- `title` (string, 必需) - 任务标题
- `projectId` (string, 必需) - 项目ID
- `content` (string) - 任务详细描述
- `dueDate` (string) - 截止日期（ISO 8601格式）
- `priority` (number) - 优先级（0-5，0为无优先级）

**示例：**
```json
{
  "title": "完成项目报告",
  "projectId": "665b2e11e112e9f6333caab0",
  "content": "撰写项目总结报告并提交",
  "dueDate": "2024-12-31T23:59:59Z",
  "priority": 3
}
```

#### `get_tasks_by_projectId` - 获取项目任务列表
获取指定项目中的所有任务。

**参数：**
- `projectId` (string, 必需) - 项目ID

#### `update_task` - 更新任务
修改现有任务的属性。

**参数：**
- `taskId` (string, 必需) - 任务ID
- `title` (string) - 新标题
- `content` (string) - 新内容
- `dueDate` (string) - 新截止日期
- `priority` (number) - 新优先级
- `status` (number) - 任务状态（0: 未完成, 1: 已完成）

#### `complete_task` - 完成任务
将任务标记为已完成。

**参数：**
- `taskId` (string, 必需) - 任务ID
- `projectId` (string, 必需) - 项目ID

#### `delete_task` - 删除任务
永久删除任务。

**参数：**
- `taskId` (string, 必需) - 任务ID
- `projectId` (string, 必需) - 项目ID

### 项目管理工具

#### `get_projects` - 获取项目列表
获取用户的所有项目。

**参数：**无

#### `create_project` - 创建新项目
创建新的项目。

**参数：**
- `name` (string, 必需) - 项目名称
- `color` (string) - 项目颜色（十六进制）
- `viewMode` (string) - 视图模式（"list", "kanban", "timeline"）
- `kind` (string) - 项目类型（"TASK", "NOTE"）

#### `update_project_by_projectID` - 更新项目
修改项目属性。

**参数：**
- `projectId` (string, 必需) - 项目ID
- `name` (string) - 新名称
- `color` (string) - 新颜色
- `viewMode` (string) - 新视图模式

#### `delete_project_by_projectID` - 删除项目
删除项目及其所有任务。

**参数：**
- `projectId` (string, 必需) - 项目ID

## 📚 可用资源

### `dida365://tasks`
获取所有任务的 JSON 格式概览。

### `dida365://projects`
获取所有项目的 JSON 格式概览。

## 🔧 开发指南

### 项目结构

```
dida365-mcp-servers/
├── src/
│   └── index.ts          # 主服务器文件
├── dist/                 # 编译输出目录
├── scripts/
│   ├── oauth.js          # OAuth 认证脚本
│   ├── refresh-token.js  # Token 刷新工具
│   └── check-token-expiry.js # Token 状态检查
├── .env.example          # 环境变量示例
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
└── README.md            # 项目文档
```

### 开发命令

```bash
# 开发模式（监听文件变化）
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 清理构建文件
npm run clean
```

### 扩展功能

要添加新功能，请编辑 `src/index.ts` 文件：

1. 在工具列表中添加新工具定义
2. 在 `CallToolRequestSchema` 处理器中添加对应的 case
3. 实现相应的 API 调用逻辑

## 🐛 故障排除

### 常见问题

#### Q: OAuth 认证失败
**A:** 检查 Client ID 和 Secret 是否正确，确保重定向 URI 与滴答清单应用配置一致。

#### Q: API 调用返回 401 错误
**A:** Token 可能已过期，运行 `node refresh-token.js` 重新获取。

#### Q: 端口 38000 被占用
**A:** 修改 `.env` 文件中的 `DIDA_REDIRECT_URI` 使用其他端口。

#### Q: 项目无法构建
**A:** 确保 Node.js 版本 >= 16.0，并运行 `npm install` 重新安装依赖。

### 调试模式

启用详细日志：

```bash
# 设置环境变量
export DEBUG=dida365:*

# 运行服务
npm start
```

## 🤝 贡献指南

我们欢迎贡献！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加适当的测试
- 更新文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [滴答清单开放平台](https://developer.dida365.com/) - 提供优秀的 API
- [Model Context Protocol](https://spec.modelcontextprotocol.io/) - 标准化协议
- 所有贡献者和用户

## 📞 支持

如果您遇到问题或有建议：

1. 查看 [问题页面](https://github.com/your-username/dida365-mcp-servers/issues)
2. 创建新的 issue
3. 或发送邮件到 support@example.com

---

**注意**: 本项目与滴答清单官方无关，是第三方开发工具。使用前请确保遵守滴答清单的服务条款。