'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Effect } from 'effect'
import { styled, useTheme } from 'tamagui'
import Layout from '@/components/Layout'
import { YStack, LoadingSpinner } from '@/components/tamagui'
import GameQuestion from '@/components/GameQuestion'
import GameControls from '@/components/GameControls'
import GameResults from '@/components/GameResults'
import { SessionService } from '@/services/SessionService'
import { LocalStorageService } from '@/services/LocalStorageService'
import { QuestionDataService } from '@/services/QuestionDataService'
import { runWithServicesAndErrorHandling } from '@/services/ServiceProvider'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { Trophy, Keyboard, ArrowRight, AlertTriangle } from 'app/components'
import {
  DEFAULT_GAME_SETTINGS,
  GameSession,
  QuestionAnswer,
  GameResult,
  QuestionDisplay as GameQuestionType,
  WebsiteGameSettings
} from '@/types'
import { isSessionCompleted, isSessionEarlyWin } from 'questionnaire'

type GameState = 'loading' | 'playing' | 'answered' | 'transitioning' | 'completed'

// Transition timing constant
const TRANSITION_DELAY_MS = 300

// Static styles to avoid recreation on each render
const loadingContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 384,
}

const loadingTextContainerStyles: React.CSSProperties = {
  textAlign: 'center',
}

const TransitionIconBg = styled(YStack, {
  width: 64,
  height: 64,
  backgroundColor: '$editorialAccentSubtle',
  borderRadius: 9999,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 'auto',
  marginBottom: 16,
})

const ErrorIconBg = styled(YStack, {
  width: 64,
  height: 64,
  backgroundColor: '$themeErrorBg',
  borderRadius: 9999,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 'auto',
  marginBottom: 16,
})

// Port of .animate-fade-in (globals.css) for the early-win banner.
const EarlyWinBox = styled(YStack, {
  backgroundColor: '$themeSuccessBg',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$themeSuccess',
  borderRadius: 8,
  padding: 24,
  animation: 'lazy',
  enterStyle: { opacity: 0, y: 10 },
})

const KeyboardHelpOverlay = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  animation: 'lazy',
  enterStyle: { opacity: 0, y: 10 },
})

const KeyboardHelpCard = styled(YStack, {
  backgroundColor: '$themeCardBg',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialRule',
  borderRadius: 8,
  padding: 24,
  maxWidth: 448,
  margin: 16,
})

const errorIconContainerStyles: React.CSSProperties = {
  textAlign: 'center',
}

export default function Game() {
  const router = useRouter()
  const theme = useTheme()
  const [gameState, setGameState] = useState<GameState>('loading')
  const [session, setSession] = useState<GameSession | null>(null)
  const [questions, setQuestions] = useState<GameQuestionType[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [showEarlyWinOption, setShowEarlyWinOption] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [gameSettings, setGameSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const { playComplete, playEarlyWin } = useGameSounds()
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // Refs to avoid stale closures in setTimeout callbacks
  const sessionRef = useRef(session)
  const currentQuestionIndexRef = useRef(currentQuestionIndex)
  const questionsRef = useRef(questions)
  useEffect(() => {
    sessionRef.current = session
    currentQuestionIndexRef.current = currentQuestionIndex
    questionsRef.current = questions
  }, [session, currentQuestionIndex, questions])

  // Cleanup mounted ref on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

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
          gameSettings.userDistrict,
          gameSettings.questionNumbers
        )

        if (!mountedRef.current) return

        setSession(newSession)
        setQuestions(gameQuestions)
        setCurrentQuestionIndex(0)
        setShowEarlyWinOption(false)
        setGameState('playing')
      }),
      (error) => {
        if (mountedRef.current) {
          console.error(error)
        }
      }
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

          if (!mountedRef.current) return

          // Play completion sound
          if (isSessionEarlyWin(finalSession)) {
            playEarlyWin()
          } else {
            playComplete()
          }

          setGameResult(result)
          setGameState('completed')
        }),
        (error) => {
          if (mountedRef.current) {
            console.error(error)
          }
        }
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
        if (mountedRef.current) {
          setGameSettings(savedSettings)
          setSettingsLoaded(true)
        }
      }),
      (error) => {
        if (mountedRef.current) {
          console.error(error)
        }
      }
    )
  }, [])

  useEffect(() => {
    if (settingsLoaded) {
      initializeGame()
    }
  }, [settingsLoaded, initializeGame])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const handleAnswer = useCallback(
    (answer: QuestionAnswer) => {
      if (session === null || gameState !== 'playing') return

      runWithServicesAndErrorHandling(
        Effect.gen(function* () {
          const sessionService = yield* SessionService

          const updatedSession = sessionService.processAnswer(session, answer)

          if (!mountedRef.current) return

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
        (error) => {
          if (mountedRef.current) {
            console.error(error)
          }
        }
      )
    },
    [session, gameState, completeGame, gameSettings.winThreshold]
  )

  const handleNext = useCallback(() => {
    if (session === null) return

    setGameState('transitioning')

    // Clear any existing timeout
    if (transitionTimeoutRef.current !== null) {
      clearTimeout(transitionTimeoutRef.current)
    }

    // Add transition delay for better UX
    // Use refs to get current values and avoid stale closures
    transitionTimeoutRef.current = setTimeout(() => {
      const currentSession = sessionRef.current
      const currentIndex = currentQuestionIndexRef.current
      const currentQuestions = questionsRef.current

      if (currentSession === null) return

      if (currentIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setGameState('playing')
      } else {
        // Complete the session
        const completedSession = {
          ...currentSession,
          isCompleted: true,
          completedAt: new Date(),
          currentQuestionIndex: currentIndex + 1,
          totalAnswered: currentSession.totalAnswered
        }

        completeGame(completedSession)
      }
    }, TRANSITION_DELAY_MS)
  }, [session, completeGame])

  const handleEarlyFinish = useCallback(() => {
    if (session === null) return

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

  const handleViewHistory = useCallback(() => {
    router.push('/results')
  }, [router])

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

  // Memoize displaySession to avoid creating new object every render
  // Must be called before any conditional returns to comply with React's rules of hooks
  // Note: The early returns below guarantee session is non-null when displaySession is used
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])
  const displaySession = useMemo(() =>
    session === null ? null : {
      ...session,
      currentQuestionIndex,
      questions: questionIds
    }
  , [session, currentQuestionIndex, questionIds])

  // Loading state
  if (gameState === 'loading') {
    return (
      <Layout title="Loading Game...">
        <div style={loadingContainerStyles}>
          <div style={loadingTextContainerStyles}>
            <LoadingSpinner marginHorizontal="auto" marginBottom={16} />
            <p style={{ color: theme.editorialMuted?.get() as string }}>Preparing your civics test...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Transition state
  if (gameState === 'transitioning') {
    return (
      <Layout title="Loading Next Question...">
        <div style={loadingContainerStyles}>
          <div style={loadingTextContainerStyles}>
            {/* The old `pulse` animation referenced keyframes that never
                existed (pre-existing bug) — dropped. */}
            <TransitionIconBg>
              <ArrowRight size={32} strokeWidth={1.5} color={theme.editorialAccent?.get() as string} />
            </TransitionIconBg>
            <p style={{ color: theme.editorialMuted?.get() as string }}>Loading next question...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Completed state
  if (gameState === 'completed' && gameResult !== null) {
    return (
      <Layout title="Test Complete">
        <GameResults
          result={gameResult}
          onPlayAgain={handleRestart}
          onViewHistory={handleViewHistory}
        />
      </Layout>
    )
  }

  // Error state
  if (session === null || currentQuestion === undefined || questions.length === 0) {
    return (
      <Layout title="Game Error">
        <div style={errorIconContainerStyles}>
          <ErrorIconBg>
            <AlertTriangle size={32} strokeWidth={1.5} color={theme.themeError?.get() as string} />
          </ErrorIconBg>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.editorialInk?.get() as string, marginBottom: 8 }}>Game Error</h2>
          <p style={{ color: theme.themeError?.get() as string, marginBottom: 24 }}>
            There was an error loading the game. Please try again.
          </p>
          <button
            onClick={handleRestart}
            className="btn-primary focus-ring"
            style={{ padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
          >
            Restart Game
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Question ${currentQuestionIndex + 1}/${questions.length} (#${currentQuestion.originalQuestionNumber})`}>
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
        {showEarlyWinOption && gameState === 'answered' ? (
          <EarlyWinBox>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.themeSuccessText?.get() as string, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Trophy size={20} strokeWidth={1.5} />
                Congratulations! You can pass now!
              </h3>
              <p style={{ color: theme.editorialMuted?.get() as string, marginBottom: 16, fontSize: 14 }}>
                You&apos;ve answered {session.correctAnswers} out of {gameSettings.winThreshold} questions correctly to pass. You can finish
                now or continue to answer all {questions.length} questions.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleEarlyFinish}
                  className="btn-success focus-ring"
                  style={{ padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
                >
                  Finish Now
                </button>
                <button
                  onClick={handleNext}
                  className="btn-primary focus-ring"
                  style={{ padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
                >
                  Continue
                </button>
              </div>
            </div>
          </EarlyWinBox>
        ) : null}

        {/* Game Controls - displaySession! is safe because early returns guarantee session is non-null */}
        <GameControls
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          session={displaySession!}
          onNext={showEarlyWinOption ? undefined : handleNext}
          onRestart={handleRestart}
          showNext={gameState === 'answered' && !showEarlyWinOption}
          showRestart={true}
        />

        {/* Keyboard Help */}
        {showKeyboardHelp ? (
          <KeyboardHelpOverlay
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
          >
            <KeyboardHelpCard>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.editorialInk?.get() as string, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Keyboard size={18} strokeWidth={1.5} />
                Keyboard Shortcuts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: theme.editorialMuted?.get() as string, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Select answers:</span>
                  <span style={{ fontFamily: 'monospace', backgroundColor: theme.neutral100?.get() as string, padding: '4px 8px', borderRadius: 4 }}>
                    1-4 or A-D
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Next question:</span>
                  <span style={{ fontFamily: 'monospace', backgroundColor: theme.neutral100?.get() as string, padding: '4px 8px', borderRadius: 4 }}>
                    Enter or Space
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Restart game:</span>
                  <span style={{ fontFamily: 'monospace', backgroundColor: theme.neutral100?.get() as string, padding: '4px 8px', borderRadius: 4 }}>
                    R
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="btn-primary focus-ring"
                style={{ width: '100%', fontWeight: 500, padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}
              >
                Got it!
              </button>
            </KeyboardHelpCard>
          </KeyboardHelpOverlay>
        ) : null}

        {/* Keyboard Help Toggle */}
        <button
          onClick={() => setShowKeyboardHelp(true)}
          title="Show keyboard shortcuts"
          className="btn-secondary focus-ring"
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            padding: 12,
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: theme.shadowMd?.get() as string,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Keyboard size={20} strokeWidth={1.5} />
        </button>
      </div>
    </Layout>
  )
}
