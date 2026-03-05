# 项目工程搭建

本项目采用 pnpm monorepo 架构，使用 TypeScript 编写。

## pnpm workspace 配置

在项目根目录创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - 'packages/*'
  - 'docs'
```

## 目录结构

```
mini-vue3/
├── packages/
│   ├── reactivity/       # 响应式核心模块
│   │   └── src/
│   │       ├── index.ts        # 模块入口
│   │       ├── reactive.ts     # reactive 实现
│   │       ├── ref.ts          # ref 实现
│   │       ├── effect.ts       # 副作用函数
│   │       ├── computed.ts     # 计算属性
│   │       ├── watch.ts        # 侦听器
│   │       ├── dep.ts          # 依赖收集
│   │       └── system.ts       # 核心链表实现
│   ├── shared/           # 公共工具模块
│   │   └── src/
│   │       └── index.ts
│   └── vue/              # Vue 主入口
│       └── src/
│           └── index.ts
├── docs/                 # 文档
├── scripts/              # 构建脚本
│   └── dev.js
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 包依赖关系

```
@vaebe-vue/vue
    └── @vaebe-vue/reactivity
            └── @vaebe-vue/shared
```
