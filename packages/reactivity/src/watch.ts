import { isRef } from './ref'
import { isReactive } from './reactive'
import { isFunction, isObject } from '@vaebe-vue/shared'
import { ReactiveEffect } from './effect'
/**
 * watch
 * @param source 监听的数据
 * @param cb 回调函数
 * @param options 配置 {immediate, deep, once}
 */
export function watch(source, cb, options) {
  let { immediate, deep, once } = options || {}

  // once 执行一次后停止监听
  if (once) {
    const _cb = cb
    // 包装 cb
    cb = (...args) => {
      _cb(...args) // 执行原回调
      stop() // 停止监听
    }
  }

  /**
   * getter 函数 用于获取监听源的值

   */
  let getter

  /**
   * watch 支持 ref、reactive、自定义函数, 下边做对应的处理
   */
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    if (!deep) {
      deep = true
    }
  } else if (isFunction(source)) {
    getter = source
  }

  // deep 可以传数字 - 获取到 getter 才可以执行后续的逻辑
  if (deep) {
    // 如果 deep 为 true，则调用 traverse 函数，递归触发 getter
    const baseGetter = getter

    // 如果 deep === true 则需要递归处理全部层级,否则只处理 传入的 deep 层级
    const depth = deep === true ? Infinity : deep

    // 递归调用
    getter = () => traverse(baseGetter(), depth)
  }

  // 保存执行后的清理函数
  let cleanup = null

  /**
   * 清理函数, 这里将用户传入清理函数保存起来  https://cn.vuejs.org/api/options-state.html#watch
   * @param cb onCleanup: (cleanupFn: () => void) => void
   */
  function onCleanup(cb) {
    cleanup = cb
  }

  // 创建一个 effect
  const effect = new ReactiveEffect(getter)

  // 旧的值
  let oldValue

  function job() {
    if (cleanup) {
      cleanup()
      cleanup = null
    }

    // 执行 effect 获取新的值
    const newValue = effect.run()
    // 调用回调函数 传入新值和旧值
    cb(newValue, oldValue, onCleanup)

    // 将 newValue 赋值给 oldValue 下次执行时 新的就变成了旧的值
    oldValue = newValue
  }

  // 设置调度器，当依赖变化时触发回调
  effect.scheduler = job

  // 传入 immediate 立即执行一次 job ,否则执行 effect.run 收集依赖
  if (immediate) {
    job()
  } else {
    // 先执行一次，收集依赖
    oldValue = effect.run()
  }

  function stop() {
    effect.stop()
  }

  return stop
}

// 递归处理数据
function traverse(value, depth = Infinity, seen = new Set()) {
  // 不是对象 或者层级已经遍历完成 直接返回
  if (!isObject(value) || depth <= 0) {
    return value
  }

  // 处理栈溢出-依赖数据循环引用
  if (seen.has(value)) {
    return value
  }

  // 层级 -1
  depth--
  // 已经处理的数据添加到 seen 中
  seen.add(value)

  for (const key in value) {
    // 递归触发 getter
    traverse(value[key], depth, seen)
  }

  return value
}
