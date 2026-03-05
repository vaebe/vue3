# 链表应用

本项目采用 **双向链表** 结构管理依赖关系，这是 Vue 3 响应式系统的核心架构。

## 核心概念

### 三种角色

```
Dependency (dep) ←→ Link ←→ Subscriber (sub)
```

- **Dependency** - 被依赖的对象（`ref`, `computed`, `Dep`）
- **Subscriber (Sub)** - 订阅者（`ReactiveEffect`, `ComputedRefImpl`）
- **Link** - 连接节点，形成双向链表

### 接口定义

```typescript
// 依赖项 - 存订阅者
export interface Dependency {
  subs: Link | undefined       // 订阅者头节点
  subsTail: Link | undefined   // 订阅者尾节点
}

// 订阅者 - 存依赖项
export interface Sub {
  deps: Link | undefined       // 依赖项头节点
  depsTail: Link | undefined   // 依赖项尾节点
  tracking: boolean            // 追踪状态
}

// 链表节点
export interface Link {
  sub: Sub                     // 订阅者
  nextSub: Link | undefined    // 下一个订阅者
  prevSub: Link | undefined    // 上一个订阅者
  dep: Dependency | undefined  // 依赖项
  nextDep: Link | undefined    // 下一个依赖项
}
```

## 核心函数

### link - 建立关联

```typescript
export function link(dep, sub) {
  // 复用节点逻辑
  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  
  // 如果依赖已存在，直接复用
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  // 从对象池获取或创建新节点
  let newLink: Link
  if (linkPool) {
    newLink = linkPool
    linkPool = linkPool.nextDep
  } else {
    newLink = { sub, dep, ... }
  }

  // 建立 dep -> sub 关联
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }

  // 建立 sub -> dep 关联
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}
```

### propagate - 传播更新

```typescript
export function propagate(subs: Link) {
  let link = subs
  let queuedEffect: ReactiveEffect[] = []

  while (link) {
    const sub = link.sub
    
    // 不处于追踪状态且数据有变化
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true
      
      if ('update' in sub) {
        // computed 更新
        processComputedUpdate(sub)
      } else {
        // effect 收集执行
        queuedEffect.push(sub)
      }
    }
    link = link.nextSub
  }

  // 执行所有 effect
  queuedEffect.forEach(effect => effect.notify())
}
```

### clearTracking - 清理依赖

```typescript
export function clearTracking(link: Link) {
  while (link) {
    const { dep, nextDep, sub, nextSub, prevSub } = link

    // 从 dep 的订阅者链表中移除
    if (prevSub) {
      prevSub.nextSub = nextSub
    } else {
      dep.subs = nextSub
    }
    
    if (nextSub) {
      nextSub.prevSub = prevSub
    } else {
      dep.subsTail = prevSub
    }

    // 断开引用，放入对象池
    link.dep = link.sub = undefined
    link.nextDep = linkPool
    linkPool = link

    link = nextDep
  }
}
```

## 节点复用

使用 `linkPool` 对象池复用 Link 节点，减少 GC 压力：

```typescript
let linkPool: Link | undefined

// 创建节点时优先从池中获取
if (linkPool) {
  newLink = linkPool
  linkPool = linkPool.nextDep
}

// 清理节点时放回池中
link.nextDep = linkPool
linkPool = link
```

## 依赖追踪流程

### startTrack

```typescript
export function startTrack(sub) {
  sub.tracking = true
  sub.depsTail = undefined  // 重置尾节点
}
```

### endTrack

```typescript
export function endTrack(sub) {
  sub.tracking = false
  sub.dirty = false

  // 清理不再需要的依赖
  if (sub.depsTail?.nextDep) {
    clearTracking(sub.depsTail.nextDep)
    sub.depsTail.nextDep = undefined
  } else if (!sub.depsTail && sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}
```
