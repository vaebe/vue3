# Effect 实现

副作用函数是响应式系统的核心，用于自动追踪依赖并在依赖变化时重新执行。

## 基本用法

```typescript
import { effect, stop } from '@vaebe-vue/reactivity'

const runner = effect(
  () => {
    // 副作用逻辑
  },
  {
    scheduler: () => {
      /* 自定义调度 */
    },
  },
)

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

分支切换是响应式系统中的一个重要特性，当条件分支变化时，需要自动清理不再需要的依赖，并添加新的依赖。

#### 什么是分支切换？

考虑以下经典示例：

```typescript
const flag = ref(true)
const name = ref('zhangsan')
const age = ref(18)

effect(() => {
  if (flag.value) {
    console.log(name.value) // 分支 A
  } else {
    console.log(age.value) // 分支 B
  }
})
```

当 `flag` 从 `true` 变为 `false` 时：

- **旧依赖**：`flag` + `name`
- **新依赖**：`flag` + `age`

核心问题：**需要自动清理 `name` 的依赖，添加 `age` 的依赖**

#### 核心实现机制

本实现通过 **"标记-复用-清理"** 三步来完成分支切换：

##### 数据结构

```bash
ReactiveEffect (订阅者 Sub)
    deps ──────► Link1 ──► Link2 ──► Link3
                   │         │
                   ▼         ▼
                dep(A)    dep(B)
                (依赖项)   (依赖项)
```

- `deps`：依赖链表头节点
- `depsTail`：依赖链表尾节点（**关键！**）

##### 第一步：startTrack - 标记阶段

```typescript
export function startTrack(sub) {
  sub.tracking = true
  sub.depsTail = undefined // 关键：尾节点置空，但保留头节点 deps
}
```

**效果**：

- `deps` 仍然指向旧链表
- `depsTail = undefined`，准备重新收集依赖

##### 第二步：link - 复用阶段

当 effect 重新执行时，会再次访问响应式数据，触发 `link` 函数：

```typescript
export function link(dep, sub) {
  const currentDep = sub.depsTail
  // 关键：从头节点或 depsTail.nextDep 开始找
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep

  // 如果找到相同的 dep，直接复用！
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep // 移动尾节点
    return
  }

  // 否则创建新节点...
}
```

**复用逻辑**：

```bash
第一次执行 (flag=true):
  deps → [flag] → [name] → null
              depsTail 指向 name

第二次执行 (flag=false):
  startTrack 后:
    deps → [flag] → [name] → null, depsTail = undefined

  访问 flag:
    - nextDep = deps (从头开始)
    - nextDep.dep === flag ✓ 复用!
    - depsTail = flag 节点

  访问 age:
    - nextDep = depsTail.nextDep = name 节点
    - name.dep !== age，不复用
    - 创建新节点，添加到链表
    - depsTail = age 节点

此时链表：
  deps → [flag] → [name] → [age]
                      ↑        ↑
                  旧节点   depsTail(新)
```

##### 第三步：endTrack - 清理阶段

```typescript
export function endTrack(sub) {
  sub.tracking = false
  sub.dirty = false

  // 关键：depsTail 之后的节点都是旧依赖，需要清理
  if (sub.depsTail?.nextDep) {
    clearTracking(sub.depsTail.nextDep)
    sub.depsTail.nextDep = undefined
  } else if (!sub.depsTail && sub.deps) {
    // 极端情况：没有任何依赖被复用，清理全部
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}
```

**清理逻辑图示**：

```bash
执行完 link 后的链表：
  deps → [flag] → [name] → [age]
                      ↑
               depsTail 在这里

endTrack 检测到 depsTail.nextDep 存在
→ 从 name 开始清理（包括之后的节点）

最终结果：
  deps → [flag] → [age]
                   ↑
              depsTail
```

**`name` 依赖被成功清理！**

#### 设计思想总结

| 步骤       | 操作                                   | 目的                     |
| ---------- | -------------------------------------- | ------------------------ |
| startTrack | `depsTail = undefined`                 | 标记"从这里开始重新收集" |
| link       | 复用匹配的节点                         | 保留仍然有效的依赖       |
| endTrack   | 清理 `depsTail.nextDep` 之后的所有节点 | 删除不再需要的依赖       |

这种设计的精妙之处在于：

1. **不需要额外的数据结构**记录旧依赖
2. **原地复用节点**，减少内存分配
3. **线性时间复杂度**，只遍历一次链表

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
  scheduler: runner => {
    // 自定义调度逻辑
    queueJob(runner)
  },
})
```
