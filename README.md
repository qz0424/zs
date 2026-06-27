# 窗帘款式展示系统

一个用于展示和管理窗帘款式的移动应用系统。

## 项目简介

本系统旨在帮助窗帘商家展示产品款式，方便客户浏览、收藏和对比窗帘产品。系统支持安卓和iOS双端，提供客户展示端和管理端两个应用。

## 功能特性

### 客户端
- 款式展示（主图+多色归组）
- 搜索和筛选功能
- 收藏和对比功能
- 支持离线浏览

### 管理端
- 款式管理（新增/编辑/下架）
- 批量导入款式数据
- 图片和视频上传
- 分类管理（可自定义）

## 技术栈

- **客户端/管理端：** Flutter
- **服务端：** Node.js + Express
- **数据库：** PostgreSQL
- **缓存：** Redis

## 项目结构

```
curtain-showcase/
├── docs/                          # 文档目录
│   ├── requirements.md            # 需求文档
│   ├── technical-spec.md          # 技术规格
│   ├── design-spec.md             # 设计规范
│   └── implementation-plan.md     # 执行计划
├── devlog/                        # 开发日志
├── src/
│   ├── client/                    # 客户端Flutter项目
│   ├── admin/                     # 管理端Flutter项目
│   └── server/                    # 服务端Node.js项目
└── README.md                      # 项目说明
```

## 开发环境

### 前置要求
- Flutter SDK 3.0+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd curtain-showcase
```

2. 安装服务端依赖
```bash
cd src/server
npm install
```

3. 安装客户端依赖
```bash
cd src/client
flutter pub get
```

4. 安装管理端依赖
```bash
cd src/admin
flutter pub get
```

## 开发指南

### 代码规范
- Flutter：遵循 Dart 官方代码规范
- Node.js：遵循 ESLint 规范
- Git：使用 Conventional Commits 规范

### 开发流程
1. 修改代码前先确认当前阶段目标（见 docs/implementation-plan.md）
2. 每完成一个阶段，在 devlog 中记录完成情况
3. 遵循设计规范（见 docs/design-spec.md）

## 文档

- [需求文档](docs/requirements.md)
- [技术规格](docs/technical-spec.md)
- [设计规范](docs/design-spec.md)
- [执行计划](docs/implementation-plan.md)
- [开发日志](devlog/)

## 许可证

本项目仅供学习和参考使用。
