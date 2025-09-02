# PromptLayer 自动化API服务

这是一个基于Express的API服务，用于自动化PromptLayer账号的注册和token刷新。

## 功能特点

- **账号注册API**：自动化注册PromptLayer账号，支持批量注册
- **Token刷新API**：自动化刷新已有账号的token
- **重试机制**：内置智能重试逻辑，提高操作成功率
- **自定义配置**：支持通过config.js自定义浏览器和邮箱配置

## 安装

```bash
# 安装依赖
npm install
```

## 配置

在`config.js`文件中可以自定义以下配置：

```javascript
module.exports = {
  // Chrome浏览器可执行文件路径（留空使用系统默认）
  browserPath: '',
  
  // 是否使用无头模式 (true/false)
  headless: false,
  
  // 操作延迟（毫秒），调试时可增大此值
  slowMo: 0,
  
  // 注册账号使用的邮箱域名列表
  emailDomains: [
    '@vkgl.keomiao.space',
    '@coat.suitbase.cfd',
    '@gost.suitbase.cfd',
    '@ltd.keomiao.space'
  ]
}
```

## 启动服务器

```bash
node server.js
```

服务器默认在6000端口启动。

## API接口

### 1. 注册账号

**接口**：`POST http://localhost:6000/api/register`

**请求参数**：

```json
{
  "count": 2,                      // 可选，要注册的账号数量，默认为1，最大为10
  "emailDomain": "@example.com"    // 可选，指定注册使用的邮箱后缀，不填则使用config.js中配置的
}
```

**响应示例**：

```json
{
  "success": true,
  "registered": 2,
  "accounts": [
    {
      "email": "abc123@example.com",
      "password": "password123A1!",
      "name": "John Smith",
      "company": "Tech Solutions",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "workspaceId": "12345",
      "timestamp": "2023-08-26T04:30:00.000Z"
    },
    {
      "email": "def456@example.com",
      "password": "password456A1!",
      "name": "Emma Johnson",
      "company": "Digital Labs",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "workspaceId": "67890",
      "timestamp": "2023-08-26T04:35:00.000Z"
    }
  ]
}
```

### 2. 刷新Token

**接口**：`POST http://localhost:6000/api/refresh`

**请求参数**：

```json
{
  "accounts": [
    {
      "email": "user1@example.com",
      "password": "password1"
    },
    {
      "email": "user2@example.com",
      "password": "password2"
    }
  ]
}
```

**响应示例**：

```json
{
  "success": true,
  "refreshed": 2,
  "accounts": [
    {
      "email": "user1@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "email": "user2@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ]
}
```

## 文件说明

- `server.js`：主服务器文件，包含API实现
- `config.js`：配置文件
- `accounts_with_tokens.txt`：保存注册的账号信息
- `refreshed_tokens.txt`：保存刷新的token信息

## 注意事项

1. 服务器使用Puppeteer自动化浏览器操作，确保系统已安装Chrome浏览器
2. 默认情况下，浏览器会可见运行，可在config.js中设置headless为true使其在后台运行
3. 每个API请求可能需要较长时间完成，因为涉及浏览器自动化操作
4. 接口有请求数量限制，一次最多处理10个账号
