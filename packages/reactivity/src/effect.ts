// 用来保存当前正在执行的 effect
export let activeSub

export class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // 将当前的 effect 保存起来用于处理嵌套的逻辑
    const prevSub = activeSub

    // 保存当前的 ReactiveEffect 让外部使用
    activeSub = this

    try {
      return this.fn()
    } catch {
      // 执行完成之后 - 恢复之前的 effect
      activeSub = prevSub
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
