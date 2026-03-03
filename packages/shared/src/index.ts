export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const hasChanged = (newValue, oldValue) => !Object.is(newValue, oldValue)
