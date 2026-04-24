import { isClaudeAISubscriber } from './auth.js'
import { parseModelContextSuffix, stripModelContextSuffix } from './context.js'
import { isClaudeModel } from './model/model.js'

export function isBilledAsExtraUsage(
  model: string | null,
  isFastMode: boolean,
  isOpus1mMerged: boolean,
): boolean {
  if (!isClaudeAISubscriber()) return false
  if (isFastMode) return true
  if (model === null || !parseModelContextSuffix(model) || !isClaudeModel(model)) {
    return false
  }

  const m = stripModelContextSuffix(model).toLowerCase()
  const isOpus46 = m === 'opus' || m.includes('opus-4-6')
  const isSonnet46 = m === 'sonnet' || m.includes('sonnet-4-6')

  if (isOpus46 && isOpus1mMerged) return false

  return isOpus46 || isSonnet46
}
