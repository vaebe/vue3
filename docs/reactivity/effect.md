# Effect 实现

副作用函数是响应式系统的核心，用于自动追踪依赖并在依赖变化时重新执行。

## 基本用法

```typescript
import { effect, stop } from '@vaebe-vue/reactivity'

const runner = effect(() => {
  // 副作用逻辑
}, { scheduler: () => { /* 自定义调度 */ } })

runner() // 手动执行
runner.effect.stop() // 停止追踪
```

## 实现原理

### ReactiveEffect 类

```typescript
export class ReactiveEffect implements Sub {
  // 依赖项链表的头节点
  deps: Link | undefined
  // 依赖项链表的尾节点
  depsTail: Link | undefined

  // 追踪状态
  tracking: boolean

  // 脏检查标志
  dirty: boolean = true

  // 是否激活
  active: boolean = true

  constructor(public fn) {}

  run() {
    // 未激活时不收集依赖
    if (!this.active) {
      return this.fn()
    }

    // 保存之前的 effect（处理嵌套）
    const prevSub = activeSub
    activeSub = this

    // 开始追踪依赖
    startTrack(this)

    try {
      return this.fn()
    } finally {
      // 结束追踪，清理依赖
      endTrack(this)
      // 恢复之前的 effect
      activeSub = prevSub
    }
  }

  // 停止追踪
  stop() {
    if (this.active) {
      startTrack(this)
      endTrack(this)
      this.active = false
    }
  }

  // 调度器
  scheduler() {
    this.run()
  }

  // 通知更新
  notify() {
    this.scheduler()
  }
}
```

## 核心特性

### 1. 嵌套 Effect 处理

使用 `activeSub` 变量保存当前正在执行的 effect：

```typescript
effect(() => {
  // activeSub = effect1
  effect(() => {
    // activeSub = effect2
  })
  // activeSub = effect1
})
```

### 2. 依赖追踪

`startTrack` 和 `endTrack` 配合使用：

- `startTrack` - 将 `depsTail` 设为 `undefined`，准备收集新依赖
- `endTrack` - 清理不再需要的依赖

### 3. 分支切换

当条件分支变化时，自动清理不再需要的依赖：

```typescript
const state = reactive({ flag: true, a: 1, b: 2 })

effect(() => {
  console.log(state.flag ? state.a : state.b)
})

// 当 flag 变为 false 时，会清理 a 的依赖，添加 b 的依赖
state.flag = false
```

### 4. 无限循环递归解决

通过 `tracking` 状态标志避免无限循环：

```typescript
// 在 track 时检查 tracking 状态
if (!sub.tracking) {
  // 只有不在追踪状态时才触发更新
}
```

## effect 函数

```typescript
export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  Object.assign(e, options)
  e.run()

  const runner = e.run.bind(e)
  runner.effect = e

  return runner
}
```

## Scheduler 调度器

可以通过 `scheduler` 选项自定义触发时的行为：

```typescript
effect(fn, {
  scheduler: (runner) => {
    // 自定义调度逻辑
    queueJob(runner)
  }
})
```
