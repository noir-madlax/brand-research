# 登录系统文档

## 📋 概览

已为项目实现了一个完整的登录认证系统，保护详情页面（Ford、BYD、Toyota）需要登录才能访问。

## 🔑 登录凭证

- **账号**: `admin@WantAiOS`
- **密码**: `WantAiOS2026`

## 📁 核心文件

### 1. `login.html` - 登录页面
- 美观的登录界面，支持响应式设计
- 表单验证（邮箱格式、密码非空）
- 错误提示反馈
- 模拟 500ms 网络延迟

**特性**:
- ✓ 渐进式加载动画
- ✓ 实时验证反馈
- ✓ 登录状态持久化
- ✓ 自动重定向已登录用户

### 2. `auth.js` - 认证管理模块
核心认证管理库，提供以下功能：

```javascript
// 检查登录状态
Auth.isLoggedIn()

// 获取当前用户信息
Auth.getCurrentUser()

// 登出
Auth.logout()

// 检查登录（未登录自动跳转）
requireLogin()
```

**Token 机制**:
- Token 存储在 `localStorage`
- 包含用户名、密码、时间戳
- 有效期 24 小时
- 过期自动清除

### 3. 详情页面修改 (`ford.html`, `byd.html`, `toyota.html`)
- 添加了 `<script src="auth.js"></script>` 自动检查登录
- 添加了"登出"按钮到顶部栏
- 未登录自动重定向到登录页

## 🔄 工作流程

### 首次访问流程
```
用户访问 ford.html
    ↓
auth.js 自动检查登录状态
    ↓
未登录？ → 保存当前 URL → 重定向到 login.html
    ↓
用户输入账号密码
    ↓
验证成功？ → 生成 Token → 存储到 localStorage → 重定向回原页面
    ↓
页面正常加载
```

### 已登录访问流程
```
用户访问 ford.html
    ↓
auth.js 检查 Token
    ↓
Token 有效且未过期？ → 页面正常加载
    ↓
Token 过期？ → 清除并重定向到登录页
```

### 登出流程
```
用户点击"登出"按钮
    ↓
确认对话框
    ↓
确定 → 清除 Token → 重定向到 login.html
```

## 🔐 安全特性

- ✓ **Token 验证** - 每次访问时验证 Token 有效性
- ✓ **过期机制** - Token 24 小时自动过期
- ✓ **自动回退** - 过期自动清除并重定向登录
- ✓ **用户信息隐藏** - 密码不存储明文（仅演示用途）
- ✓ **HTTPS 就绪** - 生产环境应使用 HTTPS

## 🧪 测试方法

### 本地测试
```bash
# 1. 使用 Python 启动本地服务器
python3 -m http.server 8000

# 2. 访问
http://localhost:8000/index.html

# 3. 点击品牌卡片进入详情页
# 会自动重定向到 login.html

# 4. 输入凭证登录
# 账号: admin@WantAiOS
# 密码: WantAiOS2026

# 5. 登录成功后返回详情页

# 6. 点击右上角"登出"按钮
# 确认后返回登录页
```

### 测试场景

#### 场景 1: 未登录直接访问详情页
```
1. 打开 http://localhost:8000/ford.html
2. 应自动重定向到 login.html
```

#### 场景 2: 错误的凭证
```
1. 输入错误的账号或密码
2. 显示"账号或密码错误"提示
3. 不进行任何重定向
```

#### 场景 3: 成功登录
```
1. 输入正确凭证
2. 显示加载动画 500ms
3. 重定向回原页面（ford.html）
4. 顶部栏显示"登出"按钮
```

#### 场景 4: 页面刷新保持登录
```
1. 登录成功进入详情页
2. 按 F5 刷新页面
3. 页面正常显示（不重新登录）
4. Token 仍然有效
```

## 📊 技术栈

- **认证方式** - Token + localStorage
- **表单验证** - 前端客户端验证
- **存储** - 浏览器 localStorage（24小时）
- **浏览器兼容** - 所有现代浏览器（IE11+ 需调整）

## 🚀 生产部署注意事项

### 必须改进的安全问题

1. **后端验证**
   - 将验证逻辑移到后端
   - 使用真实数据库存储用户信息
   - 密码应该 Hash 存储（bcrypt/scrypt）

2. **HTTPS**
   - 必须使用 HTTPS 加密传输
   - 不能在 HTTP 上传输敏感信息

3. **Token 管理**
   - 使用 JWT（JSON Web Token）
   - 支持 Refresh Token
   - Token 应加密存储

4. **会话管理**
   - 实现后端会话管理
   - 支持同一用户多设备限制
   - 添加登出时清除所有会话

5. **安全头**
   ```
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Content-Security-Policy: default-src 'self'
   ```

## 🔧 自定义修改

### 修改登录凭证
编辑 `login.html` 中的常量：
```javascript
const VALID_USERNAME = 'admin@WantAiOS';
const VALID_PASSWORD = 'WantAiOS2026';
```

### 修改 Token 过期时间
编辑 `auth.js` 中的常量：
```javascript
TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000  // 改为其他时间
```

### 修改保护的页面
编辑 `auth.js` 中的列表：
```javascript
const detailPages = ['ford.html', 'byd.html', 'toyota.html'];
```

## 📞 常见问题

**Q: 如何禁用登录系统？**
A: 删除所有 HTML 文件中的 `<script src="auth.js"></script>` 行

**Q: Token 会被盗用吗？**
A: 在测试环境可以，生产环境应使用 HTTPS + HTTPOnly Cookie

**Q: 支持多用户吗？**
A: 当前演示版仅支持一个用户，生产环境应添加数据库和用户管理

**Q: 如何集成到现有后端？**
A: 修改 `auth.js` 中的 Token 生成和验证逻辑，调用后端 API

## 📝 更新日志

### v1.0 (2026-04-07)
- ✓ 实现基础登录页面
- ✓ Token 管理和验证
- ✓ 自动登录状态检查
- ✓ 登出功能
- ✓ 响应式设计
