import { patchClass } from './modules/patchClass'
import { patchStyle } from './modules/patchStyle'
import { patchEvent } from './modules/patchEvent'
import { isOn } from '@vaebe-vue/shared'
import { patchAttr } from './modules/patchAttr'

type PatchPropKey = 'class' | 'style' | 'event' | 'attr'

/**
 *
 * @param el dom 元素
 * @param key 'class' | 'style' | 'event' | 'attr'
 * @param prevValue 上一次的属性
 * @param nextValue 下一次的属性
 */
export function patchProp(
  el: HTMLElement,
  key: PatchPropKey,
  prevValue,
  nextValue,
) {
  if (key === 'class') {
    return patchClass(el, nextValue)
  }

  if (key === 'style') {
    return patchStyle(el, prevValue, nextValue)
  }

  if (isOn(key)) {
    return patchEvent(el, key, nextValue)
  }

  patchAttr(el, key, nextValue)
}
