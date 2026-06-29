# 窗帘款式展示系统 - GratisVPS部署指南

## 前置条件
- GratisVPS账号 (https://gratisvps.net/cvps)
- SSH工具 (Windows用PuTTY或PowerShell, Mac/Linux用终端)

## 第1步: 注册GratisVPS

1. 访问 https://gratisvps.net/cvps
2. 点击 "Create Free VPS" 或 "Start for Free"
3. 填写注册信息 (邮箱、密码)
4. 完成邮箱验证
5. 登录后台

## 第2步: 创建免费VPS

1. 登录后进入控制台
2. 点击 "Create Free VPS" 或 "Deploy"
3. 选择操作系统: **Ubuntu 22.04** (推荐)
4. 选择区域: **Singapore** (新加坡, 国内访问快) 或 **USA**
5. 选择免费套餐 (Starter Free VPS)
6. 点击创建
7. **记录VPS信息**:
   - IP地址
   - 端口 (默认22)
   - root密码
   - SSH密钥 (如果有)

## 第3步: 连接VPS

**Windows (PowerShell):**
```bash
ssh root@你的VPS的IP地址
```

**Mac/Linux (终端):**
```bash
ssh root@你的VPS的IP地址
```

输入密码, 回车连接成功。

## 第4步: 安装Node.js和Docker

连接到VPS后, 依次执行以下命令:

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证Node.js
node -v
npm -v

# 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker
systemctl start docker
systemctl enable docker

# 验证Docker
docker --version
```

## 第5步: 克隆项目并部署

```bash
# 克隆项目
cd /root
git clone https://github.com/qz0424/zs.git
cd zs/src/server

# 构建并运行
docker-compose up -d --build
```

等待几分钟完成构建。

## 第6步: 验证部署

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs curtain-showcase
```

看到 `服务已启动: http://localhost:3000` 说明部署成功。

## 第7步: 获取公网访问地址

部署成功后, 你的网站可以通过以下地址访问:

- **客户端首页**: http://你的VPS的IP地址:3000/client/
- **管理后台**: http://你的VPS的IP地址:3000/admin/login.html
- **管理员账号**: admin / admin123

## 第8步: 开放端口

如果外网无法访问, 需要在VPS防火墙开放3000端口:

```bash
# Ubuntu (ufw)
ufw allow 3000
ufw reload

# 或者关闭防火墙 (测试用)
ufw disable
```

如果还不行, 可能需要在GratisVPS控制台的安全组中开放3000端口。

## 第9步: 更新钉钉通知URL

登录管理后台 → 设置 → 钉钉通知URL:
`http://你的VPS的IP地址:3000/admin/dashboard.html`

---

## 常用命令

```bash
# 进入项目目录
cd /root/zs/src/server

# 查看运行状态
docker ps

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker logs -f curtain-showcase

# 更新代码后重新部署
git pull
docker-compose up -d --build
```

---

## 注意事项

1. **GratisVPS免费版限制**:
   - 2GB内存
   - 可能有公平使用限制
   - 建议不要跑太重的服务

2. **数据安全**:
   - 数据库使用外部Neon, 不受VPS重启影响
   - 上传的文件会保存在VPS上, 建议定期备份

3. **访问速度**:
   - 新加坡服务器国内访问较快
   - 美国服务器可能稍慢但也能用

4. **域名 (可选)**:
   - 如果有域名, 可以用Nginx做反向代理
   - 这样可以用域名访问而不是IP