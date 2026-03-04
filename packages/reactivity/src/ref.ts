import { ReactiveFlags } from './constants'
import { activeSub } from './effect'
import { propagate, link } from './system'
import type { Link, Dependency } from './system'
import { isObject, hasChanged } from '@vaebe-vue/shared'
import { reactive } from './reactive'

export class RefImpl<T = any> implements Dependency {
  _value: T
  public readonly [ReactiveFlags.IS_REF] = true

  /**
   * 订阅者链表头节点
   */
  subs: Link

  /**
   * 订阅者链表尾节点
   */
  subsTail: Link

  constructor(value: T) {
    this._value = isObject(value) ? reactive(value) : value
  }

  // 获取 value
  get value() {
    // 收集依赖 如果依赖存在 则进行保存
    if (activeSub) {
      trackRef(this)
    }

    // 获取的时候将保存的值返回
    return this._value
  }

  // 设置 value
  set value(newValue) {
    // 数据发生改变才出发更新
    if (hasChanged(newValue, this._value)) {
      // 设置的时候将值 保存到 _value
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      triggerRef(this)
    }
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

/**
 * 收集依赖创建 ref 与 effect 的关联
 * @param dep
 */
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep
 */
function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
