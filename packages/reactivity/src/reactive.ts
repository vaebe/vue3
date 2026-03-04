import { isObject } from '@vaebe-vue/shared'
import { mutableHandlers } from './baseHandlers'

export function reactive(target) {
  return createReactiveObject(target)
}

// 保存已经创建的 reactive, target 和 proxy 的关联关系
const reactiveMap = new WeakMap()

// 保存已经创建的 reactive 代理对象 proxy
const reactiveSet = new WeakSet()

export function createReactiveObject(target) {
  // reactive 为对象创建响应式,不是对象直接返回
  if (!isObject(target)) {
    return target
  }

  /**
   * 看一下这个 target 在不在 reactiveSet 里面，如果在，就证明 target 是响应式的，直接返回
   *
   * 检查这个 target 是不是一个响应式对象 是的话 直接返回
   */
  if (reactiveSet.has(target)) {
    return target
  }

  // 如果这个对象已经创建过 代理则直接返回
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)

  // 保存 target 和 proxy 的关联关系
  reactiveMap.set(target, proxy)

  // 保存 proxy 代理对象到 set
  reactiveSet.add(proxy)

  return proxy
}

/**
 * 判断是否是 reactive
 * @param value
 * @returns
 */
export function isReactive(value) {
  return reactiveSet.has(value)
}
