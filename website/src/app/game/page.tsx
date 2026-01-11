'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import GameQuestion from '@/components/GameQuestion'
import GameControls from '@/components/GameControls'
import GameResults from '@/components/GameResults'
import { SessionService } from '@/services/SessionService'
import { LocalStorageService } from '@/services/LocalStorageService'
import { QuestionDataService } from '@/services/QuestionDataService'
import { runWithServicesAndErrorHandling } from '@/services/ServiceProvider'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useThemeContext } from '@/components/TamaguiProvider'
import {
  DEFAULT_GAME_SETTINGS,
  GameSession,
  QuestionAnswer,
  GameResult,
  QuestionDisplay as GameQuestionType,
  WebsiteGameSettings,
  isSessionEarlyWin,
  isSessionCompleted
} from '@/types'

type GameState = 'loading' | 'playing' | 'answered' | 'transitioning' | 'completed'

// Theme-aware colors
const themeColors = {
  light: {
    text: '#111827',
    textMuted: '#4b5563',
    cardBg: '#ffffff',
    iconBgBlue: '#dbeafe',
    iconBlue: '#2563eb',
    iconBgRed: '#fee2e2',
    iconRed: '#dc2626',
    successBg: 'linear-gradient(to right, #f0fdf4, #eff6ff)',
    successBorder: '#bbf7d0',
    successText: '#166534',
    successTextLight: '#15803d',
    modalBg: 'rgba(0, 0, 0, 0.5)',
    keyboardBg: '#f3f4f6',
  },
  dark: {
    text: '#ffffff',
    textMuted: '#d1d5db',
    cardBg: '#1f2937',
    iconBgBlue: 'rgba(30, 64, 175, 0.3)',
    iconBlue: '#60a5fa',
    iconBgRed: 'rgba(185, 28, 28, 0.3)',
    iconRed: '#f87171',
    successBg: 'linear-gradient(to right, rgba(21, 128, 61, 0.2), rgba(30, 64, 175, 0.2))',
    successBorder: '#166534',
    successText: '#86efac',
    successTextLight: '#bbf7d0',
    modalBg: 'rgba(0, 0, 0, 0.7)',
    keyboardBg: '#374151',
  },
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('loading')
  const [session, setSession] = useState<GameSession | null>(null)
  const [questions, setQuestions] = useState<GameQuestionType[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [showEarlyWinOption, setShowEarlyWinOption] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [gameSettings, setGameSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)

  const { theme } = useThemeContext()
  const colors = themeColors[theme]
  const { playComplete, playEarlyWin } = useGameSounds()

  const initializeGame = useCallback(() => {
    setGameState('loading')

    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const sessionService = yield* SessionService
        const questionService = yield* QuestionDataService
        const storageService = yield* LocalStorageService

        // Load existing paired answers to enable adaptive learning
        const existingPairedAnswers = yield* storageService.getPairedAnswers()

        const newSession = yield* sessionService.createNewSession(
          gameSettings,
          existingPairedAnswers
        )
        const gameQuestions = yield* questionService.generateGameQuestions(
          gameSettings.maxQuestions,
          gameSettings.userState,
          gameSettings.userDistrict
        )

        setSession(newSession)
        setQuestions(gameQuestions)
        setCurrentQuestionIndex(0)
        setShowEarlyWinOption(false)
        setGameState('playing')
      }),
      console.error
    )
  }, [gameSettings])

  const completeGame = useCallback(
    (finalSession: GameSession) => {
      runWithServicesAndErrorHandling(
        Effect.gen(function* () {
          const sessionService = yield* SessionService
          const storageService = yield* LocalStorageService

          const result = sessionService.calculateResult(finalSession)
          yield* storageService.saveGameResult(result)

          // Save paired answers for adaptive learning
          yield* storageService.savePairedAnswers(finalSession.pairedAnswers)

          // Play completion sound
          if (isSessionEarlyWin(finalSession)) {
            playEarlyWin()
          } else {
            playComplete()
          }

          setGameResult(result)
          setGameState('completed')
        }),
        console.error
      )
    },
    [playComplete, playEarlyWin]
  )

  // Load game settings from LocalStorageService
  useEffect(() => {
    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const localStorage = yield* LocalStorageService
        const savedSettings = yield* localStorage.getGameSettings()
        setGameSettings(savedSettings)
      }),
      console.error
    )
  }, [])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  const handleAnswer = useCallback(
    (answer: QuestionAnswer) => {
      if (session == null || gameState !== 'playing') return

      runWithServicesAndErrorHandling(
        Effect.gen(function* () {
          const sessionService = yield* SessionService

          const updatedSession = sessionService.processAnswer(session, answer)
          setSession(updatedSession)
          setGameState('answered')

          // Check for early win condition
          if (
            updatedSession.correctAnswers >= gameSettings.winThreshold &&
            !isSessionCompleted(updatedSession)
          ) {
            setShowEarlyWinOption(true)
          }

          // Auto-complete if all questions answered or early win achieved
          if (isSessionCompleted(updatedSession)) {
            completeGame(updatedSession)
          }
        }),
        console.error
      )
    },
    [session, gameState, completeGame, gameSettings.winThreshold]
  )

  const handleNext = useCallback(() => {
    if (session == null) return

    setGameState('transitioning')

    // Add transition delay for better UX
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setGameState('playing')
      } else {
        // Complete the session
        const completedSession = {
          ...session,
          isCompleted: true,
          completedAt: new Date(),
          currentQuestionIndex: currentQuestionIndex + 1,
          totalAnswered: session.totalAnswered
        }

        completeGame(completedSession)
      }
    }, 300)
  }, [session, currentQuestionIndex, questions.length, completeGame])

  const handleEarlyFinish = useCallback(() => {
    if (session == null) return

    const earlyFinishSession = {
      ...session,
      isCompleted: true,
      isEarlyWin: true,
      completedAt: new Date()
    }

    completeGame(earlyFinishSession)
  }, [session, completeGame])

  const handleRestart = useCallback(() => {
    setSession(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setGameResult(null)
    setShowEarlyWinOption(false)
    initializeGame()
  }, [initializeGame])

  const handlePlayAgain = useCallback(() => {
    handleRestart()
  }, [handleRestart])

  const handleViewHistory = useCallback(() => {
    window.location.href = '/results'
  }, [])

  // Keyboard navigation for main game controls
  useKeyboardNavigation({
    onSelectAnswer: () => {}, // Handled by GameQuestion component
    onNext: gameState === 'answered' && !showEarlyWinOption ? handleNext : () => {},
    onRestart: handleRestart,
    isAnswered: gameState === 'answered',
    totalAnswers: 4, // Not used for main game controls
    disabled: gameState === 'loading' || gameState === 'transitioning' || gameState === 'completed'
  })

  // Show keyboard help on first visit
  useEffect(() => {
    try {
      const hasSeenHelp = localStorage.getItem('civics-keyboard-help-seen')
      if (hasSeenHelp === null) {
        setShowKeyboardHelp(true)
        localStorage.setItem('civics-keyboard-help-seen', 'true')
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [])

  // Current question based on index
  const currentQuestion = questions[currentQuestionIndex]

  // Loading state
  if (gameState === 'loading') {
    return (
      <Layout title="Loading Game...">
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
            <p style={{ color: colors.textMuted }}>Preparing your civics test...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Transition state
  if (gameState === 'transitioning') {
    return (
      <Layout title="Loading Next Question...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              <div style={{
                width: 64,
                height: 64,
                backgroundColor: colors.iconBgBlue,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg
                  style={{ width: 32, height: 32, color: colors.iconBlue }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
            <p style={{ color: colors.textMuted }}>Loading next question...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Completed state
  if (gameState === 'completed' && gameResult != null) {
    return (
      <Layout title="Test Complete">
        <GameResults
          result={gameResult}
          onPlayAgain={handlePlayAgain}
          onViewHistory={handleViewHistory}
        />
      </Layout>
    )
  }

  // Error state
  if (session === null || currentQuestion === undefined || questions.length === 0) {
    return (
      <Layout title="Game Error">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            backgroundColor: colors.iconBgRed,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg
              style={{ width: 32, height: 32, color: colors.iconRed }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Game Error</h2>
          <p style={{ color: colors.iconRed, marginBottom: 24 }}>
            There was an error loading the game. Please try again.
          </p>
          <button
            onClick={handleRestart}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Restart Game
          </button>
        </div>
      </Layout>
    )
  }

  // Update session with current index for display
  const displaySession = {
    ...session,
    currentQuestionIndex,
    questions: questions.map((q) => q.id)
  }

  return (
    <Layout title={`Question ${currentQuestionIndex + 1} of ${questions.length}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Question Component with Animation */}
        <div
          style={{
            transition: 'all 0.3s',
            opacity: gameState === 'playing' ? 1 : 0.75,
            transform: gameState === 'playing' ? 'translateY(0)' : undefined
          }}
        >
          <GameQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={gameState !== 'playing'}
          />
        </div>

        {/* Early Win Option */}
        {showEarlyWinOption === true && gameState === 'answered' ? (
          <div className="animate-fade-in" style={{
            background: colors.successBg,
            border: `1px solid ${colors.successBorder}`,
            borderRadius: 8,
            padding: 24
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.successText, marginBottom: 8 }}>
                🎉 Congratulations! You can pass now!
              </h3>
              <p style={{ color: colors.successTextLight, marginBottom: 16, fontSize: 14 }}>
                You&apos;ve answered {session.correctAnswers} out of {gameSettings.winThreshold} questions correctly to pass. You can finish
                now or continue to answer all {questions.length} questions.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleEarlyFinish}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  Finish Now
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Game Controls */}
        <GameControls
          session={displaySession}
          onNext={showEarlyWinOption ? undefined : handleNext}
          onRestart={handleRestart}
          showNext={gameState === 'answered' && !showEarlyWinOption}
          showRestart={true}
        />

        {/* Keyboard Help */}
        {showKeyboardHelp === true ? (
          <div className="animate-fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.modalBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: colors.cardBg,
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: 24,
              maxWidth: 448,
              margin: 16
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 16 }}>
                ⌨️ Keyboard Shortcuts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Select answers:</span>
                  <span style={{ fontFamily: 'monospace', backgroundColor: colors.keyboardBg, padding: '4px 8px', borderRadius: 4 }}>
                    1-4 or A-D
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Next question:</span>
                  <span style={{ fontFamily: 'monospace', backgroundColor: colors.keyboardBg, padding: '4px 8px', borderRadius: 4 }}>
                    Enter or Space
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Restart game:</span>
                  <span style={{ fontFamily: 'monospace', backgroundColor: colors.keyboardBg, padding: '4px 8px', borderRadius: 4 }}>
                    R
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Got it!
              </button>
            </div>
          </div>
        ) : null}

        {/* Keyboard Help Toggle */}
        <button
          onClick={() => setShowKeyboardHelp(true)}
          title="Show keyboard shortcuts"
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            backgroundColor: '#4b5563',
            color: 'white',
            padding: 12,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.2s',
            zIndex: 40
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
        >
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </button>
      </div>
    </Layout>
  )
}
