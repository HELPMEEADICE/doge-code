import type { Command } from '../../commands.js'
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand.js'
import {
  getSettings_DEPRECATED,
} from '../../utils/settings/settings.js'
import {
  getUserSpecifiedModelSetting,
  renderActiveModelSetting,
  renderModelSetting,
} from '../../utils/model/model.js'

function getTierSummary(): string {
  const selection = getSettings_DEPRECATED()?.modelSelection
  const fast = selection?.fast
    ? renderModelSetting(
        typeof selection.fast === 'string' ? selection.fast : selection.fast.model,
      )
    : 'Default'
  const balance = selection?.balance
    ? renderModelSetting(
        typeof selection.balance === 'string'
          ? selection.balance
          : selection.balance.model,
      )
    : 'Default'
  const quality = selection?.quality
    ? renderModelSetting(
        typeof selection.quality === 'string'
          ? selection.quality
          : selection.quality.model,
      )
    : 'Default'

  const active = renderActiveModelSetting(getUserSpecifiedModelSetting() ?? null)

  return `Active ${active} · Fast ${fast} · Balance ${balance} · Quality ${quality}`
}

export default {
  type: 'local-jsx',
  name: 'model-selection',
  get description() {
    return `Configure Fast / Balance / Quality model mappings (${getTierSummary()})`
  },
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate()
  },
  load: () => import('./model-selection.js'),
} satisfies Command
