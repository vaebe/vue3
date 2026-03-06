# 响应式系统

`@vaebe-vue/reactivity` 是 Mini Vue3 的响应式核心模块，实现了 Vue 3 响应式系统的核心原理。

## 模块概述

该模块实现了完整的响应式系统，包括：

| 功能       | 说明                                    |
| ---------- | --------------------------------------- |
| `reactive` | 响应式对象，基于 Proxy 实现             |
| `ref`      | 响应式引用，支持任意类型                |
| `effect`   | 副作用函数，自动追踪依赖                |
| `computed` | 计算属性，延迟计算 + 脏检查             |
| `watch`    | 侦听器，支持多种监听源                  |
| 辅助函数   | `toRef`、`toRefs`、`unRef`、`proxyRefs` |

## 核心架构

### 双向链表依赖管理

采用双向链表结构管理依赖关系：

``` bash
Dependency (dep) ←→ Link ←→ Subscriber (sub)
```

**三种角色：**

- **Dependency** - 被依赖的对象（`ref`、`computed`、`Dep`）
- **Subscriber (Sub)** - 订阅者（`ReactiveEffect`、`ComputedRefImpl`）
- **Link** - 连接节点，形成双向链表

### 依赖追踪流程

```bash
1. 读取响应式数据
   └→ track(target, key)
      └→ link(dep, activeSub)

2. 修改响应式数据
   └→ trigger(target, key)
      └→ propagate(dep.subs)
         └→ sub.notify() / sub.update()
```

## 模块文件结构

``` bash
packages/reactivity/src/
├── index.ts        # 模块入口，导出所有 API
├── reactive.ts     # reactive 响应式对象实现
├── ref.ts          # ref 响应式引用实现
├── effect.ts       # 副作用函数与 ReactiveEffect 类
├── computed.ts     # 计算属性实现
├── watch.ts        # 侦听器实现
├── dep.ts          # 依赖收集与触发
├── system.ts       # 响应式系统核心链表实现
├── baseHandlers.ts # Proxy 处理器
└── constants.ts    # 常量定义
```

## API 列表

### 响应式 API

| API                           | 说明           |
| ----------------------------- | -------------- |
| `reactive(target)`            | 创建响应式对象 |
| `ref(value)`                  | 创建响应式引用 |
| `computed(getter)`            | 创建计算属性   |
| `watch(source, cb, options?)` | 创建侦听器     |

### 副作用 API

| API                    | 说明           |
| ---------------------- | -------------- |
| `effect(fn, options?)` | 创建副作用函数 |
| `stop(runner)`         | 停止副作用追踪 |

### 工具 API

| API                  | 说明                          |
| -------------------- | ----------------------------- |
| `isReactive(value)`  | 判断是否是 reactive 对象      |
| `isRef(value)`       | 判断是否是 ref                |
| `toRef(target, key)` | 将响应式对象属性转为 ref      |
| `toRefs(target)`     | 将响应式对象所有属性转为 refs |
| `unRef(value)`       | 自动解包 ref                  |
| `proxyRefs(target)`  | 代理 refs 对象，自动解包      |

## 快速开始

### 安装

```bash
pnpm install
```

### 基本使用

```typescript
import { reactive, ref, effect, computed, watch } from '@vaebe-vue/reactivity'

// reactive 响应式对象
const state = reactive({ count: 0 })

// ref 响应式引用
const count = ref(0)

// computed 计算属性
const double = computed(() => count.value * 2)

// effect 副作用函数
effect(() => {
  console.log('count:', count.value)
})

// watch 侦听器
watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`)
})

// 触发更新
count.value++
```

## 核心特性

### 1. 响应式对象 (Reactive)

- 基于 Proxy 实现响应式代理
- 支持嵌套对象的响应式转换
- 支持数组响应式（包括 length 隐式修改）
- 使用 WeakMap 缓存已创建的代理对象

### 2. 响应式引用 (Ref)

- 使用类封装基本类型和对象
- 对象类型自动转换为 reactive
- 通过 getter/setter 实现依赖收集和触发

### 3. 计算属性 (Computed)

- 延迟计算，只有在被访问时才计算
- 脏检查机制避免重复计算
- 支持可写计算属性

### 4. 侦听器 (Watch)

- 支持侦听 ref / reactive / 函数
- `immediate` - 立即执行
- `deep` - 深度侦听
- `once` - 只执行一次
- `onCleanup` - 清理回调

### 5. 副作用函数 (Effect)

- 自动追踪依赖
- 支持嵌套 effect
- 支持分支切换
- 支持自定义调度器

## 学习路径

建议按以下顺序学习：

1. [Ref 实现](/reactivity/ref) - 理解响应式引用
2. [Effect 实现](/reactivity/effect) - 理解副作用追踪
3. [链表应用](/reactivity/link-list) - 理解依赖管理核心
4. [Reactive 实现](/reactivity/reactive) - 理解 Proxy 响应式
5. [Computed 计算](/reactivity/computed) - 理解计算属性
6. [Watch 侦听](/reactivity/watch) - 理解侦听器
7. [数组响应式](/reactivity/array) - 理解数组特殊处理
8. [辅助函数](/reactivity/helpers) - 理解工具函数
