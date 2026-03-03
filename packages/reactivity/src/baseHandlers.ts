import { hasChanged, isObject } from '@vaebe-vue/shared'
import { track, trigger } from './dep'
import { reactive } from './reactive'
import { isRef } from './ref'

export const mutableHandlers = {
  /**
   * @param target 原始对象
   * @param key 访问的属性名 (对象的 key)
   * @param receiver 代理对象本身
   */
  get(target, key, receiver) {
    /**
     * target = { a:0 }
     * 收集依赖，绑定 target 中某一个 key 和 sub 之间的关系
     */
    track(target, key)

    /**
     * 获取需要读取的数据
     * receiver 用来保证 访问器里面的 this 指向代理对象
     */
    const res = Reflect.get(target, key, receiver)

    // 处理 reactive 字段 ref 的情况
    if (isRef(res)) {
      /**
       * target = {a:ref(0)}
       * 如果target.a 是一个 ref，那么就直接把值给它，不要让它 .value
       */
      return res.value
    }

    // 处理 reactive 字段是对象的情况
    if (isObject(res)) {
      // todo 源码会有一个 toReactive 的函数
      return reactive(res)
    }

    // 返回数据
    return res
  },
  set(target, key, newValue, receiver) {
    const oldValue = Reflect.get(target, key, receiver)
    const res = Reflect.set(target, key, newValue, receiver)

    /**
     * 如果更新了 state.a 它之前是个 ref，那么会修改原始的 ref.value 的值 等于 newValue
     * 如果 newValue 是一个 ref，那就算了
     *
     * 之前的 key 存的是 ref
     * 1. 给这个 key 赋值数据时 同步给之前的 ref 并由 ref 触发更新
     * 2. 如果赋值一个新的 ref 则无需同步继续往下走
     */
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      return res
    }

    // 只有新值 和 旧值不一样的时候才出发更新
    if (hasChanged(oldValue, newValue)) {
      // 先在上边设置数据 在触发更新
      trigger(target, key)
    }

    return res
  },
}
