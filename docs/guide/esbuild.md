# 配置 esbuild 打包

本项目使用 esbuild 进行极速构建。

## 开发脚本

`scripts/dev.js` 是开发构建脚本，支持监听文件变化并自动重新构建：

```javascript
import * as esbuild from 'esbuild'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const args = require('minimist')(process.argv.slice(2))
const target = args._[0] || 'reactivity'
const format = args.format || 'esm'

const pkg = require(`../packages/${target}/package.json`)

const outfile = `dist/${target}.${format}.js`

const ctx = await esbuild.context({
  entryPoints: [`packages/${target}/src/index.ts`],
  outfile,
  bundle: true,
  sourcemap: true,
  format,
  platform: format === 'cjs' ? 'node' : 'browser',
  globalName: pkg.buildOptions?.name
})

await ctx.watch()
console.log('watching...')
```

## 使用方式

```bash
# 构建 reactivity 模块 (ESM 格式)
pnpm dev reactivity --format esm

# 构建 reactivity 模块 (CommonJS 格式)
pnpm dev reactivity --format cjs

# 构建 vue 模块
pnpm dev vue --format esm
```

## 输出文件

构建后的文件位于各包的 `dist/` 目录：

- `{package}.esm.js` - ES Module 格式
- `{package}.cjs.js` - CommonJS 格式
- `{package}.esm.js.map` - Source Map 文件
