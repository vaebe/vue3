import { ReactiveFlags } from './constants'
import { activeSub } from './effect'

class RefImpl<T = any> {
  _value: T
  public readonly [ReactiveFlags.IS_REF] = true
  // 保存和 effect 的关联
  subs

  constructor(value: T) {
    this._value = value
  }

  // 获取 value
  get value() {
    // 收集依赖 如果依赖存在 则进行保存
    if (activeSub) {
      this.subs = activeSub
    }

    // 获取的时候将保存的值返回
    return this._value
  }

  // 设置 value
  set value(newValue) {
    // 设置的时候将值 保存到 _value
    this._value = newValue

    // 重新执行 effect 依赖，获取最新的数据
    this.subs?.()
  }
}

// 创建一个 ref
export function ref(rawValue: unknown) {
  return new RefImpl(rawValue)
}

// 判断传入的数据是否是 ref
export function isRef(r: any) {
  return r ? r[ReactiveFlags.IS_REF] === true : false
}
