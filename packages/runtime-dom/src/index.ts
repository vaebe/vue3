export * from '@vaebe-vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

const renderOptions = { ...nodeOps, patchProp }

export { renderOptions }
