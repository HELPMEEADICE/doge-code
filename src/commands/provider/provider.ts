import type { LocalCommandCall } from '../../types/command.js'
import {
  createCustomApiProviderEntry,
  formatCustomApiProviderIndex,
  formatCustomApiProviderType,
  getCustomApiProviderByIndex,
  persistCustomApiProviders,
  readCustomApiProvidersStorage,
  updateCustomApiProviders,
} from '../../utils/customApiStorage.js'

function renderProviderList(): string {
  const storage = readCustomApiProvidersStorage()
  const providers = storage.providers ?? []
  if (providers.length === 0) {
    return 'No providers configured. Use /provider add [name] [anthropic|openai|gemini].'
  }

  const lines = providers.map((provider, index) => {
    const currentMark = provider.id === storage.currentProviderId ? ' *' : ''
    return `${formatCustomApiProviderIndex(index)} ${provider.name} · ${formatCustomApiProviderType(provider.provider)}${currentMark}`
  })
  return ['Providers:', ...lines].join('\n')
}

function parseProviderType(value: string | undefined): 'anthropic' | 'openai' | 'gemini' | undefined {
  if (value === 'anthropic' || value === 'openai' || value === 'gemini') {
    return value
  }
  return undefined
}

function parseProviderIndex(value: string | undefined): number {
  if (!value) return -1
  const normalized = value.trim().replace(/^#/, '')
  const parsed = Number(normalized)
  return Number.isInteger(parsed) && parsed > 0 ? parsed - 1 : -1
}

export const call: LocalCommandCall = async (args, _context) => {
  const trimmed = args.trim()
  if (!trimmed) {
    return { type: 'text', value: renderProviderList() }
  }

  const [command, ...rest] = trimmed.split(/\s+/)
  if (command === 'info') {
    const storage = readCustomApiProvidersStorage()
    const index = Math.max(0, storage.providers?.findIndex(provider => provider.id === storage.currentProviderId) ?? 0)
    const provider = storage.providers?.[index]
    return {
      type: 'text',
      value: provider
        ? `Current provider: ${provider.name} (${formatCustomApiProviderIndex(index)})\nType: ${formatCustomApiProviderType(provider.provider)}\nBase URL: ${provider.baseURL ?? 'Not set'}\nModel: ${provider.model ?? 'Not set'}`
        : 'No provider configured.',
    }
  }

  if (command === 'use') {
    const index = parseProviderIndex(rest[0])
    const provider = getCustomApiProviderByIndex(index)
    if (!provider) {
      return { type: 'text', value: `Provider not found: ${rest[0] ?? ''}` }
    }
    persistCustomApiProviders({
      currentProviderId: provider.id,
      providers: readCustomApiProvidersStorage().providers ?? [],
    })
    if (provider.baseURL) process.env.ANTHROPIC_BASE_URL = provider.baseURL
    else delete process.env.ANTHROPIC_BASE_URL
    if (provider.apiKey) process.env.DOGE_API_KEY = provider.apiKey
    else delete process.env.DOGE_API_KEY
    if (provider.model) process.env.ANTHROPIC_MODEL = provider.model
    else delete process.env.ANTHROPIC_MODEL
    return { type: 'text', value: `Switched to ${provider.name} (${formatCustomApiProviderIndex(index)})` }
  }

  if (command === 'add') {
    const providerType = parseProviderType(rest[rest.length - 1])
    const name = providerType ? rest.slice(0, -1).join(' ').trim() : rest.join(' ').trim()
    const current = readCustomApiProvidersStorage()
    const nextProvider = createCustomApiProviderEntry((current.providers ?? []).length, {
      name: name || undefined,
      provider: providerType,
    })
    persistCustomApiProviders({
      currentProviderId: current.currentProviderId ?? nextProvider.id,
      providers: [...(current.providers ?? []), nextProvider],
    })
    return {
      type: 'text',
      value: `Added ${nextProvider.name} (${formatCustomApiProviderIndex((current.providers ?? []).length)})`,
    }
  }

  if (command === 'rename') {
    const index = parseProviderIndex(rest[0])
    const nextName = rest.slice(1).join(' ').trim()
    const provider = getCustomApiProviderByIndex(index)
    if (!provider || !nextName) {
      return { type: 'text', value: 'Usage: /provider rename <provider-number> <new-name>' }
    }
    updateCustomApiProviders(current => ({
      ...current,
      providers: (current.providers ?? []).map(item => item.id === provider.id ? { ...item, name: nextName } : item),
    }))
    return { type: 'text', value: `Renamed ${formatCustomApiProviderIndex(index)} to ${nextName}` }
  }

  if (command === 'remove') {
    const index = parseProviderIndex(rest[0])
    const provider = getCustomApiProviderByIndex(index)
    if (!provider) {
      return { type: 'text', value: 'Usage: /provider remove <provider-number>' }
    }
    const current = readCustomApiProvidersStorage()
    const remaining = (current.providers ?? []).filter(item => item.id !== provider.id)
    const nextCurrentProviderId = current.currentProviderId === provider.id ? remaining[0]?.id : current.currentProviderId
    persistCustomApiProviders({
      currentProviderId: nextCurrentProviderId,
      providers: remaining,
    })
    return { type: 'text', value: `Removed ${provider.name} (${formatCustomApiProviderIndex(index)})` }
  }

  return {
    type: 'text',
    value: 'Usage: /provider [info|use|add|rename|remove]',
  }
}
