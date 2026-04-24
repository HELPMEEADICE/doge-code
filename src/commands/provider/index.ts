import type { Command } from '../../commands.js'

const provider = {
  type: 'local-jsx',
  name: 'provider',
  description: 'View and manage compatible API providers',
  argumentHint: '[info|use|add|rename|remove]',
  supportsNonInteractive: false,
  immediate: true,
  load: () => import('./provider-ui.js'),
} satisfies Command

export default provider
