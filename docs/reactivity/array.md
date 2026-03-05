# 数组响应式

支持数组的响应式，包括 `length` 属性的隐式修改触发依赖更新。

## 基本用法

```typescript
import { reactive, effect } from '@vaebe-vue/reactivity'

const arr = reactive([1, 2, 3])

effect(() => {
  console.log('arr.length:', arr.length)
})

arr.push(4) // 自动触发 length 更新
```

## 实现原理

### 数组 length 隐式修改

当使用 `push`、`pop`、`shift`、`unshift` 等方法时，会隐式改变 `length`：

```typescript
set(target, key, newValue, receiver) {
  const targetIsArray = Array.isArray(target)
  // set 前保存旧长度
  const oldLength = targetIsArray ? target.length : 0

  const oldValue = Reflect.get(target, key, receiver)
  const res = Reflect.set(target, key, newValue, receiver)

  if (hasChanged(oldValue, newValue)) {
    trigger(target, key)
  }

  // set 后保存新长度
  const newLength = targetIsArray ? target.length : 0

  // 隐式修改 length
  if (targetIsArray && oldLength !== newLength && key !== 'length') {
    trigger(target, 'length')
  }

  return res
}
```

## 核心特性

### 1. 索引修改

```typescript
const arr = reactive([1, 2, 3])
arr[0] = 10 // 触发 key 为 '0' 的依赖
```

### 2. length 修改

```typescript
const arr = reactive([1, 2, 3])
arr.length = 1 // 触发 key 为 'length' 的依赖
```

### 3. 数组方法

```typescript
const arr = reactive([1, 2, 3])

// push - 隐式修改 length
arr.push(4) // 触发 '3' 和 'length' 的依赖

// pop - 隐式修改 length
arr.pop() // 触发 'length' 的依赖

// shift - 隐式修改 length
arr.shift() // 触发多个索引和 'length' 的依赖

// unshift - 隐式修改 length
arr.unshift(0) // 触发多个索引和 'length' 的依赖
```

### 4. 嵌套对象

数组中的对象元素自动转为响应式：

```typescript
const arr = reactive([{ count: 0 }])
arr[0].count++ // 自动触发更新
```

## 隐式修改检测逻辑

```typescript
// 1. 目标是数组
// 2. 修改前后长度不同
// 3. 修改的不是 length 本身
if (targetIsArray && oldLength !== newLength && key !== 'length') {
  trigger(target, 'length')
}
```

## 示例

```typescript
const arr = reactive([1, 2, 3])

effect(() => {
  console.log('数组长度:', arr.length)
  console.log('数组内容:', arr.join(', '))
})

arr.push(4)
// 输出:
// 数组长度: 4
// 数组内容: 1, 2, 3, 4

arr.pop()
// 输出:
// 数组长度: 3
// 数组内容: 1, 2, 3
```
