function createInvoker(val) {
  /**
   * 创建一个事件处理函数，内部调用 invoker.value
   * 如果需要更新事件，那后面直接修改 invoker.value 就可以完成事件换绑
   * @param e
   */
  const invoker = e => {
    invoker.value(e)
  }
  invoker.value = val

  return invoker
}

// 在 dom 保存的属性 key
const veiKey = Symbol('_vei')

/**
 * 事件绑定处理
 * @param el dom 元素
 * @param rawName 需要绑定的事件名称
 * @param nextValue 需要绑定的事件
 */
export function patchEvent(el: HTMLElement, rawName, nextValue) {
  const name = rawName.slice(2).toLocaleLowerCase()
  /**
   * 获取已经保存的属性
   * 等于 el._vei = el._vei ?? {}
   */
  const invokers = (el[veiKey] ??= {})

  // 拿到之前绑定的 invoker
  const existingInvoker = invokers[rawName]
  if (nextValue) {
    // 如果之前绑定了，那就更新 invoker.value 完成事件换绑
    if (existingInvoker) {
      existingInvoker.value = nextValue
      return
    }

    // 创建一个新的 invoker
    const invoker = createInvoker(nextValue)
    /**
     * 放到 invokers 里面去，invokers 就是 el._vei 对象
     */
    invokers[rawName] = invoker
    // 绑定事件，事件处理函数是 invoker
    el.addEventListener(name, invoker)
  } else {
    /**
     * 如果新的事件没有，老的有，就移除事件
     */

    if (existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}
