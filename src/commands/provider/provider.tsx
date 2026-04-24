import React, { useMemo, useState } from 'react'
import type { CommandResultDisplay } from '../../commands.js'
import { Select } from '../../components/CustomSelect/index.js'
import { Dialog } from '../../components/design-system/Dialog.js'
import TextInput from '../../components/TextInput.js'
import { Box, Text } from '../../ink.js'
import { Pane } from '../../components/design-system/Pane.js'
import type { LocalJSXCommandCall } from '../../types/command.js'
import {
  createCustomApiProviderEntry,
  formatCustomApiProviderIndex,
  formatCustomApiProviderType,
  persistCustomApiProviders,
  readCustomApiProvidersStorage,
  updateCustomApiProviders,
  type CustomApiProvider,
  type CustomApiProviderEntry,
} from '../../utils/customApiStorage.js'

type ProviderScreen =
  | { type: 'list' }
  | { type: 'detail'; providerId: string }
  | { type: 'edit-text'; providerId: string; field: 'name' | 'baseURL' | 'apiKey' | 'model'; title: string; placeholder: string }
  | { type: 'edit-type'; providerId: string }
  | { type: 'confirm-delete'; providerId: string }

const ADD_PROVIDER = '__ADD_PROVIDER__'

type Props = {
  onDone: (result?: string, options?: { display?: CommandResultDisplay }) => void
}

function getProvider(providerId: string): CustomApiProviderEntry | undefined {
  return readCustomApiProvidersStorage().providers?.find(provider => provider.id === providerId)
}

function syncProviderEnv(provider: CustomApiProviderEntry | undefined): void {
  if (provider?.baseURL) process.env.ANTHROPIC_BASE_URL = provider.baseURL
  else delete process.env.ANTHROPIC_BASE_URL
  if (provider?.apiKey) process.env.DOGE_API_KEY = provider.apiKey
  else delete process.env.DOGE_API_KEY
  if (provider?.model) process.env.ANTHROPIC_MODEL = provider.model
  else delete process.env.ANTHROPIC_MODEL
}

function ProviderCommand({ onDone }: Props): React.ReactNode {
  const [screen, setScreen] = useState<ProviderScreen>({ type: 'list' })
  const [inputValue, setInputValue] = useState('')
  const [cursorOffset, setCursorOffset] = useState(0)
  const storage = readCustomApiProvidersStorage()
  const providers = storage.providers ?? []

  const listOptions = useMemo(() => {
    return [
      ...providers.map((provider, index) => ({
        label: `${provider.name} ${provider.id === storage.currentProviderId ? ' *' : ''}`,
        value: provider.id,
        description: `${formatCustomApiProviderIndex(index)} · ${formatCustomApiProviderType(provider.provider)}`,
      })),
      {
        label: 'Add Provider...',
        value: ADD_PROVIDER,
        description: 'Create a new provider',
      },
    ]
  }, [providers, storage.currentProviderId])

  if (screen.type === 'list') {
    return (
      <Pane color="permission">
        <Dialog
          title="Providers"
          subtitle="Enter to view and edit a provider."
          onCancel={() => onDone('Provider manager dismissed', { display: 'system' })}
        >
          <Select
            options={listOptions}
            onChange={value => {
              if (value === ADD_PROVIDER) {
                const current = readCustomApiProvidersStorage()
                const nextProvider = createCustomApiProviderEntry((current.providers ?? []).length)
                persistCustomApiProviders({
                  currentProviderId: current.currentProviderId ?? nextProvider.id,
                  providers: [...(current.providers ?? []), nextProvider],
                })
                setScreen({ type: 'detail', providerId: nextProvider.id })
                return
              }
              setScreen({ type: 'detail', providerId: value })
            }}
            onCancel={() => onDone('Provider manager dismissed', { display: 'system' })}
            visibleOptionCount={10}
          />
        </Dialog>
      </Pane>
    )
  }

  if (screen.type === 'detail') {
    const provider = getProvider(screen.providerId)
    if (!provider) {
      setScreen({ type: 'list' })
      return null
    }
    const detailOptions = [
      { label: `Name: ${provider.name ?? 'Not set'}`, value: 'name', description: 'Rename provider' },
      { label: `API format: ${formatCustomApiProviderType(provider.provider)}`, value: 'type', description: 'Change API type' },
      { label: `Base URL: ${provider.baseURL ?? 'Not set'}`, value: 'baseURL', description: 'Edit endpoint URL' },
      { label: `API Key: ${provider.apiKey ? 'Configured' : 'Not set'}`, value: 'apiKey', description: 'Edit API key' },
      { label: `Default model: ${provider.model ?? 'Not set'}`, value: 'model', description: 'Edit default model' },
      { label: 'Delete provider', value: 'delete', description: 'Remove this provider' },
    ]
    return (
      <Pane color="permission">
        <Dialog
          title={`${provider.name} (${formatCustomApiProviderIndex(providers.findIndex(item => item.id === provider.id))})`}
          subtitle="Enter to edit a field. Esc to go back."
          onCancel={() => setScreen({ type: 'list' })}
        >
          <Select
            options={detailOptions}
            onChange={value => {
              if (value === 'type') {
                setScreen({ type: 'edit-type', providerId: provider.id })
                return
              }
              if (value === 'delete') {
                setScreen({ type: 'confirm-delete', providerId: provider.id })
                return
              }
              if (value === 'name') {
                setInputValue(provider.name ?? '')
                setCursorOffset(0)
                setScreen({ type: 'edit-text', providerId: provider.id, field: 'name', title: 'Edit provider name', placeholder: 'Enter provider name' })
                return
              }
              if (value === 'baseURL') {
                setInputValue(provider.baseURL ?? '')
                setCursorOffset(0)
                setScreen({ type: 'edit-text', providerId: provider.id, field: 'baseURL', title: 'Edit base URL', placeholder: 'Enter base URL' })
                return
              }
              if (value === 'apiKey') {
                setInputValue(provider.apiKey ?? '')
                setCursorOffset(0)
                setScreen({ type: 'edit-text', providerId: provider.id, field: 'apiKey', title: 'Edit API key', placeholder: 'Enter API key' })
                return
              }
              setInputValue(provider.model ?? '')
              setCursorOffset(0)
              setScreen({ type: 'edit-text', providerId: provider.id, field: 'model', title: 'Edit default model', placeholder: 'Enter model ID' })
            }}
            onCancel={() => setScreen({ type: 'list' })}
            visibleOptionCount={10}
          />
        </Dialog>
      </Pane>
    )
  }

  if (screen.type === 'edit-type') {
    const provider = getProvider(screen.providerId)
    if (!provider) {
      setScreen({ type: 'list' })
      return null
    }
    const typeOptions = [
      { label: 'Anthropic-compatible', value: 'anthropic', description: 'Anthropic API-compatible endpoint' },
      { label: 'OpenAI-compatible', value: 'openai', description: 'OpenAI-compatible endpoint' },
      { label: 'Gemini API', value: 'gemini', description: 'Gemini-compatible endpoint' },
    ]
    return (
      <Pane color="permission">
        <Dialog title="Edit API format" subtitle="Select the provider API type." onCancel={() => setScreen({ type: 'detail', providerId: provider.id })}>
          <Select
            options={typeOptions}
            onChange={value => {
              updateCustomApiProviders(current => ({
                ...current,
                providers: (current.providers ?? []).map(item => item.id === provider.id ? {
                  ...item,
                  provider: value as CustomApiProvider,
                  openaiCompatMode: value === 'openai' ? item.openaiCompatMode ?? 'chat_completions' : undefined,
                } : item),
              }))
              syncProviderEnv(getProvider(provider.id))
              setScreen({ type: 'detail', providerId: provider.id })
            }}
            onCancel={() => setScreen({ type: 'detail', providerId: provider.id })}
          />
        </Dialog>
      </Pane>
    )
  }

  if (screen.type === 'confirm-delete') {
    const provider = getProvider(screen.providerId)
    if (!provider) {
      setScreen({ type: 'list' })
      return null
    }
    return (
      <Pane color="permission">
        <Dialog title="Delete provider" subtitle={`Delete ${provider.name}?`} onCancel={() => setScreen({ type: 'detail', providerId: provider.id })}>
          <Select
            options={[
              { label: 'Cancel', value: 'cancel', description: 'Go back without deleting' },
              { label: 'Delete provider', value: 'delete', description: 'Remove this provider permanently' },
            ]}
            onChange={value => {
              if (value === 'cancel') {
                setScreen({ type: 'detail', providerId: provider.id })
                return
              }
              const current = readCustomApiProvidersStorage()
              const remaining = (current.providers ?? []).filter(item => item.id !== provider.id)
              const nextCurrentProviderId = current.currentProviderId === provider.id ? remaining[0]?.id : current.currentProviderId
              persistCustomApiProviders({
                currentProviderId: nextCurrentProviderId,
                providers: remaining,
              })
              syncProviderEnv(remaining[0])
              setScreen({ type: 'list' })
            }}
            onCancel={() => setScreen({ type: 'detail', providerId: provider.id })}
          />
        </Dialog>
      </Pane>
    )
  }

  const provider = getProvider(screen.providerId)
  if (!provider) {
    setScreen({ type: 'list' })
    return null
  }

  return (
    <Pane color="permission">
      <Dialog
        title={screen.title}
        subtitle="Enter to save. Esc to cancel."
        onCancel={() => setScreen({ type: 'detail', providerId: provider.id })}
        isCancelActive={false}
      >
        <Box borderStyle="round" paddingLeft={1}>
          <TextInput
            showCursor
            value={inputValue}
            onChange={setInputValue}
            onSubmit={value => {
              const trimmed = value.trim()
              updateCustomApiProviders(current => ({
                ...current,
                providers: (current.providers ?? []).map(item => {
                  if (item.id !== provider.id) return item
                  if (screen.field === 'model') {
                    const nextSavedModels = trimmed ? [...new Set([...(item.savedModels ?? []), trimmed])] : item.savedModels
                    return { ...item, model: trimmed || undefined, savedModels: nextSavedModels }
                  }
                  return { ...item, [screen.field]: trimmed || undefined }
                }),
              }))
              syncProviderEnv(getProvider(provider.id))
              setScreen({ type: 'detail', providerId: provider.id })
            }}
            placeholder={screen.placeholder}
            columns={80}
            cursorOffset={cursorOffset}
            onChangeCursorOffset={setCursorOffset}
          />
        </Box>
        <Text dimColor>Enter to save · Esc to cancel</Text>
      </Dialog>
    </Pane>
  )
}

export const call: LocalJSXCommandCall = async (onDone, _context, args) => {
  if (args.trim()) {
    const mod = await import('./provider.js')
    return mod.call(args, _context as never)
  }
  return <ProviderCommand onDone={onDone} />
}
