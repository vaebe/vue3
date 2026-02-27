// 大概对应该 源码的 dep.ts

export interface Link {
  // 保存 effect
  sub: Function
  // 下一个节点， 尾节点不存在 nextSub
  nextSub: Link | undefined
  // 上一个节点，头节点不存在 prevSub
  prevSub: Link | undefined
}

/**
 * 建立链表链接关系
 * @param dep 依赖项，比如 ref、computed
 * @param sub 订阅者， effect
 */
export function link(dep, sub) {
  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
  }

  /**
   * 关联链表关系
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
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  let link = subs
  let queuedEffect = []

  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }

  queuedEffect.forEach(effect => effect())
}
