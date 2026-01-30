'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Effect } from 'effect'
import { StateAbbreviation } from 'civics2json'
import { TOTAL_QUESTION_COUNT } from 'questionnaire'
import Layout from '@/components/Layout'
import StateSelector from '@/components/StateSelector'
import DistrictSelector from '@/components/DistrictSelector'
import PoliticianVerificationBox from '@/components/PoliticianVerificationBox'
import { useThemeContext, themeColors as baseThemeColors } from '@/components/TamaguiProvider'
import { LocalStorageService } from '@/services/LocalStorageService'
import { DEFAULT_GAME_SETTINGS, WebsiteGameSettings, WIN_THRESHOLD_PERCENTAGE } from '@/types'

// Settings-specific colors that extend the base theme colors
const settingsThemeColors = {
  light: {
    textLight: '#6b7280',
    textXLight: '#9ca3af',
    linkText: '#2563eb',
    linkHover: '#1e40af',
    borderColor: '#e5e7eb',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    checkboxBg: '#f3f4f6',
    amberText: '#d97706',
  },
  dark: {
    textLight: '#9ca3af',
    textXLight: '#9ca3af',
    linkText: '#60a5fa',
    linkHover: '#93c5fd',
    borderColor: '#374151',
    inputBg: '#1f2937',
    inputBorder: '#4b5563',
    checkboxBg: '#374151',
    amberText: '#fbbf24',
  },
}

export default function Settings() {
  const router = useRouter()
  const [settings, setSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const { theme, setTheme } = useThemeContext()
  // Merge base theme colors with settings-specific colors
  const colors = useMemo(() => ({
    ...baseThemeColors[theme],
    ...settingsThemeColors[theme]
  }), [theme])

  // Load settings from LocalStorageService on component mount
  useEffect(() => {
    let mounted = true

    const loadSettings = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const savedSettings = yield* storageService.getGameSettings()
      if (mounted) {
        setSettings(savedSettings)
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

  // Save settings to LocalStorageService
  const saveSettings = useCallback(() => {
    const saveEffect = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      yield* storageService.saveGameSettings(settings)
      setHasChanges(false)
    })

    Effect.runPromise(saveEffect.pipe(Effect.provide(LocalStorageService.Default))).catch(
      (error) => {
        console.error('Failed to save settings:', error)
      }
    )
  }, [settings])

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
    // Auto-calculate winThreshold as 60% of maxQuestions
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
    const value = event.target.checked
    setSettings((prev) => ({ ...prev, darkMode: value }))
    setHasChanges(true)

    // Apply dark mode via theme context
    setTheme(value ? 'dark' : 'light')
  }, [setTheme])

  const handleStartGame = useCallback(() => {
    const navigateToGame = () => router.push('/game')

    if (hasChanges) {
      const saveEffect = Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        yield* storageService.saveGameSettings(settings)
      })

      Effect.runPromise(saveEffect.pipe(Effect.provide(LocalStorageService.Default)))
        .catch((error) => console.error('Failed to save settings:', error))
        .finally(navigateToGame)
    } else {
      navigateToGame()
    }
  }, [hasChanges, settings, router])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_GAME_SETTINGS)
    setHasChanges(true)

    // Reset dark mode via theme context
    setTheme(DEFAULT_GAME_SETTINGS.darkMode ? 'dark' : 'light')
  }, [setTheme])

  if (isLoading) {
    return (
      <Layout title="Game Settings">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderBottomColor: '#2563eb',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: colors.textMuted }}>Loading settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 6,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 14,
    outline: 'none',
  }

  return (
    <Layout title="Game Settings">
      <div style={{ maxWidth: 672, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 30, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Game Settings</h1>
          <p style={{ color: colors.textMuted }}>Customize your civics test experience</p>
        </div>

        <div className="card card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* State Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
              Location Settings
            </h2>
            <p style={{ fontSize: 14, color: colors.textLight }}>
              Select your state and congressional district to get personalized questions about your
              specific representative, senators, and governor.
            </p>
            <div style={{ fontSize: 14, color: colors.linkText }}>
              Don&apos;t know your congressional district?{' '}
              <a
                href="https://www.govtrack.us/congress/members/map"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline', transition: 'color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = colors.linkHover}
                onMouseOut={(e) => e.currentTarget.style.color = colors.linkText}
              >
                Find your district on GovTrack →
              </a>
            </div>
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

          <hr style={{ border: 'none', borderTop: `1px solid ${colors.borderColor}`, margin: 0 }} />

          {/* Game Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>Game Settings</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="max-questions"
                  style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted }}
                >
                  Questions per game:
                </label>
                <select
                  id="max-questions"
                  value={settings.maxQuestions}
                  onChange={handleMaxQuestionsChange}
                  style={selectStyles}
                >
                  <option value={20}>20 questions (Official 2025 minimum)</option>
                  <option value={50}>50 questions</option>
                  <option value={TOTAL_QUESTION_COUNT}>{TOTAL_QUESTION_COUNT} questions (All questions)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="win-threshold"
                  style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted }}
                >
                  Pass threshold:
                </label>
                <select
                  id="win-threshold"
                  value={settings.winThreshold}
                  onChange={handleWinThresholdChange}
                  style={selectStyles}
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
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12, color: colors.textXLight }}>
              The game ends when you reach the pass threshold (early win), answer 9 questions incorrectly (early fail), or complete all questions. This matches the 2025 USCIS Civics Test format.
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${colors.borderColor}`, margin: 0 }} />

          {/* Appearance Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>Appearance</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                id="dark-mode"
                checked={settings.darkMode}
                onChange={handleDarkModeChange}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: '#2563eb',
                  cursor: 'pointer'
                }}
              />
              <label
                htmlFor="dark-mode"
                style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted, cursor: 'pointer' }}
              >
                Enable dark mode
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            <button
              onClick={resetToDefaults}
              className="btn-secondary focus-ring"
              style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 500, transition: 'all 0.2s' }}
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
                  borderRadius: 8,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  opacity: hasChanges ? 1 : 0.5,
                  cursor: hasChanges ? 'pointer' : 'not-allowed'
                }}
              >
                Save Settings
              </button>
              <button
                onClick={handleStartGame}
                className="btn-primary focus-ring"
                style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 500, transition: 'all 0.2s' }}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>

        {hasChanges === true ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: colors.amberText }}>
              You have unsaved changes. Click &quot;Save Settings&quot; to persist them.
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
