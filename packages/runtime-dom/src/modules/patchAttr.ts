/**
 * 设置 attr 属性
 * @param el
 * @param key
 * @param value
 */
export function patchAttr(el: HTMLElement, key, value) {
  if (value == undefined) {
    // null undefined 那就理解为要移除
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
