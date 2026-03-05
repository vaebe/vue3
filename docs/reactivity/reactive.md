# Reactive 实现

基于 `Proxy` 实现响应式代理对象。

## 基本用法

```typescript
import { reactive, effect } from '@vaebe-vue/reactivity'

const state = reactive({ count: 0 })

effect(() => {
  console.log('count:', state.count)
})

state.count++ // 自动触发 effect 重新执行
```

## 实现原理

### createReactiveObject

```typescript
export function reactive(target) {
  return createReactiveObject(target)
}

const reactiveMap = new WeakMap()
const reactiveSet = new WeakSet()

export function createReactiveObject(target) {
  // 不是对象直接返回
  if (!isObject(target)) {
    return target
  }

  // 如果 target 已经是响应式对象，直接返回
  if (reactiveSet.has(target)) {
    return target
  }

  // 如果已经创建过代理，直接返回缓存的代理
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 创建 Proxy 代理
  const proxy = new Proxy(target, mutableHandlers)

  // 缓存 target 和 proxy 的关联
  reactiveMap.set(target, proxy)
  reactiveSet.add(proxy)

  return proxy
}
```

## 核心特性

### 1. 对象缓存

使用 `WeakMap` 缓存已创建的代理对象，避免重复创建：

- `reactiveMap` - 存储 target -> proxy 的映射
- `reactiveSet` - 存储已创建的 proxy 对象

### 2. 嵌套对象响应式

当访问的属性是对象时，自动转换为响应式：

```typescript
const state = reactive({ nested: { count: 0 } })
state.nested.count // nested 自动转为响应式
```

### 3. 防止重复代理

如果传入的 target 已经是响应式对象，直接返回：

```typescript
const state = reactive({ count: 0 })
const state2 = reactive(state) // 返回同一个代理
console.log(state === state2) // true
```

## isReactive

判断一个值是否是 reactive 对象：

```typescript
export function isReactive(value) {
  return reactiveSet.has(value)
}
```

## Proxy Handlers

`mutableHandlers` 定义了 `get` 和 `set` 拦截器：

### get 拦截器

1. **依赖收集** - 调用 `track(target, key)` 收集依赖
2. **Ref 解包** - 如果属性是 ref，自动解包返回 `.value`
3. **嵌套响应式** - 如果属性是对象，自动调用 `reactive()` 转换

### set 拦截器

1. **更新值** - 调用 `Reflect.set` 设置新值
2. **触发更新** - 调用 `trigger(target, key)` 触发依赖
3. **数组 length 处理** - 处理数组隐式修改 length 的情况
