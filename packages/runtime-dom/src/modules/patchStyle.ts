/**
 * 设置元素的 style 属性
 * @param el
 * @param prevValue
 * @param nextValue
 */
export function patchStyle(el: HTMLElement, prevValue, nextValue) {
  const style = el.style

  /**
   * 把新的样式全部生效，设置到 style 中
   */
  if (nextValue) {
    for (const key in nextValue) {
      style[key] = nextValue[key]
    }
  }

  // 清理上一次的属性
  if (prevValue) {
    for (const key in prevValue) {
      /**
       * 把之前有的，但是现在没有的，给它删掉
       * 之前是 { background:'red' } => { color:'red' } 就要把 backgroundColor 删掉，把 color 应用上
       */
      if (!(key in nextValue)) {
        style[key] = null
      }
    }
  }
}
