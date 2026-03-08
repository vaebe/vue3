/**
 * 设置 dom 的 class
 * @param el dom 元素
 * @param value class
 */
export function patchClass(el: HTMLElement, value) {
  // 使用双等 null undefined 都会走到这里
  if (value == undefined) {
    // val 不存在清除 class
    el.removeAttribute('class')
  } else {
    // val 存在则进行设置
    el.className = value
  }
}
