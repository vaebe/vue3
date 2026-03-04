import { Link, startTrack, endTrack, Sub } from './system'

// 用来保存当前正在执行的 effect
export let activeSub

export function setActiveSub(sub) {
  activeSub = sub
}

export class ReactiveEffect implements Sub {
  /**
   * 依赖项链表的头节点-单链表
   */
  deps: Link | undefined

  /**
   * 依赖项链表的尾节点
   */
  depsTail: Link | undefined

  // 追踪状态
  tracking: boolean

  // 使用脏检查来确定数据是否需要更新
  dirty: boolean = true

  // 表示当前是否激活
  active: boolean = true

  constructor(public fn) {}

  run() {
    // 如果未激活，则不收集依赖，直接调用 fn
    if (!this.active) {
      return this.fn()
    }

    // 将当前的 effect 保存起来用于处理嵌套的逻辑
    const prevSub = activeSub

    // 保存当前的 ReactiveEffect 让外部使用
    activeSub = this

    // 开始追踪依赖
    startTrack(this)

    try {
      return this.fn()
    } finally {
      // 结束追踪,清理依赖
      endTrack(this)
      // 执行完成之后 - 恢复之前的 effect
      activeSub = prevSub
    }
  }

  stop() {
    // 是激活状态才可以停止
    if (this.active) {
      // 开始追踪，会把 depsTail 设置为 undefined
      startTrack(this)
      // 结束追踪，中间没有收集依赖，所以 depsTail 为 true，deps 有，清理所有依赖，依赖清理完成，就不会再被触发了
      endTrack(this)

      this.active = false
    }
  }

  /**
   * 默认调用 run 方法，如果用户传了 scheduler 配置则会覆盖（原型属性高于实例属性）
   */
  scheduler() {
    this.run()
  }

  /**
   * 通知更新的方法，如果依赖发生变化，会调用这个函数
   */
  notify() {
    this.scheduler()
  }
}

export function effect(fn, opctions) {
  const e = new ReactiveEffect(fn)

  Object.assign(e, opctions)

  e.run()

  /**
   * 绑定函数的 this
   */
  const runner = e.run.bind(e)
  /**
   * 把 effect 实例放到函数属性中
   */
  runner.effect = e

  return runner
}
