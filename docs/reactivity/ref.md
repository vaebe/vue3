# Ref 实现

使用类封装基本类型和对象，通过 `getter/setter` 实现依赖收集和触发。

## 基本用法

```typescript
import { ref, effect } from '@vaebe-vue/reactivity'

const count = ref(0)

effect(() => {
  console.log('count:', count.value)
})

count.value++ // 自动触发更新
```

## 实现原理

### RefImpl 类

```typescript
export class RefImpl<T = any> implements Dependency {
  _value: T
  public readonly [ReactiveFlags.IS_REF] = true

  // 订阅者链表头节点
  subs: Link
  // 订阅者链表尾节点
  subsTail: Link

  constructor(value: T) {
    // 对象类型自动转换为 reactive
    this._value = isObject(value) ? reactive(value) : value
  }

  // 获取 value
  get value() {
    // 收集依赖
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  // 设置 value
  set value(newValue) {
    // 数据发生变化才触发更新
    if (hasChanged(newValue, this._value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      triggerRef(this)
    }
  }
}
```

## 核心特性

### 1. 自动转换 reactive

如果 ref 的值是对象，自动转换为 reactive：

```typescript
const state = ref({ count: 0 })
state.value.count // 已经是响应式对象
```

### 2. 依赖收集

访问 `.value` 时，如果存在活跃的订阅者 (`activeSub`)，建立依赖关系：

```typescript
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}
```

### 3. 触发更新

设置 `.value` 时，如果值发生变化，触发所有订阅者更新：

```typescript
function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
```

## API

### ref

创建一个 ref：

```typescript
export function ref(rawValue: unknown) {
  return new RefImpl(rawValue)
}
```

### isRef

判断是否是 ref：

```typescript
export function isRef(r: any) {
  return r ? r[ReactiveFlags.IS_REF] === true : false
}
```

## 与 reactive 的区别

| 特性 | ref | reactive |
|------|-----|----------|
| 适用类型 | 任意类型 | 仅对象 |
| 访问方式 | `.value` | 直接访问 |
| 解包 | 模板中自动解包 | 无需解包 |
