# vaebe-vue

## pnpm

安装子包 `pnpm install @vaebe-vue/shared --workspace --filter @vaebe-vue/reactivity` 这行命令的含义是将 `shared` 包安装到 `reactivity` 的 `ppackage.jsone` 中

## 依赖关系

- `runtime-core` 依赖 `reactivity`
- `runtime-dom` 依赖 `runtime-core`
- `vue` 包导出了 `runtime-dom`
