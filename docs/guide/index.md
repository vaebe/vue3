# 简介

Mini Vue3 是一个响应式系统的实现项目，旨在学习和理解 Vue 3 响应式系统的核心原理。

## 项目特点

- 🎯 **核心原理** - 专注于 Vue 3 响应式系统的核心实现
- 📦 **Monorepo** - 使用 pnpm workspaces 管理多包
- ⚡ **快速构建** - 使用 esbuild 进行极速构建
- 🔗 **链表依赖** - 双向链表结构管理依赖关系

## 项目结构

```
mini-vue3/
├── packages/
│   ├── reactivity/       # 响应式核心模块
│   ├── shared/           # 公共工具模块
│   └── vue/              # Vue 主入口
├── docs/                 # 文档
└── scripts/              # 构建脚本
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev reactivity --format esm
```

## 核心架构

项目采用 **双向链表** 结构管理依赖关系：

```
Dependency (dep) ←→ Link ←→ Subscriber (sub)
```

- **Dependency** - 被依赖的对象 (ref, computed, Dep)
- **Subscriber (Sub)** - 订阅者 (ReactiveEffect, ComputedRefImpl)
- **Link** - 连接节点，形成双向链表
