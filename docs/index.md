---
layout: home

hero:
  name: "Mini Vue3"
  text: "响应式系统核心原理"
  tagline: 学习和理解 Vue 3 响应式系统的实现
  actions:
    - theme: brand
      text: 开始学习
      link: /guide/
    - theme: alt
      text: GitHub
      link: https://github.com/vaebe/vue3

features:
  - icon: 🚀
    title: Reactive 响应式对象
    details: 基于 Proxy 实现响应式代理，支持嵌套对象和数组响应式
  - icon: 📦
    title: Ref 响应式引用
    details: 使用类封装基本类型和对象，通过 getter/setter 实现依赖收集
  - icon: ⚡
    title: Computed 计算属性
    details: 延迟计算，脏检查机制避免重复计算
  - icon: 👀
    title: Watch 侦听器
    details: 支持 ref/reactive/函数侦听，支持 immediate/deep/once 选项
---

## 项目概述

这是一个 **Mini Vue3** 响应式系统的实现项目，旨在学习和理解 Vue 3 响应式系统的核心原理。

### 核心技术栈

- **TypeScript** - 类型安全的 JavaScript 超集
- **pnpm workspaces** - monorepo 包管理
- **esbuild** - 极速的 JavaScript 打包工具
