// 大概对应该 源码的 dep.ts
import type { ReactiveEffect } from './effect'
import type { RefImpl } from './ref'

/**
 * 依赖项-存订阅者
 */
interface Dep {
  // 订阅者头节点
  subs: Link | undefined
  // 订阅者尾节点
  subsTail: Link | undefined
}

/**
 * 订阅者-存依赖项
 */
interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined
}

export interface Link {
  // 订阅者
  sub: Sub
  // 下一个订阅者节点， 尾节点不存在 nextSub
  nextSub: Link | undefined
  // 上一个订阅者节点，头节点不存在 prevSub
  prevSub: Link | undefined
  // 依赖项
  dep: Dep | undefined
  // 下一个依赖项节点
  nextDep: Link | undefined
}

let linkPool: Link | undefined

/**
 * 建立链表链接关系
 * @param dep 依赖项，比如 ref、computed
 * @param sub 订阅者， effect
 */
export function link(dep: RefImpl, sub: ReactiveEffect) {
  /**
   * 复用节点
   * 1. 如果头节点有、尾节点没有 ，尝试复用头节点
   * 2. 如果尾节点还有 nextDep ，尝试复用尾节点的 nextDep
   */
  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  let newLink: Link

  if (linkPool) {
    newLink = linkPool
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
  } else {
    newLink = {
      sub,
      nextSub: undefined,
      prevSub: undefined,
      dep,
      nextDep,
    }
  }

  /**
   * 将链表节点与 dep 建立关联关系
   * 1. 尾节点存在，添加到尾节点后边
   * 2. 否则表示第一次关联，往头节点添加，头尾节点相同
   */
  if (dep.subsTail) {
    // 将当前尾节点的下一个节点设置为 newLink
    dep.subsTail.nextSub = newLink
    // 将 newLink 的上一个节点设置为 当前的尾节点
    newLink.prevSub = dep.subsTail
    // newLink 设置为当前的尾节点
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }

  /**
   * 将链表节点与 sub 建立关联关系
   * 1. 尾节点存在，添加到尾节点后边
   * 2. 否则表示第一次关联，往头节点添加，头尾节点相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs
  let queuedEffect: ReactiveEffect[] = []

  while (link) {
    const sub = link.sub as ReactiveEffect
    // 不处于追踪状态时 收集依赖执行
    if (!sub.tracking) {
      queuedEffect.push(sub)
    }
    link = link.nextSub
  }

  queuedEffect.forEach(effect => effect.notify())
}

/**
 * 开始追踪依赖,将 depsTail 设置为 undefined
 * @param sub ReactiveEffect
 */
export function startTrack(sub: ReactiveEffect) {
  // 开始追踪依赖时将 tracking 设置为 true
  sub.tracking = true
  sub.depsTail = undefined
}

/**
 * 结束依赖追踪找到需要清理的依赖
 * @param sub
 */
export function endTrack(sub: ReactiveEffect) {
  // 结束追踪依赖时将 tracking 设置为 false
  sub.tracking = false

  if (sub.depsTail?.nextDep) {
    // 如果 depsTail 尾节点 还有 nextDep，说明后面的依赖需要清理
    clearTracking(sub.depsTail.nextDep)
    sub.depsTail.nextDep = undefined
  } else if (!sub.depsTail && sub.deps) {
    // 无尾节点但有头节点，清理全部
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

/**
 * 清理依赖关系
 * @param link
 */
export function clearTracking(link: Link) {
  while (link) {
    const { dep, nextDep, sub, nextSub, prevSub } = link

    /**
     * 处理 上一个订阅者节点
     * 如果 prevSub 有，那就把 prevSub 的下一个节点，指向当前节点的下一个
     * 如果没有，那就是头节点，那就把 dep.subs 指向当前节点的下一个
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 处理 下一个订阅者节点
     * 如果下一个有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
     * 如果下一个没有，那它就是尾节点，把 dep.depsTail 只想上一个节点
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }

    // 断开 Link 节点与 Dep 和 Sub 的双向引用
    link.dep = link.sub = undefined

    /**
     * 把不要的节点保存给 linkPool 在 link 函数中复用
     */
    link.nextDep = linkPool
    linkPool = link

    // 移动到下一个需要清理的节点
    link = nextDep
  }
}
