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

/**
 * 建立链表链接关系
 * @param dep 依赖项，比如 ref、computed
 * @param sub 订阅者， effect
 */
export function link(dep: RefImpl, sub: ReactiveEffect) {
  debugger
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

  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
    dep,
    nextDep: undefined,
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
    // link.sub 是 ReactiveEffect
    queuedEffect.push(link.sub as ReactiveEffect)
    link = link.nextSub
  }

  queuedEffect.forEach(effect => effect.notify())
}
