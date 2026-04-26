import * as React from 'react'
import type { CommandResultDisplay } from '../../commands.js'
import { ModelPicker } from '../../components/ModelPicker.js'
import {
  type OptionWithDescription,
  Select,
} from '../../components/CustomSelect/index.js'
import { Pane } from '../../components/design-system/Pane.js'
import { Byline } from '../../components/design-system/Byline.js'
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js'
import { ConfigurableShortcutHint } from '../../components/ConfigurableShortcutHint.js'
import { Box, Text } from '../../ink.js'
import type { LocalJSXCommandCall } from '../../types/command.js'
import {
  getUserSpecifiedModelSetting,
  renderActiveModelSetting,
  renderModelSetting,
} from '../../utils/model/model.js'
import type { ModelOption } from '../../utils/model/modelOptions.js'
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'

type Props = {
  onDone: (result?: string, options?: { display?: CommandResultDisplay }) => void
}

type TierKey = 'fast' | 'balance' | 'quality'

type TierOption = {
  key: TierKey | 'done'
}

const TIER_HEADERS: Record<TierKey, string> = {
  fast: 'Choose the default model used when code requests haiku.',
  balance: 'Choose the default model used when code requests sonnet.',
  quality: 'Choose the default model used when code requests opus.',
}

function getTierModelValue(
  value:
    | string
    | { model: string; providerId?: string }
    | undefined,
): string | undefined {
  if (!value) {
    return undefined
  }

  return typeof value === 'string' ? value : value.model
}

function formatTierValue(
  value:
    | string
    | { model: string; providerId?: string }
    | undefined,
): string {
  const model = getTierModelValue(value)
  return model ? renderModelSetting(model) : 'Default'
}

function getTierOptions(): OptionWithDescription<TierOption>[] {
  const selection = getSettingsForSource('userSettings')?.modelSelection

  return [
    {
      label: 'Fast Model',
      value: { key: 'fast' },
      description: `Haiku alias → ${formatTierValue(selection?.fast)}`,
    },
    {
      label: 'Balance Model',
      value: { key: 'balance' },
      description: `Sonnet alias → ${formatTierValue(selection?.balance)}`,
    },
    {
      label: 'Quality Model',
      value: { key: 'quality' },
      description: `Opus alias → ${formatTierValue(selection?.quality)}`,
    },
    {
      label: 'Done',
      value: { key: 'done' },
      description: 'Close model selection.',
    },
  ]
}

function saveTierModel(
  tier: TierKey,
  model: string | null,
  option?: ModelOption,
): void {
  const currentSelection = getSettingsForSource('userSettings')?.modelSelection
  const nextSelection = {
    ...currentSelection,
    [tier]: model
      ? {
          model,
          providerId: option?.providerId,
        }
      : undefined,
  }

  const hasAnySelection = Object.values(nextSelection).some(Boolean)

  updateSettingsForSource('userSettings', {
    modelSelection: hasAnySelection ? nextSelection : undefined,
  })
}

function getActiveModelSummary(): string {
  return renderActiveModelSetting(getUserSpecifiedModelSetting() ?? null)
}

function buildSummary(): string {
  const selection = getSettingsForSource('userSettings')?.modelSelection

  return [
    `Active ${getActiveModelSummary()}`,
    `Fast ${formatTierValue(selection?.fast)}`,
    `Balance ${formatTierValue(selection?.balance)}`,
    `Quality ${formatTierValue(selection?.quality)}`,
  ].join(' · ')
}

function ModelSelectionCommand({ onDone }: Props): React.ReactNode {
  const [activeTier, setActiveTier] = React.useState<TierKey | null>(null)
  const [version, setVersion] = React.useState(0)

  const handleCancel = React.useCallback(() => {
    if (activeTier !== null) {
      setActiveTier(null)
      setVersion(current => current + 1)
      return
    }

    onDone('Model selection dismissed', { display: 'system' })
  }, [activeTier, onDone])

  const handleTierPick = React.useCallback(
    (option: TierOption) => {
      if (option.key === 'done') {
        onDone(`Updated model mappings: ${buildSummary()}`)
        return
      }

      setActiveTier(option.key)
    },
    [onDone],
  )

  const handleModelSelect = React.useCallback(
    (model: string | null, _effort: unknown, option?: ModelOption) => {
      if (!activeTier) {
        return
      }

      saveTierModel(activeTier, model, option)
      setActiveTier(null)
      setVersion(current => current + 1)
    },
    [activeTier],
  )

  if (activeTier !== null) {
    return (
      <Pane color="permission">
        <ModelPicker
          initial={getTierModelValue(getSettingsForSource('userSettings')?.modelSelection?.[activeTier]) ?? null}
          onSelect={handleModelSelect}
          onCancel={handleCancel}
          skipSettingsWrite
          headerText={TIER_HEADERS[activeTier]}
        />
        <Text dimColor>
          <Byline>
            <KeyboardShortcutHint shortcut="Enter" action="confirm" />
            <ConfigurableShortcutHint
              action="confirm:no"
              context="Confirmation"
              fallback="Esc"
              description="back"
            />
          </Byline>
        </Text>
      </Pane>
    )
  }

  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Text bold color="permission">
          Model Selection
        </Text>
        <Text dimColor>
          Configure global Fast / Balance / Quality model redirection.
        </Text>
        <Box marginTop={1} marginBottom={1} flexDirection="column">
          <Text>Current model and mappings</Text>
          <Text dimColor>{buildSummary()}</Text>
        </Box>
        <Select
          key={version}
          options={getTierOptions()}
          onChange={handleTierPick}
          onCancel={handleCancel}
          visibleOptionCount={4}
        />
        <Text dimColor>
          <Byline>
            <KeyboardShortcutHint shortcut="Enter" action="select" />
            <ConfigurableShortcutHint
              action="confirm:no"
              context="Confirmation"
              fallback="Esc"
              description="cancel"
            />
          </Byline>
        </Text>
      </Box>
    </Pane>
  )
}

export const call: LocalJSXCommandCall = async onDone => {
  return <ModelSelectionCommand onDone={onDone} />
}
