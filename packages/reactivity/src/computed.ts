import { isFunction, hasChanged } from '@vaebe-vue/shared'
import { link, endTrack, startTrack } from './system'
import type { Sub, Dependency, Link } from './system'
import { ReactiveFlags } from './constants'
import { activeSub, setActiveSub } from './effect'

export class ComputedRefImpl<T = any> implements Sub, Dependency {
  _value: T
  public readonly [ReactiveFlags.IS_REF] = true

  // 作为 Dependency 的属性
  subs: Link // 订阅者链表头节点
  subsTail: Link // 订阅者链表尾节点

  // 作为 Sub 的属性
  deps: Link // 依赖项链表头节点
  depsTail: Link // 依赖项链表尾节点

  // 追踪状态
  tracking: boolean

  // 使用脏检查来确定数据是否需要更新
  dirty: boolean = true

  constructor(
    public fn, // getter
    private setter,
  ) {}

  get value() {
    // 如果计算属性脏了 就需要执行更新
    if (this.dirty) {
      this.update()
    }

    // 如果当前有活跃的订阅者，就建立订阅关系
    if (activeSub) {
      link(this, activeSub)
    }

    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('computed 只读,无法赋值')
    }
  }

  update() {
    // 将当前的 effect 保存起来用于处理嵌套的逻辑
    const prevSub = activeSub

    // 保存当前的 ReactiveEffect 让外部使用
    setActiveSub(this)

    // 开始追踪依赖
    startTrack(this)

    try {
      // 旧值
      const oldValue = this._value

      // 执行 fn 后获取到新值
      this._value = this.fn()

      // 返回值有没有变化
      return hasChanged(this._value, oldValue)
    } finally {
      // 结束追踪,清理依赖
      endTrack(this)
      // 执行完成之后 - 恢复之前的 effect
      setActiveSub(prevSub)
    }
  }
}

/**
 *计算属性
 * @param getterOrOptions 一个函数或者是一个对象 {get: () => {}, set: () => {}}
 */
export function computed(getterOrOptions) {
  let getter, setter

  // 是函数的话 默认赋值给 get
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
