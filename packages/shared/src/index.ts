/**
 * 判断是否是对象 object
 * @param val
 * @returns boolean
 */
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

/**
 * 判断两个值是否相等
 * @param newValue
 * @param oldValue
 * @returns boolean
 */
export const hasChanged = (newValue, oldValue) => !Object.is(newValue, oldValue)

/**
 * 判断是是否是 函数
 * @param val
 * @returns
 */
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

/**
 * 判断是不是 on 开头的事件
 * @param val
 * @returns
 */
export const isOn = (val: string) => /^on[A-Z]/.test(val)
