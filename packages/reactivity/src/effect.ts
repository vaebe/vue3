// 用来保存当前正在执行的 effect
export let activeSub

export function effect(fn) {
  activeSub = fn
  activeSub()
  activeSub = undefined
}
