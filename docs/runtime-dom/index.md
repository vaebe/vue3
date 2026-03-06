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
