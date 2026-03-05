# Computed 计算

计算属性支持延迟计算和脏检查机制，避免重复计算。

## 基本用法

```typescript
import { ref, computed } from '@vaebe-vue/reactivity'

const count = ref(1)
const double = computed(() => count.value * 2)

console.log(double.value) // 2
count.value++
console.log(double.value) // 4 (重新计算)
```

## 可写计算属性

```typescript
const count = ref(1)
const double = computed({
  get: () => count.value * 2,
  set: (val) => { count.value = val / 2 }
})

double.value = 10
console.log(count.value) // 5
```

## 实现原理

### ComputedRefImpl 类

```typescript
export class ComputedRefImpl<T = any> implements Sub, Dependency {
  _value: T
  public readonly [ReactiveFlags.IS_REF] = true

  // 作为 Dependency 的属性
  subs: Link        // 订阅者链表头节点
  subsTail: Link    // 订阅者链表尾节点

  // 作为 Sub 的属性
  deps: Link        // 依赖项链表头节点
  depsTail: Link    // 依赖项链表尾节点

  tracking: boolean // 追踪状态
  dirty: boolean = true  // 脏检查标志

  constructor(
    public fn,      // getter
    private setter,
  ) {}

  get value() {
    // 脏了才更新
    if (this.dirty) {
      this.update()
    }

    // 建立订阅关系
    if (activeSub) {
      link(this, activeSub)
    }

    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('computed 只读,无法赋值')
    }
  }
}
```

## 核心特性

### 1. 延迟计算

只有在访问 `.value` 时才计算：

```typescript
const expensive = computed(() => {
  console.log('计算中...')
  return heavyCalculation()
})

// 此时不会计算
expensive.value // 第一次访问才计算
expensive.value // 使用缓存，不重新计算
```

### 2. 脏检查机制

使用 `dirty` 标志避免重复计算：

```typescript
get value() {
  if (this.dirty) {
    this.update()  // 只有 dirty 为 true 才计算
  }
  return this._value
}
```

### 3. 自动传播更新

当依赖变化时，标记 dirty 并通知订阅者：

```typescript
update() {
  const prevSub = activeSub
  setActiveSub(this)
  startTrack(this)

  try {
    const oldValue = this._value
    this._value = this.fn()
    return hasChanged(this._value, oldValue)
  } finally {
    endTrack(this)
    setActiveSub(prevSub)
  }
}
```

### 4. 链式依赖

Computed 可以作为其他 Computed 或 Effect 的依赖：

```
ref → computed → computed → effect
```

## computed 函数

```typescript
export function computed(getterOrOptions) {
  let getter, setter

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
```

## 更新流程

1. 访问 `computed.value`
2. 如果 `dirty === true`，执行 `update()`
3. `update()` 执行 getter，收集依赖
4. 依赖变化时，标记 `dirty = true`
5. 通过 `propagate` 通知下游订阅者
