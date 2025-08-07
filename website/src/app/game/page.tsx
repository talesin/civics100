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
import {
  DEFAULT_GAME_SETTINGS,
  GameSession,
  QuestionAnswer,
  GameResult,
  QuestionDisplay as GameQuestionType,
  WebsiteGameSettings
} from '@/types'

type GameState = 'loading' | 'playing' | 'answered' | 'transitioning' | 'completed'

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('loading')
  const [session, setSession] = useState<GameSession | null>(null)
  const [questions, setQuestions] = useState<GameQuestionType[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [showEarlyWinOption, setShowEarlyWinOption] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [gameSettings, setGameSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)

  const { playComplete, playEarlyWin } = useGameSounds()

  const initializeGame = useCallback(() => {
    setGameState('loading')

    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const sessionService = yield* SessionService
        const questionService = yield* QuestionDataService

        const newSession = yield* sessionService.createNewSession(gameSettings)
        const gameQuestions = yield* questionService.generateGameQuestions(
          gameSettings.maxQuestions,
          gameSettings.userState
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

          // Play completion sound
          if (finalSession.isEarlyWin === true) {
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

  // Load game settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('civics-game-settings')
      if (savedSettings !== null) {
        const parsed = JSON.parse(savedSettings) as WebsiteGameSettings
        setGameSettings(parsed)
      }
    } catch (error) {
      console.error('Failed to load game settings:', error)
    }
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
            updatedSession.isCompleted === false
          ) {
            setShowEarlyWinOption(true)
          }

          // Auto-complete if all questions answered or early win achieved
          if (updatedSession.isCompleted === true) {
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
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Preparing your civics test...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Transition state
  if (gameState === 'transitioning') {
    return (
      <Layout title="Loading Next Question...">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
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
            <p className="text-gray-600 dark:text-gray-300">Loading next question...</p>
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
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Game Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-6">
            There was an error loading the game. Please try again.
          </p>
          <button
            onClick={handleRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
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
      <div className="space-y-6">
        {/* Question Component with Animation */}
        <div
          className={`transition-all duration-300 ${
            gameState === 'playing' ? 'opacity-100 transform translate-y-0' : 'opacity-75'
          }`}
        >
          <GameQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={gameState !== 'playing'}
          />
        </div>

        {/* Early Win Option */}
        {showEarlyWinOption && gameState === 'answered' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                🎉 Congratulations! You can pass now!
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-4 text-sm">
                You&apos;ve answered {session.correctAnswers} out of {gameSettings.winThreshold} questions correctly to pass. You can finish
                now or continue to answer all {questions.length} questions.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleEarlyFinish}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Finish Now
                </button>
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <GameControls
          session={displaySession}
          onNext={showEarlyWinOption ? undefined : handleNext}
          onRestart={handleRestart}
          showNext={gameState === 'answered' && !showEarlyWinOption}
          showRestart={true}
        />

        {/* Keyboard Help */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ⌨️ Keyboard Shortcuts
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                <div className="flex justify-between">
                  <span>Select answers:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    1-4 or A-D
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next question:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Enter or Space
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Restart game:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    R
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Help Toggle */}
        <button
          onClick={() => setShowKeyboardHelp(true)}
          className="fixed bottom-4 right-4 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-40"
          title="Show keyboard shortcuts"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
