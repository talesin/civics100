'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Effect } from 'effect'
import { useTheme } from 'tamagui'
import { StateAbbreviation } from 'civics2json'
import { TOTAL_QUESTION_COUNT } from 'questionnaire'
import Layout from '@/components/Layout'
import { EditorialInput, EditorialSelect, LoadingSpinner } from '@/components/tamagui'
import StateSelector from '@/components/StateSelector'
import DistrictSelector from '@/components/DistrictSelector'
import PoliticianVerificationBox from '@/components/PoliticianVerificationBox'
import { useThemeContext } from '@/components/TamaguiProvider'
import { LocalStorageService } from '@/services/LocalStorageService'
import { DEFAULT_GAME_SETTINGS, DEFAULT_TTS_SETTINGS, WebsiteGameSettings, TtsSettings, WIN_THRESHOLD_PERCENTAGE } from '@/types'
import { useTtsVoices } from '@/hooks/useTtsVoices'

export default function Settings() {
  const router = useRouter()
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
  const ink = tamaguiTheme.editorialInk?.get() as string
  const muted = tamaguiTheme.editorialMuted?.get() as string
  const accent = tamaguiTheme.editorialAccent?.get() as string
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

  const handleDarkModeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(event.target.checked ? 'dark' : 'light')
  }, [setTheme])

  const handleVoiceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setTtsSettings((prev) => ({ ...prev, voiceURI: value === '' ? null : value }))
    setHasChanges(true)
  }, [])

  const handleRateChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setTtsSettings((prev) => ({ ...prev, rate: parseFloat(event.target.value) }))
    setHasChanges(true)
  }, [])

  const handleTtsPreview = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      'What is the supreme law of the land? A. The Constitution.'
    )
    if (ttsSettings.voiceURI != null) {
      const match = speechSynthesis.getVoices().find((v) => v.voiceURI === ttsSettings.voiceURI)
      if (match != null) utterance.voice = match
    }
    utterance.rate = ttsSettings.rate
    speechSynthesis.speak(utterance)
  }, [ttsSettings])

  const parseQuestionNumbers = useCallback((input: string): { numbers: number[]; error: string | null } => {
    if (input.trim() === '') return { numbers: [], error: null }

    const parts = input.split(',').map((s) => s.trim()).filter((s) => s !== '')
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
  }, [])

  const handlePracticeSpecificToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked
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
  }, [parseQuestionNumbers])

  const handleStartGame = useCallback(() => {
    const navigateToGame = () => router.push('/game')

    if (hasChanges) {
      const saveEffect = Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        yield* storageService.saveGameSettings(settings)
        yield* storageService.saveTtsSettings(ttsSettings)
      })

      Effect.runPromise(saveEffect.pipe(Effect.provide(LocalStorageService.Default)))
        .catch((error) => console.error('Failed to save settings:', error))
        .finally(navigateToGame)
    } else {
      navigateToGame()
    }
  }, [hasChanges, settings, ttsSettings, router])

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
      <Layout title="Game Settings">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner marginHorizontal="auto" marginBottom={16} />
            <p style={{ color: muted }}>Loading settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
    fontSize: 18,
    fontWeight: 500,
    color: ink,
    letterSpacing: '-0.01em',
  }

  const dividerStyle: React.CSSProperties = {
    border: 'none',
    borderTop: `1px solid ${tamaguiTheme.editorialRule?.get() as string}`,
    margin: 0,
  }

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: muted,
  }

  const checkboxStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    accentColor: accent,
    cursor: 'pointer',
  }

  return (
    <Layout title="Game Settings">
      <div style={{ maxWidth: 672, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 500, color: ink, letterSpacing: '-0.01em', marginBottom: 6 }}> {/* PHASE5: $fontFamily */}
            Game Settings
          </h1>
          <p style={{ color: muted, fontSize: 14 }}>Customize your civics test experience</p>
        </div>

        <div className="card card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Location Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={sectionHeadingStyle}>Location Settings</h2>
            <p style={{ fontSize: 14, color: muted }}>
              Select your state and congressional district to get personalized questions about your
              specific representative, senators, and governor.
            </p>
            <p style={{ fontSize: 14, color: muted }}>
              Don&apos;t know your congressional district?{' '}
              <a
                href="https://www.govtrack.us/congress/members/map"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: accent, textDecoration: 'underline' }}
              >
                Find your district on GovTrack →
              </a>
            </p>
            <StateSelector
              selectedState={settings.userState}
              onStateChange={handleStateChange}
              className="mt-4"
            />
            <DistrictSelector
              selectedState={settings.userState}
              selectedDistrict={settings.userDistrict}
              onDistrictChange={handleDistrictChange}
              className="mt-4"
            />
            <PoliticianVerificationBox
              selectedState={settings.userState}
              selectedDistrict={settings.userDistrict}
            />
          </div>

          <hr style={dividerStyle} />

          {/* Game Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={sectionHeadingStyle}>Game Settings</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="max-questions" style={fieldLabelStyle}>
                  Questions per game:
                </label>
                <EditorialSelect
                  id="max-questions"
                  value={settings.maxQuestions}
                  onChange={handleMaxQuestionsChange}
                >
                  <option value={20}>20 questions (Official 2025 minimum)</option>
                  <option value={50}>50 questions</option>
                  <option value={TOTAL_QUESTION_COUNT}>{TOTAL_QUESTION_COUNT} questions (All questions)</option>
                </EditorialSelect>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="win-threshold" style={fieldLabelStyle}>
                  Pass threshold:
                </label>
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
              </div>
            </div>

            <p style={{ fontSize: 13, color: muted }}>
              The game ends when you reach the pass threshold (early win), answer 9 questions incorrectly (early fail), or complete all questions. This matches the 2025 USCIS Civics Test format.
            </p>
          </div>

          <hr style={dividerStyle} />

          {/* Practice Specific Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={sectionHeadingStyle}>Practice Specific Questions</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="practice-specific"
                checked={practiceSpecificEnabled}
                onChange={handlePracticeSpecificToggle}
                style={checkboxStyle}
              />
              <label htmlFor="practice-specific" style={{ ...fieldLabelStyle, cursor: 'pointer' }}>
                Practice specific question numbers
              </label>
            </div>

            {practiceSpecificEnabled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="question-numbers" style={fieldLabelStyle}>
                  Question numbers (comma-separated):
                </label>
                <EditorialInput
                  id="question-numbers"
                  type="text"
                  value={questionNumbersInput}
                  onChange={handleQuestionNumbersChange}
                  placeholder="e.g. 1, 5, 20, 81"
                  style={questionNumbersError != null ? { borderColor: themeError } : undefined}
                />
                {questionNumbersError != null ? (
                  <p style={{ fontSize: 13, color: themeError }}>{questionNumbersError}</p>
                ) : questionNumbersInput.trim() !== '' ? (
                  <p style={{ fontSize: 13, color: muted }}>
                    {parseQuestionNumbers(questionNumbersInput).numbers.length} question{parseQuestionNumbers(questionNumbersInput).numbers.length !== 1 ? 's' : ''} selected
                  </p>
                ) : null}
                <p style={{ fontSize: 13, color: muted }}>
                  Enter question numbers between 1 and {TOTAL_QUESTION_COUNT} to practice only those questions. Game settings above will be ignored when specific questions are selected.
                </p>
              </div>
            ) : null}
          </div>

          <hr style={dividerStyle} />

          {/* Appearance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={sectionHeadingStyle}>Appearance</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="dark-mode"
                checked={theme === 'dark'}
                onChange={handleDarkModeChange}
                style={checkboxStyle}
              />
              <label htmlFor="dark-mode" style={{ ...fieldLabelStyle, cursor: 'pointer' }}>
                Enable dark mode
              </label>
            </div>
          </div>

          <hr style={dividerStyle} />

          {/* Voice Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={sectionHeadingStyle}>Voice Settings</h2>
            <p style={{ fontSize: 14, color: muted }}>
              Configure the text-to-speech voice used to read questions and answers aloud.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="tts-voice" style={fieldLabelStyle}>
                  Voice:
                </label>
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
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="tts-rate" style={fieldLabelStyle}>
                  Speed:
                </label>
                <EditorialSelect
                  id="tts-rate"
                  value={ttsSettings.rate}
                  onChange={handleRateChange}
                >
                  <option value={0.5}>Slow</option>
                  <option value={0.75}>Slower</option>
                  <option value={0.95}>Normal</option>
                  <option value={1.25}>Faster</option>
                  <option value={1.5}>Fast</option>
                </EditorialSelect>
              </div>
            </div>

            <div>
              <button
                onClick={handleTtsPreview}
                className="btn-secondary focus-ring"
                type="button"
                style={{ padding: '8px 16px', borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
              >
                Preview voice
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            <button
              onClick={resetToDefaults}
              className="btn-secondary focus-ring"
              style={{ padding: '12px 24px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
            >
              Reset to Defaults
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={saveSettings}
                disabled={!hasChanges}
                className="btn-secondary focus-ring"
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  fontWeight: 500,
                  opacity: hasChanges ? 1 : 0.5,
                  cursor: hasChanges ? 'pointer' : 'not-allowed'
                }}
              >
                Save Settings
              </button>
              <button
                onClick={handleStartGame}
                className="btn-primary focus-ring"
                style={{ padding: '12px 24px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>

        {hasChanges === true ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: tamaguiTheme.themeWarning?.get() as string }}>
              You have unsaved changes. Click &quot;Save Settings&quot; to persist them.
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
