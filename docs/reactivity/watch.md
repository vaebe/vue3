# Watch 侦听

侦听器用于监听响应式数据变化并执行回调。

## 基本用法

```typescript
import { ref, watch } from '@vaebe-vue/reactivity'

const count = ref(0)

watch(count, (newVal, oldVal, onCleanup) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`)
  
  onCleanup(() => {
    console.log('cleanup')
  })
})
```

## 监听源类型

### Ref

```typescript
const count = ref(0)
watch(count, (newVal, oldVal) => {
  console.log(newVal, oldVal)
})
```

### Reactive

```typescript
const state = reactive({ count: 0 })
watch(state, (newVal, oldVal) => {
  // 默认深度监听
})
```

### 函数

```typescript
watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log(newVal, oldVal)
  }
)
```

## 选项

### immediate

立即执行一次回调：

```typescript
watch(count, callback, { immediate: true })
```

### deep

深度监听对象：

```typescript
const state = reactive({ nested: { count: 0 } })
watch(state, callback, { deep: true })

// 也可以指定深度
watch(state, callback, { deep: 2 })
```

### once

只执行一次：

```typescript
watch(count, callback, { once: true })
```

## onCleanup 清理回调

```typescript
watch(count, (newVal, oldVal, onCleanup) => {
  const timer = setTimeout(() => {}, 1000)
  
  onCleanup(() => {
    clearTimeout(timer) // 下次执行前清理
  })
})
```

## 实现原理

### getter 生成

```typescript
let getter

if (isRef(source)) {
  getter = () => source.value
} else if (isReactive(source)) {
  getter = () => source
  if (!deep) deep = true  // reactive 默认深度监听
} else if (isFunction(source)) {
  getter = source
}
```

### 深度遍历

```typescript
function traverse(value, depth = Infinity, seen = new Set()) {
  if (!isObject(value) || depth <= 0) return value
  if (seen.has(value)) return value  // 避免循环引用

  depth--
  seen.add(value)

  for (const key in value) {
    traverse(value[key], depth, seen)
  }

  return value
}
```

### 调度器

```typescript
function job() {
  if (cleanup) {
    cleanup()
    cleanup = null
  }

  const newValue = effect.run()
  cb(newValue, oldValue, onCleanup)
  oldValue = newValue
}

effect.scheduler = job
```

### once 实现

```typescript
if (once) {
  const _cb = cb
  cb = (...args) => {
    _cb(...args)
    stop() // 执行一次后停止
  }
}
```

## watch 函数完整实现

```typescript
export function watch(source, cb, options) {
  let { immediate, deep, once } = options || {}

  // getter 处理...

  // 创建 effect
  const effect = new ReactiveEffect(getter)
  
  let oldValue
  let cleanup = null

  function onCleanup(cb) {
    cleanup = cb
  }

  function job() {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }

  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    oldValue = effect.run()
  }

  function stop() {
    effect.stop()
  }

  return stop
}
```
