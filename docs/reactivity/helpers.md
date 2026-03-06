# 辅助函数

响应式工具函数：`toRef`、`toRefs`、`unRef`、`proxyRefs`。

## toRef

将响应式对象的某个属性转换为 ref。

### toRef 基本用法

```typescript
import { reactive, toRef } from '@vaebe-vue/reactivity'

const obj = reactive({ name: '张三', age: 19 })
const name = toRef(obj, 'name')

console.log(name.value) // '张三'
name.value = '李四'
console.log(obj.name) // '李四'
```

### toRef 实现原理

```typescript
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

export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}
```

### 特点

- 返回的 ref 与原对象属性保持同步
- 修改 ref.value 会更新原对象
- 修改原对象属性会反映到 ref

## toRefs

将响应式对象解构为普通对象，每个属性都是 ref。

### toRefs 基本用法

```typescript
import { reactive, toRefs } from '@vaebe-vue/reactivity'

const obj = reactive({ name: '张三', age: 19 })
const { name, age } = toRefs(obj)

console.log(name.value) // '张三'
age.value = 20
console.log(obj.age) // 20
```

### toRefs 实现原理

```typescript
export function toRefs(target) {
  const res = {}

  // 遍历对象生成 ref
  for (const key in target) {
    res[key] = new ObjectRefImpl(target, key)
  }

  return res
}
```

### 使用场景

解构响应式对象时保持响应性：

```typescript
// ❌ 错误：解构后失去响应性
const { name, age } = reactive({ name: '张三', age: 19 })

// ✅ 正确：使用 toRefs 保持响应性
const { name, age } = toRefs(reactive({ name: '张三', age: 19 }))
```

## unRef

如果参数是 ref，返回其内部值；否则返回参数本身。

### unRef 基本用法

```typescript
import { ref, unRef } from '@vaebe-vue/reactivity'

const count = ref(0)
console.log(unRef(count)) // 0
console.log(unRef(1)) // 1
```

### unRef 实现原理

```typescript
export function unRef(val) {
  return isRef(val) ? val.value : val
}
```

### 等价写法

```typescript
// unRef(val) 是以下代码的语法糖
val = isRef(val) ? val.value : val
```

## proxyRefs

代理 refs 对象，自动解包访问，无需 `.value`。

### proxyRefs 基本用法

```typescript
import { reactive, toRefs, proxyRefs, effect } from '@vaebe-vue/reactivity'

const obj = reactive({ name: '张三', age: 19 })
const state = proxyRefs(toRefs(obj))

// 直接访问，无需 .value
console.log(state.name) // '张三'
state.age = 20 // 直接赋值
```

### proxyRefs 实现原理

```typescript
export function proxyRefs(target) {
  return new Proxy(target, {
    get(...args) {
      const val = Reflect.get(...args)
      // 自动解包 ref
      return unRef(val)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]

      // 如果旧值是 ref，新值不是 ref，则更新旧值的 .value
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }

      return Reflect.set(target, key, newValue, receiver)
    },
  })
}
```

### 示例

```typescript
const obj = reactive({ name: '张三', age: 19 })
const state = proxyRefs({ ...toRefs(obj) })

effect(() => {
  console.log(state.name, state.age)
})

setTimeout(() => {
  state.age = 20 // 自动触发更新
}, 1000)
```

## API 总结

| 函数              | 说明                            |
| ----------------- | ------------------------------- |
| `toRef(obj, key)` | 将响应式对象的单个属性转为 ref  |
| `toRefs(obj)`     | 将响应式对象的所有属性转为 refs |
| `unRef(val)`      | 自动解包 ref，非 ref 返回原值   |
| `proxyRefs(obj)`  | 代理 refs 对象，自动解包访问    |
