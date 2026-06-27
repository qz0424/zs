# 窗帘款式展示系统 - 技术规格

## 1. 技术栈选择

### 1.1 客户端和管理端（手机APP）
- **框架：** Flutter
- **理由：** 
  - 一套代码同时支持安卓和iOS
  - 性能接近原生
  - 开发效率高
  - 社区活跃，文档完善

### 1.2 服务端（后台API）
- **框架：** Node.js + Express
- **理由：**
  - JavaScript全栈，开发效率高
  - 轻量级，适合中小型项目
  - 丰富的中间件生态

### 1.3 数据库
- **主数据库：** SQLite (better-sqlite3)
- **理由：**
  - 无需安装数据库服务器，一个文件搞定
  - 对几百款产品性能完全够用
  - 可迁移到PostgreSQL

### 1.4 文件存储
- **方案：** 本地存储 + 云存储（可选）
- **理由：**
  - 初期用本地存储降低成本
  - 后期可迁移到阿里云OSS或腾讯云COS

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
├─────────────────────────────────────────────────────────────┤
│  Flutter APP（安卓+iOS）    │    Flutter APP（安卓+iOS）    │
│  客户端（展示用）           │    管理端（管理用）           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API网关层                             │
├─────────────────────────────────────────────────────────────┤
│                    Node.js + Express                        │
│                    RESTful API                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据层                                │
├─────────────────────────────────────────────────────────────┤
│    PostgreSQL（主数据库）    │    Redis（缓存）              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        存储层                                │
├─────────────────────────────────────────────────────────────┤
│                    本地文件存储                              │
│                    （图片/视频）                             │
└─────────────────────────────────────────────────────────────┘
```

## 3. 数据库设计

### 3.1 用户表（users）
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 款式表（curtains）
```sql
CREATE TABLE curtains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    material VARCHAR(50),
    style VARCHAR(50),
    light_level VARCHAR(50),
    size_range VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 颜色表（curtain_colors）
```sql
CREATE TABLE curtain_colors (
    id SERIAL PRIMARY KEY,
    curtain_id INTEGER REFERENCES curtains(id) ON DELETE CASCADE,
    color_name VARCHAR(50) NOT NULL,
    color_code VARCHAR(20),
    sort_order INTEGER DEFAULT 0
);
```

### 3.4 图片表（curtain_images）
```sql
CREATE TABLE curtain_images (
    id SERIAL PRIMARY KEY,
    curtain_id INTEGER REFERENCES curtains(id) ON DELETE CASCADE,
    color_id INTEGER REFERENCES curtain_colors(id) ON DELETE CASCADE,
    image_type VARCHAR(20), -- main/effect
    image_url VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0
);
```

### 3.5 视频表（curtain_videos）
```sql
CREATE TABLE curtain_videos (
    id SERIAL PRIMARY KEY,
    curtain_id INTEGER REFERENCES curtains(id) ON DELETE CASCADE,
    video_url VARCHAR(255) NOT NULL,
    cover_url VARCHAR(255),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.6 分类表（categories）
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    dimension VARCHAR(50) NOT NULL, -- space/material/style/light
    name VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.7 收藏表（favorites）
```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- 可选，支持游客收藏
    curtain_id INTEGER REFERENCES curtains(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. API 设计

### 4.1 客户端 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/curtains | 获取款式列表 |
| GET | /api/curtains/:id | 获取款式详情 |
| GET | /api/curtains/search | 搜索款式 |
| GET | /api/curtains/filter | 筛选款式 |
| POST | /api/favorites | 添加收藏 |
| DELETE | /api/favorites/:id | 取消收藏 |
| GET | /api/favorites | 获取收藏列表 |
| GET | /api/categories | 获取分类列表 |

### 4.2 管理端 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/login | 管理员登录 |
| POST | /api/admin/curtains | 新增款式 |
| PUT | /api/admin/curtains/:id | 编辑款式 |
| DELETE | /api/admin/curtains/:id | 删除款式 |
| PUT | /api/admin/curtains/:id/status | 上下架 |
| POST | /api/admin/upload | 上传图片/视频 |
| POST | /api/admin/import | 批量导入 |
| POST | /api/admin/categories | 新增分类 |
| PUT | /api/admin/categories/:id | 编辑分类 |
| DELETE | /api/admin/categories/:id | 删除分类 |

## 5. 项目结构

```
curtain-showcase/
├── docs/                          # 文档目录
├── devlog/                        # 开发日志
├── src/
│   ├── client/                    # 客户端Flutter项目
│   │   ├── lib/
│   │   │   ├── main.dart
│   │   │   ├── screens/          # 页面
│   │   │   ├── widgets/          # 组件
│   │   │   ├── models/           # 数据模型
│   │   │   ├── services/         # API服务
│   │   │   └── utils/            # 工具类
│   │   └── pubspec.yaml
│   ├── admin/                     # 管理端Flutter项目
│   │   ├── lib/
│   │   └── pubspec.yaml
│   └── server/                    # 服务端Node.js项目
│       ├── src/
│       │   ├── routes/           # 路由
│       │   ├── models/           # 数据模型
│       │   ├── middleware/       # 中间件
│       │   └── utils/            # 工具类
│       ├── package.json
│       └── .env
└── README.md
```

## 6. 开发环境

### 6.1 开发工具
- IDE：VS Code
- 版本控制：Git
- 数据库管理：pgAdmin 或 DBeaver

### 6.2 依赖管理
- Flutter：pub（Flutter官方包管理）
- Node.js：npm 或 yarn

### 6.3 代码规范
- Flutter：遵循 Dart 官方代码规范
- Node.js：遵循 ESLint 规范
- Git：使用 Conventional Commits 规范
