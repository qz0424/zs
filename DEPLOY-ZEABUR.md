# 窗帘款式展示系统 - Zeabur部署指南

## 部署步骤

### 1. 注册Zeabur账号
访问 https://dash.zeabur.com
- 点击 "GitHub 登录"
- 授权Zeabur访问你的GitHub仓库

### 2. 创建新项目
- 点击 "New Project"
- 输入项目名称: `curtain-showcase`
- 选择区域: `ap-east` (香港，国内访问快)

### 3. 连接GitHub仓库
- 点击 "Add New Service"
- 选择 "Deploy from GitHub"
- 选择你的仓库: `https://github.com/qz0424/zs.git`
- 等待自动部署完成

### 4. 设置环境变量
在Zeabur控制台中:
- 点击你的服务
- 进入 "Variables" 标签
- 添加以下环境变量:

```
DATABASE_URL=postgresql://neondb_owner:npg_XGU2QhfcONJ1@ep-proud-frog-ad2pnk4b-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=curtain-showcase-default-secret-2026
PORT=3000
```

### 5. 获取访问地址
部署完成后:
- 点击 "Domains" 标签
- 点击 "Generate Domain"
- 输入你想要的前缀 (例如: `curtain-yijun`)
- 保存后获得域名: `curtain-yijun.zeabur.app`

### 6. 验证部署
访问你的域名，应该能看到:
- 首页: https://你的域名.zeabur.app
- 管理后台: https://你的域名.zeabur.app/admin/login.html
- 管理员账号: admin / admin123

## 注意事项
- Zeabur免费版每月有使用额度限制
- 数据库使用外部Neon，不受Zeabur存储限制
- 钉钉通知需要更新webhook URL为新的域名