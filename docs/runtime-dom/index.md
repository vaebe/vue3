# runtime-dom

runtime-dom 这个模块的主要功能，就是提供渲染器，

```ts
import { render, h } from 'vue'

// 创建一个虚拟 DOM
const vnode = h('div', 'hello world')

// 将虚拟 DOM 渲染到 id 为 app 的元素中
render(vnode, document.querySelector('#app'))
```

## 整体架构

Vue 的渲染器主要负责将虚拟 DOM 转换为真实 DOM，核心包含以下几个部分：

1. renderOptions：渲染器配置项，包含所有 DOM 操作的方法
2. nodeOps：封装了原生 DOM API
3. patchProp：负责处理元素属性的更新

## 节点操作（nodeOps）

由于虚拟 dom 可以跨平台，所以我们不会在运行时直接操作 dom，针对节点操作，更倾向于各个平台自助传递节点操作的 API，当然 runtime-dom 是 vue 内部提供的浏览器 DOM 操作 API，如果是其平台，由框架设计者自由封装
nodeOps 封装了所有 DOM 节点的基础操作，包括：

- insert：插入节点
- createElement：创建元素
- remove：移除元素
- setElementText：设置元素文本内容
- createText：创建文本节点
- setText：设置节点文本
- parentNode：获取父节点
- nextSibling：获取下一个兄弟节点
- querySelector：DOM 查询

```ts
/**
 * 封装 dom 节点操作的 API
 */

export const nodeOps = {
  // 插入节点
  insert(el, parent, anchor) {
    // insertBefore 如果第二个参数为 null，那它就等于 appendChild
    parent.insertBefore(el, anchor || null)
  },
  // 创建元素
  createElement(type) {
    return document.createElement(type)
  },
  // 移除元素
  remove(el) {
    const parentNode = el.parentNode
    if (parentNode) {
      parentNode.removeChild(el)
    }
  },
  // 设置元素的 text
  setElementText(el, text) {
    el.textContent = text
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text)
  },
  // 设置 nodeValue
  setText(node, text) {
    return (node.nodeValue = text)
  },
  // 获取到父节点
  parentNode(el) {
    return el.parentNode
  },
  // 获取到下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling
  },
  // dom 查询
  querySelector(selector) {
    return document.querySelector(selector)
  },
}
```

## 属性更新（patchProp）

patchProp 负责处理元素属性的更新，根据属性类型分发到不同的处理函数：

```ts
/**
 * 属性更新的统一入口
 * 根据属性 key 的类型，分发到对应的处理函数
 * @param el - 目标 DOM 元素
 * @param key - 属性名称
 * @param prevValue - 旧的属性值
 * @param nextValue - 新的属性值
 */
export function patchProp(
  el: HTMLElement,
  key: PatchPropKey,
  prevValue,
  nextValue,
) {
  // class 属性使用 className 设置，性能更好
  if (key === 'class') {
    return patchClass(el, nextValue)
  }

  // style 属性需要对比新旧值，清理不再需要的样式
  if (key === 'style') {
    return patchStyle(el, prevValue, nextValue)
  }

  // 事件属性（以 on 开头，后面跟大写字母，如 onClick）
  if (isOn(key)) {
    return patchEvent(el, key, nextValue)
  }

  // 其他普通属性（如 id、src、href 等）
  patchAttr(el, key, nextValue)
}
```

最终会将 nodeOps 和 patchProp 合并为 renderOptions 导出：

```ts
const renderOptions = { ...nodeOps, patchProp }
```

### patchClass

处理元素的 class 属性：

```ts
/**
 * 设置 DOM 元素的 class 属性
 * @param el - 目标 DOM 元素
 * @param value - class 值，可以是字符串或 undefined
 */
export function patchClass(el: HTMLElement, value) {
  // 使用双等号，null 和 undefined 都会进入此分支
  if (value == undefined) {
    // 值不存在则移除 class 属性
    el.removeAttribute('class')
  } else {
    // 使用 className 直接设置，比 setAttribute 性能更好
    el.className = value
  }
}
```

### patchStyle

处理元素的 style 属性，支持新旧样式的对比更新：

```ts
/**
 * 设置 DOM 元素的 style 属性
 * 通过对比新旧样式值，实现样式的增量更新
 * @param el - 目标 DOM 元素
 * @param prevValue - 旧的样式对象
 * @param nextValue - 新的样式对象
 */
export function patchStyle(el: HTMLElement, prevValue, nextValue) {
  // 获取元素的 style 对象
  const style = el.style

  // 遍历新样式对象，将所有样式应用到元素上
  if (nextValue) {
    for (const key in nextValue) {
      style[key] = nextValue[key]
    }
  }

  // 清理旧样式中存在但新样式中不存在的属性
  if (prevValue) {
    for (const key in prevValue) {
      // 如果新样式中没有这个属性，就将其置为 null（相当于移除）
      // 之前: { background: 'red' }
      // 之后: { color: 'red' }
      // 结果: background 被移除，color 被添加
      if (!(key in nextValue)) {
        style[key] = null
      }
    }
  }
}
```

例如：`{ background: 'red' }` 变为 `{ color: 'red' }` 时，会移除 `background` 并添加 `color`。

### patchEvent

处理事件绑定，使用 **invoker 模式** 实现高效的事件换绑：

```ts
/**
 * 创建事件调用器（invoker）
 * invoker 是一个包装函数，内部保存真正的事件处理函数
 * 当需要更新事件时，只需修改 invoker.value，无需重新绑定事件
 * @param val - 实际的事件处理函数
 * @returns 包装后的事件调用器
 */
function createInvoker(val) {
  const invoker = (e) => {
    // 调用 invoker.value 中保存的实际事件处理函数
    invoker.value(e)
  }
  // 在 invoker 上挂载 value 属性，保存实际的事件处理函数
  invoker.value = val

  return invoker
}

// 用于在 DOM 元素上保存事件映射表的 Symbol key
// 避免与元素的其他属性冲突
const veiKey = Symbol('_vei')

/**
 * 处理 DOM 元素的事件绑定
 * 使用 invoker 模式，实现事件的高效换绑
 * @param el - 目标 DOM 元素
 * @param rawName - 原始事件名（如 onClick）
 * @param nextValue - 新的事件处理函数
 */
export function patchEvent(el: HTMLElement, rawName, nextValue) {
  // 从原始名称中提取事件名：onClick -> click
  const name = rawName.slice(2).toLocaleLowerCase()

  // 获取或创建元素上的事件映射表
  // el[veiKey] 等同于 el._vei，用于存储所有事件的 invoker
  const invokers = (el[veiKey] ??= {})

  // 获取该事件之前绑定的 invoker（如果存在）
  const existingInvoker = invokers[rawName]

  if (nextValue) {
    // 新的事件处理函数存在
    if (existingInvoker) {
      // 如果之前已经绑定了 invoker，只需更新 invoker.value
      // 这样就完成了事件换绑，无需 removeEventListener + addEventListener
      existingInvoker.value = nextValue
      return
    }

    // 之前没有绑定过，创建新的 invoker
    const invoker = createInvoker(nextValue)
    // 将 invoker 保存到映射表中
    invokers[rawName] = invoker
    // 使用 addEventListener 绑定事件，处理函数是 invoker
    el.addEventListener(name, invoker)
  } else {
    // 新的事件处理函数不存在，需要移除事件
    if (existingInvoker) {
      // 移除事件监听
      el.removeEventListener(name, existingInvoker)
      // 清空映射表中的记录
      invokers[rawName] = undefined
    }
  }
}
```

**事件换绑原理**：通过 `invoker.value` 保存实际的事件处理函数，更新事件时只需修改 `invoker.value`，无需调用 `removeEventListener` 和 `addEventListener`，提升性能。

### patchAttr

处理普通 HTML 属性：

```ts
/**
 * 设置 DOM 元素的普通属性
 * 如 id、src、href、disabled 等
 * @param el - 目标 DOM 元素
 * @param key - 属性名称
 * @param value - 属性值
 */
export function patchAttr(el: HTMLElement, key, value) {
  // 使用双等号，null 和 undefined 都会进入此分支
  if (value == undefined) {
    // 值不存在则移除属性
    el.removeAttribute(key)
  } else {
    // 设置属性值
    el.setAttribute(key, value)
  }
}
```

## 工具函数

在 `@vaebe-vue/shared` 中新增了 `isOn` 函数，用于判断是否是事件名称：

```ts
export const isOn = (val: string) => /^on[A-Z]/.test(val)
```

匹配以 `on` 开头且后面跟着大写字母的属性名，如 `onClick`、`onMousedown` 等。
