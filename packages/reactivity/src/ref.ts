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

class ObjectRefImpl {
  [ReactiveFlags.IS_REF] = true

  constructor(
    public _object,
    public _key,
  ) {}

  get value() {
    return this._object[this._key]
  }

  set value(newValue) {
    this._object[this._key] = newValue
  }
}

/**
 * 响应式对象转 ref https://cn.vuejs.org/api/reactivity-utilities.html#toref
 * @param target
 * @param key
 */
export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

/**
 * 将响应式数据解构返回
 * @param target 必须是响应式对象
 * @returns
 */
export function toRefs(target) {
  const res = {}

  // 遍历对象生成 ref
  for (const key in target) {
    res[key] = new ObjectRefImpl(target, key)
  }

  return res
}

/**
 * 如果参数是 ref，则返回内部值，否则返回参数本身。这是 val = isRef(val) ? val.value : val 计算的一个语法糖。
 * @param r
 * @returns
 */
export function unRef(val) {
  return isRef(val) ? val.value : val
}

/**
 * 代理 Refs, 去除访问 toRefs 转换后数据 需要使用 .value 访问的情况
 * reactive -> toRefs -> proxyRefs
 * @param target
 * @returns
 */
export function proxyRefs(target) {
  return new Proxy(target, {
    get(...args) {
      const val = Reflect.get(...args)
      // 使用 unRef 自动解包 ref
      return unRef(val)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]

      /**
       * 如果更新了 state.a 它之前是个 ref，那么会修改原始的 ref.value 的值 等于 newValue
       * 如果 newValue 是一个 ref，那就算了
       *
       * 之前的 key 存的是 ref
       * 1. 给这个 key 赋值数据时 同步给之前的 ref 并由 ref 触发更新
       * 2. 如果赋值一个新的 ref 则无需同步继续往下走
       */
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }

      return Reflect.set(target, key, receiver)
    },
  })
}
