import { Link, link, propagate } from './system'
import { activeSub } from './effect'

class Dep {
  /**
   * 订阅者链表的头节点，理解为我们将的 head
   */
  subs: Link

  /**
   * 订阅者链表的尾节点，理解为我们讲的 tail
   */
  subsTail: Link
  constructor() {}
}

/**
 * 绑定 target 的 key 关联的所有的 Dep
 * obj = { a:0, b:1 }
 * targetMap = {
 *  [obj]:{
 *    a:Dep,
 *    b:Dep
 *  }
 * }
 */

const targetMap = new WeakMap()

// 追踪依赖
export function track(target, key) {
  // effect 函数不存在直接返回
  if (!activeSub) {
    return
  }

  /**
   * 找 depsMap = {
   *    a:Dep,
   *    b:Dep
   *  }
   */

  let depsMap = targetMap.get(target)

  /**
   * 没有 depsMap，就是之前没有收集过这个对象的任何 key
   * 那就创建一个新的，保存 target 和 depsMap 之间的关联关系
   */
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  /**
   * 找 dep => Dep
   */
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }

  /**
   * 绑定 dep 和 sub 之间的关联关系
   */
  link(dep, activeSub)
}

// 触发依赖
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  // depsMap 没有，表示这个对象，从来没有任何属性在 sub 中访问过
  if (!depsMap) {
    return
  }

  // 判断当前的数据是否是数组
  const targetIsArray = Array.isArray(target)
  const newLength = target.target

  /**
   * 当数组的 length 被修改（通常是缩短数组）时，需要通知相关的副作用重新执行。
   */
  if (targetIsArray && key === 'length') {
    /**
     * 一开始：['a', 'b', 'c', 'd'] length = 4
     * 更新后：['a', 'b'] length = 2 , 索引 2 和 3 的元素被删除
     *
     * 遍历 depsMap 中所有的依赖（dep）和对应的键（depKey）
     */
    depsMap.forEach((dep, depKey) => {
      /**
       * 1. `depKey === 'length'`：直接依赖 length 属性的副作用需要触发
       * 2. `depKey >= newLength`：访问的索引 >= 新长度，说明该位置的元素已被"删除"，需要触发副作用
       */
      if (depKey === 'length' || depKey >= newLength) {
        propagate(dep.subs)
      }
    })
  } else {
    const dep = depsMap.get(key)
    // dep 不存在，表示这个 key 没有在 sub 中访问过
    if (!dep) {
      return
    }

    /**
     * 找到 dep 的 subs 通知它们重新执行
     */
    propagate(dep.subs)
  }
}
