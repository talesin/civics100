import React, { useCallback, useEffect, useState } from 'react'
import { Effect } from 'effect'
import { isWeb, styled, useTheme, Text as TamaguiText } from 'tamagui'
import type { StateAbbreviation } from 'civics2json'
import { TOTAL_QUESTION_COUNT } from 'questionnaire'
import {
  EditorialInput,
  EditorialSelect,
  LoadingSpinner,
  Text,
  XStack,
  YStack
} from '../components/tamagui'
import CheckboxField from '../components/CheckboxField'
import DistrictSelector from '../components/DistrictSelector'
import ExternalLink from '../components/ExternalLink'
import PoliticianVerificationBox from '../components/PoliticianVerificationBox'
import StateSelector from '../components/StateSelector'
import { useThemeContext } from '../ThemeContext'
import { useTtsVoices } from '../hooks/useTtsVoices'
import { LocalStorageService } from '../services/LocalStorageService'
import { AppRuntime } from '../services/ServiceLayer'
import { TtsService } from '../services/TtsService'
import { DEFAULT_GAME_SETTINGS, DEFAULT_TTS_SETTINGS, WIN_THRESHOLD_PERCENTAGE } from '../types'
import type { TtsSettings, WebsiteGameSettings } from '../types'
import { Rule } from './editorial'

export interface SettingsScreenProps {
  /** "Start Game" (after any unsaved settings are persisted). */
  readonly onNavigateToGame: () => void
}

const TTS_PREVIEW_TEXT = 'What is the supreme law of the land? A. The Constitution.'

const parseQuestionNumbers = (input: string): { numbers: number[]; error: string | null } => {
  if (input.trim() === '') return { numbers: [], error: null }

  const parts = input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  const numbers: number[] = []

  for (const part of parts) {
    const n = parseInt(part, 10)
    if (isNaN(n) || String(n) !== part) {
      return { numbers: [], error: `"${part}" is not a valid number` }
    }
    if (n < 1 || n > TOTAL_QUESTION_COUNT) {
      return { numbers: [], error: `Question ${n} is out of range (1-${TOTAL_QUESTION_COUNT})` }
    }
    numbers.push(n)
  }

  const unique = [...new Set(numbers)]
  return { numbers: unique, error: null }
}

// clamp(1.5rem, 4vw, 2rem): 32px at the desktop baseline, 24px under $xs;
// line-height stays the inherited 1.5, as the old h1's did.
const SettingsTitle = styled(Text, {
  tag: 'h1',
  fontFamily: '$serif',
  fontSize: 32,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.32, // -0.01em at 32px
  marginBottom: 6,
  textAlign: 'center',

  $xs: {
    fontSize: 24,
    letterSpacing: -0.24
  }
})

// Port of `.card.card-elevated` (design-tokens.css): neutral-50 fill,
// neutral-200 hairline, 8px radius, 24px padding, the md shadow. The shadow
// is applied at the call site — web needs the exact two-layer box-shadow
// string (the shadowMd theme key), native a single shadow approximation.
const SettingsCard = styled(YStack, {
  gap: 24,
  backgroundColor: '$neutral50',
  borderWidth: 1,
  borderColor: '$neutral200',
  borderRadius: 8,
  padding: 24
})

const SectionHeading = styled(Text, {
  tag: 'h2',
  fontFamily: '$serif',
  fontSize: 18,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.18 // -0.01em at 18px
})

const BodyText = styled(Text, {
  tag: 'p',
  fontSize: 14,
  color: '$editorialMuted'
})

const HintText = styled(Text, {
  tag: 'p',
  fontSize: 13,
  color: '$editorialMuted'
})

// Text types omit the label DOM attributes, hence the recast (EditorialInput
// precedent); htmlFor is forwarded on web and ignored on native.
const FieldLabelFrame = styled(TamaguiText, {
  tag: 'label',
  fontSize: 14,
  fontWeight: '500',
  color: '$editorialMuted'
})

const FieldLabel = FieldLabelFrame as unknown as React.ComponentType<
  Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'color'>
>

// Port of the two-up form grids, repeat(auto-fit, minmax(280px, 1fr)) with a
// 16px gap: with two fields, flexBasis 280 + grow is the same layout at every
// width (side by side iff 2 × 280 + 16 fits, otherwise stacked full-width).
const Field = styled(YStack, {
  flexBasis: 280,
  flexGrow: 1,
  flexShrink: 0,
  gap: 6
})

// Ports of `.btn-secondary` (default) and `.btn-primary` (`primary` variant)
// from design-tokens.css. The neutral-* keys are the exact light/dark pairs
// the classes read; the primary colours are theme-independent tokens
// (primary-600/700 stay #2563eb/#1d4ed8 in dark mode too). Text-based single
// element so the label inherits the colours (EditorialButton reasoning);
// the old buttons were `all: unset`, so the body's 16px/1.5 text metrics
// are inherited here as well. `.focus-ring`'s focus-visible outline lives in
// focusVisibleStyle.
const SettingsButton = styled(TamaguiText, {
  tag: 'button',
  backgroundColor: '$neutral100',
  color: '$color',
  fontWeight: '500',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 6,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$neutral300',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$neutral200',
    borderColor: '$neutral400'
  },

  focusVisibleStyle: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$blueLight',
    outlineOffset: 2
  },

  variants: {
    primary: {
      true: {
        backgroundColor: '$bluePrimary',
        color: '$white',
        borderColor: '$bluePrimary',

        hoverStyle: {
          backgroundColor: '$blueDark',
          borderColor: '$blueDark'
        }
      }
    }
  } as const
})

export default function SettingsScreen({ onNavigateToGame }: SettingsScreenProps) {
  const [settings, setSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [practiceSpecificEnabled, setPracticeSpecificEnabled] = useState(false)
  const [questionNumbersInput, setQuestionNumbersInput] = useState('')
  const [questionNumbersError, setQuestionNumbersError] = useState<string | null>(null)
  const [ttsSettings, setTtsSettings] = useState<TtsSettings>(DEFAULT_TTS_SETTINGS)
  const voices = useTtsVoices()
  const { theme, setTheme } = useThemeContext()
  const tamaguiTheme = useTheme()
  const themeError = tamaguiTheme.themeError?.get() as string

  useEffect(() => {
    let mounted = true

    const loadSettings = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const savedSettings = yield* storageService.getGameSettings()
      const savedTts = yield* storageService.getTtsSettings()
      if (mounted) {
        setSettings(savedSettings)
        setTtsSettings(savedTts)
        if (savedSettings.questionNumbers != null && savedSettings.questionNumbers.length > 0) {
          setPracticeSpecificEnabled(true)
          setQuestionNumbersInput(savedSettings.questionNumbers.join(', '))
        }
        setIsLoading(false)
      }
    })

    Effect.runPromise(loadSettings.pipe(Effect.provide(LocalStorageService.Default))).catch(
      (error) => {
        if (mounted) {
          console.error('Failed to load settings:', error)
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
    }
  }, [])

  const saveSettings = useCallback(() => {
    const saveEffect = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      yield* storageService.saveGameSettings(settings)
      yield* storageService.saveTtsSettings(ttsSettings)
      setHasChanges(false)
    })

    Effect.runPromise(saveEffect.pipe(Effect.provide(LocalStorageService.Default))).catch(
      (error) => {
        console.error('Failed to save settings:', error)
      }
    )
  }, [settings, ttsSettings])

  const handleStateChange = useCallback((state: StateAbbreviation) => {
    setSettings((prev) => ({ ...prev, userState: state, userDistrict: undefined }))
    setHasChanges(true)
  }, [])

  const handleDistrictChange = useCallback((district: string | undefined) => {
    setSettings((prev) => ({ ...prev, userDistrict: district }))
    setHasChanges(true)
  }, [])

  const handleMaxQuestionsChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value)
    const newWinThreshold = Math.ceil(value * WIN_THRESHOLD_PERCENTAGE)
    setSettings((prev) => ({ ...prev, maxQuestions: value, winThreshold: newWinThreshold }))
    setHasChanges(true)
  }, [])

  const handleWinThresholdChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value)
    setSettings((prev) => ({ ...prev, winThreshold: value }))
    setHasChanges(true)
  }, [])

  const handleDarkModeChange = useCallback(
    (checked: boolean) => {
      setTheme(checked ? 'dark' : 'light')
    },
    [setTheme]
  )

  const handleVoiceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setTtsSettings((prev) => ({ ...prev, voiceURI: value === '' ? null : value }))
    setHasChanges(true)
  }, [])

  const handleRateChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setTtsSettings((prev) => ({ ...prev, rate: parseFloat(event.target.value) }))
    setHasChanges(true)
  }, [])

  // Through TtsService (platform adapters) rather than the browser's
  // speechSynthesis directly; the unsaved voice/rate are previewed as-is.
  const handleTtsPreview = useCallback(() => {
    const tts = AppRuntime.runSync(TtsService)
    if (!tts.isSupported()) return
    tts.cancel()
    void Effect.runPromise(
      tts
        .speakText(TTS_PREVIEW_TEXT, { voiceURI: ttsSettings.voiceURI, rate: ttsSettings.rate })
        .pipe(Effect.ignore)
    )
  }, [ttsSettings])

  const handlePracticeSpecificToggle = useCallback((enabled: boolean) => {
    setPracticeSpecificEnabled(enabled)

    if (!enabled) {
      setQuestionNumbersInput('')
      setQuestionNumbersError(null)
      setSettings((prev) => ({ ...prev, questionNumbers: undefined }))
    }
    setHasChanges(true)
  }, [])

  const handleQuestionNumbersChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    setQuestionNumbersInput(input)

    const { numbers, error } = parseQuestionNumbers(input)
    setQuestionNumbersError(error)

    if (error === null && numbers.length > 0) {
      setSettings((prev) => ({ ...prev, questionNumbers: numbers }))
    } else if (error === null && numbers.length === 0) {
      setSettings((prev) => ({ ...prev, questionNumbers: undefined }))
    }
    setHasChanges(true)
  }, [])

  const handleStartGame = useCallback(() => {
    if (hasChanges) {
      const saveEffect = Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        yield* storageService.saveGameSettings(settings)
        yield* storageService.saveTtsSettings(ttsSettings)
      })

      Effect.runPromise(saveEffect.pipe(Effect.provide(LocalStorageService.Default)))
        .catch((error) => console.error('Failed to save settings:', error))
        .finally(onNavigateToGame)
    } else {
      onNavigateToGame()
    }
  }, [hasChanges, settings, ttsSettings, onNavigateToGame])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_GAME_SETTINGS)
    setTtsSettings(DEFAULT_TTS_SETTINGS)
    setPracticeSpecificEnabled(false)
    setQuestionNumbersInput('')
    setQuestionNumbersError(null)
    setHasChanges(true)
  }, [])

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={384}>
        <YStack alignItems="center">
          <LoadingSpinner marginBottom={16} />
          <Text tag="p" color="$editorialMuted" fontSize={16} lineHeight={24}>
            Loading settings...
          </Text>
        </YStack>
      </YStack>
    )
  }

  const selectedCount = parseQuestionNumbers(questionNumbersInput).numbers.length

  return (
    <YStack maxWidth={672} marginHorizontal="auto" gap={32}>
      <YStack>
        <SettingsTitle>Game Settings</SettingsTitle>
        <BodyText textAlign="center">Customize your civics test experience</BodyText>
      </YStack>

      <SettingsCard
        {...(isWeb
          ? { style: { boxShadow: tamaguiTheme.shadowMd?.get() as string } }
          : {
              shadowColor: '$color',
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 6
            })}
      >
        {/* Location Settings */}
        <YStack gap={8}>
          <SectionHeading>Location Settings</SectionHeading>
          <BodyText>
            Select your state and congressional district to get personalized questions about your
            specific representative, senators, and governor.
          </BodyText>
          <BodyText>
            Don&apos;t know your congressional district?{' '}
            <ExternalLink href="https://www.govtrack.us/congress/members/map" inline>
              Find your district on GovTrack →
            </ExternalLink>
          </BodyText>
          <StateSelector selectedState={settings.userState} onStateChange={handleStateChange} />
          <DistrictSelector
            selectedState={settings.userState}
            selectedDistrict={settings.userDistrict}
            onDistrictChange={handleDistrictChange}
          />
          <PoliticianVerificationBox
            selectedState={settings.userState}
            selectedDistrict={settings.userDistrict}
          />
        </YStack>

        <Rule />

        {/* Game Settings */}
        <YStack gap={16}>
          <SectionHeading>Game Settings</SectionHeading>

          <XStack flexWrap="wrap" gap={16}>
            <Field>
              <FieldLabel htmlFor="max-questions">Questions per game:</FieldLabel>
              <EditorialSelect
                id="max-questions"
                value={settings.maxQuestions}
                onChange={handleMaxQuestionsChange}
              >
                <option value={20}>20 questions (Official 2025 minimum)</option>
                <option value={50}>50 questions</option>
                <option value={TOTAL_QUESTION_COUNT}>
                  {TOTAL_QUESTION_COUNT} questions (All questions)
                </option>
              </EditorialSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="win-threshold">Pass threshold:</FieldLabel>
              <EditorialSelect
                id="win-threshold"
                value={settings.winThreshold}
                onChange={handleWinThresholdChange}
              >
                <option value={Math.ceil(settings.maxQuestions * WIN_THRESHOLD_PERCENTAGE)}>
                  {Math.ceil(settings.maxQuestions * WIN_THRESHOLD_PERCENTAGE)} correct (60%)
                </option>
                <option value={Math.ceil(settings.maxQuestions * 0.7)}>
                  {Math.ceil(settings.maxQuestions * 0.7)} correct (70%)
                </option>
                <option value={Math.ceil(settings.maxQuestions * 0.8)}>
                  {Math.ceil(settings.maxQuestions * 0.8)} correct (80%)
                </option>
                <option value={Math.ceil(settings.maxQuestions * 0.9)}>
                  {Math.ceil(settings.maxQuestions * 0.9)} correct (90%)
                </option>
                <option value={settings.maxQuestions}>
                  {settings.maxQuestions} correct (100%)
                </option>
              </EditorialSelect>
            </Field>
          </XStack>

          <HintText>
            The game ends when you reach the pass threshold (early win), answer 9 questions
            incorrectly (early fail), or complete all questions. This matches the 2025 USCIS Civics
            Test format.
          </HintText>
        </YStack>

        <Rule />

        {/* Practice Specific Questions */}
        <YStack gap={16}>
          <SectionHeading>Practice Specific Questions</SectionHeading>

          <CheckboxField
            id="practice-specific"
            checked={practiceSpecificEnabled}
            onCheckedChange={handlePracticeSpecificToggle}
            label="Practice specific question numbers"
          />

          {practiceSpecificEnabled ? (
            <YStack gap={6}>
              <FieldLabel htmlFor="question-numbers">
                Question numbers (comma-separated):
              </FieldLabel>
              <EditorialInput
                id="question-numbers"
                type="text"
                value={questionNumbersInput}
                onChange={handleQuestionNumbersChange}
                placeholder="e.g. 1, 5, 20, 81"
                style={questionNumbersError != null ? { borderColor: themeError } : undefined}
              />
              {questionNumbersError != null ? (
                <HintText color="$themeError">{questionNumbersError}</HintText>
              ) : questionNumbersInput.trim() !== '' ? (
                <HintText>
                  {selectedCount} question{selectedCount !== 1 ? 's' : ''} selected
                </HintText>
              ) : null}
              <HintText>
                Enter question numbers between 1 and {TOTAL_QUESTION_COUNT} to practice only those
                questions. Game settings above will be ignored when specific questions are selected.
              </HintText>
            </YStack>
          ) : null}
        </YStack>

        <Rule />

        {/* Appearance */}
        <YStack gap={16}>
          <SectionHeading>Appearance</SectionHeading>

          <CheckboxField
            id="dark-mode"
            checked={theme === 'dark'}
            onCheckedChange={handleDarkModeChange}
            label="Enable dark mode"
          />
        </YStack>

        <Rule />

        {/* Voice Settings */}
        <YStack gap={16}>
          <SectionHeading>Voice Settings</SectionHeading>
          <BodyText>
            Configure the text-to-speech voice used to read questions and answers aloud.
          </BodyText>

          <XStack flexWrap="wrap" gap={16}>
            <Field>
              <FieldLabel htmlFor="tts-voice">Voice:</FieldLabel>
              <EditorialSelect
                id="tts-voice"
                value={ttsSettings.voiceURI ?? ''}
                onChange={handleVoiceChange}
              >
                <option value="">Auto (default)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </EditorialSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="tts-rate">Speed:</FieldLabel>
              <EditorialSelect id="tts-rate" value={ttsSettings.rate} onChange={handleRateChange}>
                <option value={0.5}>Slow</option>
                <option value={0.75}>Slower</option>
                <option value={0.95}>Normal</option>
                <option value={1.25}>Faster</option>
                <option value={1.5}>Fast</option>
              </EditorialSelect>
            </Field>
          </XStack>

          <XStack>
            <SettingsButton
              paddingVertical={8}
              paddingHorizontal={16}
              fontSize={14}
              onPress={handleTtsPreview}
            >
              Preview voice
            </SettingsButton>
          </XStack>
        </YStack>
      </SettingsCard>

      {/* Action Buttons */}
      <YStack gap={12}>
        <XStack flexWrap="wrap" gap={12} justifyContent="space-between">
          <SettingsButton onPress={resetToDefaults}>Reset to Defaults</SettingsButton>

          <XStack gap={12} flexShrink={1}>
            <SettingsButton
              onPress={saveSettings}
              disabled={!hasChanges}
              opacity={hasChanges ? 1 : 0.5}
              cursor={hasChanges ? 'pointer' : 'not-allowed'}
            >
              Save Settings
            </SettingsButton>
            <SettingsButton primary onPress={handleStartGame}>
              Start Game
            </SettingsButton>
          </XStack>
        </XStack>
      </YStack>

      {hasChanges === true ? (
        <YStack>
          <Text tag="p" fontSize={14} color="$themeWarning" textAlign="center">
            You have unsaved changes. Click &quot;Save Settings&quot; to persist them.
          </Text>
        </YStack>
      ) : null}
    </YStack>
  )
}
