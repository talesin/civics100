'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StateAbbreviation } from 'civics2json'
import Layout from '@/components/Layout'
import StateSelector from '@/components/StateSelector'
import DistrictSelector from '@/components/DistrictSelector'
import { DEFAULT_GAME_SETTINGS, WebsiteGameSettings } from '@/types'

export default function Settings() {
  const router = useRouter()
  const [settings, setSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      // TODO: migrate settings to use LocalStorageService
      const savedSettings = localStorage.getItem('civics-game-settings')
      if (savedSettings !== null) {
        const parsed = JSON.parse(savedSettings) as WebsiteGameSettings
        setSettings(parsed)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('civics-game-settings', JSON.stringify(settings))
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleStateChange = (state: StateAbbreviation) => {
    setSettings((prev) => ({ ...prev, userState: state, userDistrict: undefined }))
    setHasChanges(true)
  }

  const handleDistrictChange = (district: string | undefined) => {
    setSettings((prev) => ({ ...prev, userDistrict: district }))
    setHasChanges(true)
  }

  const handleMaxQuestionsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value)
    setSettings((prev) => ({ ...prev, maxQuestions: value }))
    setHasChanges(true)
  }

  const handleWinThresholdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value)
    setSettings((prev) => ({ ...prev, winThreshold: value }))
    setHasChanges(true)
  }

  const handleDarkModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked
    setSettings((prev) => ({ ...prev, darkMode: value }))
    setHasChanges(true)

    // Apply dark mode immediately
    if (value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleStartGame = () => {
    if (hasChanges) {
      saveSettings()
    }
    router.push('/game')
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_GAME_SETTINGS)
    setHasChanges(true)

    // Reset dark mode
    if (DEFAULT_GAME_SETTINGS.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (isLoading) {
    return (
      <Layout title="Game Settings">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Game Settings">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Game Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Customize your civics test experience</p>
        </div>

        <div className="card card-elevated space-y-6">
          {/* State Selection */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Location Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select your state and congressional district to get personalized questions about your 
              specific representative, senators, and governor.
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
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Game Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Game Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="max-questions"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Questions per game:
                </label>
                <select
                  id="max-questions"
                  value={settings.maxQuestions}
                  onChange={handleMaxQuestionsChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                  <option value={25}>25 questions</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="win-threshold"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Pass threshold:
                </label>
                <select
                  id="win-threshold"
                  value={settings.winThreshold}
                  onChange={handleWinThresholdChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={Math.ceil(settings.maxQuestions * 0.4)}>
                    {Math.ceil(settings.maxQuestions * 0.4)} correct (40%)
                  </option>
                  <option value={Math.ceil(settings.maxQuestions * 0.5)}>
                    {Math.ceil(settings.maxQuestions * 0.5)} correct (50%)
                  </option>
                  <option value={Math.ceil(settings.maxQuestions * 0.6)}>
                    {Math.ceil(settings.maxQuestions * 0.6)} correct (60%)
                  </option>
                  <option value={Math.ceil(settings.maxQuestions * 0.7)}>
                    {Math.ceil(settings.maxQuestions * 0.7)} correct (70%)
                  </option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              The game will end early if you reach the pass threshold before answering all
              questions.
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="dark-mode"
                checked={settings.darkMode}
                onChange={handleDarkModeChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="dark-mode"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Enable dark mode
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={resetToDefaults}
            className="btn-secondary px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Reset to Defaults
          </button>

          <div className="flex gap-3">
            <button
              onClick={saveSettings}
              disabled={!hasChanges}
              className="btn-secondary px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Settings
            </button>
            <button
              onClick={handleStartGame}
              className="btn-primary px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Start Game
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              You have unsaved changes. Click &quot;Save Settings&quot; to persist them.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
