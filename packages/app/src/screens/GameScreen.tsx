import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  useSyncExternalStore
} from 'react'
import { Effect } from 'effect'
import { type GetProps, isWeb, styled, useTheme, Text as TamaguiText } from 'tamagui'
import { LoadingSpinner, Text, XStack, YStack } from '../components/tamagui'
import GameQuestion from '../components/GameQuestion'
import GameControls from '../components/GameControls'
import GameResults from '../components/GameResults'
import { AlertTriangle, ArrowRight, Keyboard, Trophy } from '../components/icons'
import { useGameSounds } from '../hooks/useGameSounds'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import { LocalStorageService } from '../services/LocalStorageService'
import { QuestionDataService } from '../services/QuestionDataService'
import { runWithServicesAndErrorHandling } from '../services/ServiceLayer'
import { SessionService } from '../services/SessionService'
import {
  DEFAULT_GAME_SETTINGS,
  type GameResult,
  type GameSession,
  type QuestionAnswer,
  type QuestionDisplay,
  type WebsiteGameSettings
} from '../types'
import { isSessionCompleted, isSessionEarlyWin } from 'questionnaire'

export interface GameFrameProps {
  /** Live page title: "Loading Game...", "Question 3/20 (#45)", "Test Complete", ... */
  readonly title: string
  readonly children: React.ReactNode
}

export interface GameScreenProps {
  /** "View History" on the completed screen. */
  readonly onNavigateToResults: () => void
  /**
   * Chrome rendered around every game state with the state's title (the
   * website passes its Layout, whose header shows the title and which the
   * functional e2e reads the question counter from). Defaults to no chrome.
   */
  readonly Frame?: React.ComponentType<GameFrameProps>
}

type GameState = 'loading' | 'playing' | 'answered' | 'transitioning' | 'completed'

const TRANSITION_DELAY_MS = 300

const KEYBOARD_HELP_SEEN_KEY = 'civics-keyboard-help-seen'

// The first-visit flag is a web localStorage read (existing backlog item —
// it does not go through LocalStorageService yet). Read as an external store
// so the server snapshot is "seen" (no overlay in the prerendered HTML) and
// the client re-renders with the real value after hydration, with no
// setState-in-effect. The flag is written when the user dismisses the help.
const subscribeToNothing = () => () => {}

const readKeyboardHelpUnseen = (): boolean => {
  if (!isWeb) return false
  try {
    return localStorage.getItem(KEYBOARD_HELP_SEEN_KEY) === null
  } catch {
    return false
  }
}

const getServerKeyboardHelpUnseen = () => false

const markKeyboardHelpSeen = (): void => {
  if (!isWeb) return
  try {
    localStorage.setItem(KEYBOARD_HELP_SEEN_KEY, 'true')
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

const PassthroughFrame = ({ children }: GameFrameProps) => <>{children}</>

const logError = (error: unknown): void => {
  console.error(error)
}

// Session + questions for one game; shared by the initial load and Restart.
const newGame = (settings: WebsiteGameSettings) =>
  Effect.gen(function* () {
    const sessionService = yield* SessionService
    const questionService = yield* QuestionDataService
    const storageService = yield* LocalStorageService

    // Load existing paired answers to enable adaptive learning
    const existingPairedAnswers = yield* storageService.getPairedAnswers()

    const session = yield* sessionService.createNewSession(settings, existingPairedAnswers)
    const questions = yield* questionService.generateGameQuestions(
      settings.maxQuestions,
      settings.userState,
      settings.userDistrict,
      settings.questionNumbers
    )

    return { session, questions }
  })

// Centred loading/transition block: the old flex box was min-height 384 with
// a text-align:center column inside.
const CenteredState = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 384
})

const StateText = styled(Text, {
  tag: 'p',
  fontSize: 16,
  color: '$editorialMuted',
  textAlign: 'center'
})

const TransitionIconBg = styled(YStack, {
  width: 64,
  height: 64,
  backgroundColor: '$editorialAccentSubtle',
  borderRadius: 9999,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16
})

const ErrorIconBg = styled(YStack, {
  width: 64,
  height: 64,
  backgroundColor: '$themeErrorBg',
  borderRadius: 9999,
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  marginBottom: 16
})

const ErrorHeading = styled(Text, {
  tag: 'h2',
  fontSize: 20,
  fontWeight: '600',
  color: '$editorialInk',
  textAlign: 'center',
  marginBottom: 8
})

const ErrorText = styled(Text, {
  tag: 'p',
  fontSize: 16,
  color: '$themeError',
  textAlign: 'center',
  marginBottom: 24
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
  enterStyle: { opacity: 0, y: 10 }
})

const EarlyWinText = styled(Text, {
  tag: 'p',
  fontSize: 14,
  color: '$editorialMuted',
  textAlign: 'center',
  marginBottom: 16
})

// The old headings were flex rows (icon + text) — an XStack with the heading
// tag keeps the semantics; the text sits in its own Text with the heading's
// metrics (18px, inherited 1.5 line height on web).
const IconHeading = styled(XStack, {
  tag: 'h3',
  alignItems: 'center',
  gap: 8
})

const IconHeadingText = styled(Text, {
  fontSize: 18,
  fontWeight: '600'
})

const KeyboardHelpOverlay = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 50,
  animation: 'lazy',
  enterStyle: { opacity: 0, y: 10 }
})

const KeyboardHelpCard = styled(YStack, {
  backgroundColor: '$themeCardBg',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialRule',
  borderRadius: 8,
  padding: 24,
  maxWidth: 448,
  margin: 16
})

const ShortcutList = styled(YStack, {
  gap: 8,
  marginBottom: 24
})

const ShortcutRow = styled(XStack, {
  justifyContent: 'space-between'
})

const ShortcutLabel = styled(Text, {
  fontSize: 14,
  color: '$editorialMuted'
})

const ShortcutKey = styled(Text, {
  fontSize: 14,
  color: '$editorialMuted',
  fontFamily: '$mono',
  backgroundColor: '$neutral100',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 4
})

// Ports of `.btn-primary` (default) and `.btn-success` (`success` variant)
// with the game page's inline geometry (8×16 padding, 6px radius, weight
// 500). Text-based single element so the label inherits the colours and the
// body's 16px/1.5 text metrics (SettingsButton precedent). Both classes read
// theme-independent tokens: primary-600/700 = $bluePrimary/$blueDark,
// success-600/700 = $green6/$green7. `.focus-ring` → focusVisibleStyle.
const GameButton = styled(TamaguiText, {
  tag: 'button',
  backgroundColor: '$bluePrimary',
  color: '$white',
  fontWeight: '500',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 6,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$bluePrimary',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$blueDark',
    borderColor: '$blueDark'
  },

  focusVisibleStyle: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$blueLight',
    outlineOffset: 2
  },

  variants: {
    success: {
      true: {
        backgroundColor: '$green6',
        borderColor: '$green6',

        hoverStyle: {
          backgroundColor: '$green7',
          borderColor: '$green7'
        }
      }
    }
  } as const
})

// Port of the floating `.btn-secondary` keyboard-help toggle: a 46px circle
// (20px icon + 12px padding + 1px border) pinned to the bottom-right corner.
// Fixed positioning + the md shadow are web-only styles at the call site.
const KeyboardHelpToggleFrame = styled(YStack, {
  tag: 'button',
  padding: 12,
  borderRadius: 9999,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$neutral300',
  backgroundColor: '$neutral100',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 40,

  hoverStyle: {
    backgroundColor: '$neutral200',
    borderColor: '$neutral400'
  },

  focusVisibleStyle: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$blueLight',
    outlineOffset: 2
  }
})

// Stack props omit the DOM `title` tooltip the old button carried (ExternalLink
// precedent for the recast); it is forwarded on web and ignored on native.
const KeyboardHelpToggle = KeyboardHelpToggleFrame as unknown as React.ComponentType<
  GetProps<typeof KeyboardHelpToggleFrame> & { readonly title?: string | undefined }
>

export default function GameScreen({
  onNavigateToResults,
  Frame = PassthroughFrame
}: GameScreenProps) {
  const theme = useTheme()
  const [gameState, setGameState] = useState<GameState>('loading')
  const [session, setSession] = useState<GameSession | null>(null)
  const [questions, setQuestions] = useState<QuestionDisplay[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [showEarlyWinOption, setShowEarlyWinOption] = useState(false)
  const [gameSettings, setGameSettings] = useState<WebsiteGameSettings>(DEFAULT_GAME_SETTINGS)

  const keyboardHelpUnseen = useSyncExternalStore(
    subscribeToNothing,
    readKeyboardHelpUnseen,
    getServerKeyboardHelpUnseen
  )
  const [keyboardHelpOverride, setKeyboardHelpOverride] = useState<boolean | null>(null)
  const showKeyboardHelp = keyboardHelpOverride ?? keyboardHelpUnseen

  const { playComplete, playEarlyWin } = useGameSounds()

  const applyNewGame = useCallback(
    (game: { session: GameSession; questions: QuestionDisplay[] }) => {
      setSession(game.session)
      setQuestions(game.questions)
      setCurrentQuestionIndex(0)
      setShowEarlyWinOption(false)
      setGameState('playing')
    },
    []
  )

  // Settings load and the first game are one path: the saved settings feed
  // straight into the session instead of round-tripping through state.
  useEffect(() => {
    void runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        const savedSettings = yield* storageService.getGameSettings()
        const game = yield* newGame(savedSettings)
        setGameSettings(savedSettings)
        applyNewGame(game)
      }),
      logError
    )
  }, [applyNewGame])

  const completeGame = useCallback(
    (finalSession: GameSession) => {
      void runWithServicesAndErrorHandling(
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
        logError
      )
    },
    [playComplete, playEarlyWin]
  )

  const handleAnswer = useCallback(
    (answer: QuestionAnswer) => {
      if (session === null || gameState !== 'playing') return

      void runWithServicesAndErrorHandling(
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
        logError
      )
    },
    [session, gameState, completeGame, gameSettings.winThreshold]
  )

  // The 300ms transition delay is owned by an effect keyed on the state:
  // entering 'transitioning' arms the timer, leaving it (or unmounting)
  // clears it, and the advance step reads the latest session/index/questions
  // through an Effect Event instead of three mirrored refs.
  const advanceAfterTransition = useEffectEvent(() => {
    if (session === null) return

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
  })

  useEffect(() => {
    if (gameState !== 'transitioning') return

    const timeout = setTimeout(() => advanceAfterTransition(), TRANSITION_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [gameState])

  const handleNext = useCallback(() => {
    if (session === null) return

    setGameState('transitioning')
  }, [session])

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
    setGameState('loading')

    void runWithServicesAndErrorHandling(
      newGame(gameSettings).pipe(Effect.map(applyNewGame)),
      logError
    )
  }, [gameSettings, applyNewGame])

  const dismissKeyboardHelp = useCallback(() => {
    markKeyboardHelpSeen()
    setKeyboardHelpOverride(false)
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

  // Current question based on index
  const currentQuestion = questions[currentQuestionIndex]

  // Memoize displaySession to avoid creating new object every render
  // Must be called before any conditional returns to comply with React's rules of hooks
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])
  const displaySession = useMemo(
    () =>
      session === null
        ? null
        : {
            ...session,
            currentQuestionIndex,
            questions: questionIds
          },
    [session, currentQuestionIndex, questionIds]
  )

  // Loading state
  if (gameState === 'loading') {
    return (
      <Frame title="Loading Game...">
        <CenteredState>
          <YStack alignItems="center">
            <LoadingSpinner marginBottom={16} />
            <StateText>Preparing your civics test...</StateText>
          </YStack>
        </CenteredState>
      </Frame>
    )
  }

  // Transition state
  if (gameState === 'transitioning') {
    return (
      <Frame title="Loading Next Question...">
        <CenteredState>
          <YStack alignItems="center">
            {/* The old `pulse` animation referenced keyframes that never
                existed (pre-existing bug) — dropped. */}
            <TransitionIconBg>
              <ArrowRight
                size={32}
                strokeWidth={1.5}
                color={theme.editorialAccent?.get() as string}
              />
            </TransitionIconBg>
            <StateText>Loading next question...</StateText>
          </YStack>
        </CenteredState>
      </Frame>
    )
  }

  // Completed state
  if (gameState === 'completed' && gameResult !== null) {
    return (
      <Frame title="Test Complete">
        <GameResults
          result={gameResult}
          onPlayAgain={handleRestart}
          onViewHistory={onNavigateToResults}
        />
      </Frame>
    )
  }

  // Error state
  if (
    session === null ||
    displaySession === null ||
    currentQuestion === undefined ||
    questions.length === 0
  ) {
    return (
      <Frame title="Game Error">
        <YStack>
          <ErrorIconBg>
            <AlertTriangle size={32} strokeWidth={1.5} color={theme.themeError?.get() as string} />
          </ErrorIconBg>
          <ErrorHeading>Game Error</ErrorHeading>
          <ErrorText>There was an error loading the game. Please try again.</ErrorText>
          <GameButton alignSelf="center" onPress={handleRestart}>
            Restart Game
          </GameButton>
        </YStack>
      </Frame>
    )
  }

  return (
    <Frame
      title={`Question ${currentQuestionIndex + 1}/${questions.length} (#${currentQuestion.originalQuestionNumber})`}
    >
      <YStack gap={24}>
        {/* Question Component with Animation (was `transition: all 0.3s`) */}
        <YStack animation="slow" opacity={gameState === 'playing' ? 1 : 0.75}>
          <GameQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={gameState !== 'playing'}
          />
        </YStack>

        {/* Early Win Option */}
        {showEarlyWinOption && gameState === 'answered' ? (
          <EarlyWinBox>
            <IconHeading justifyContent="center" marginBottom={8}>
              <Trophy size={20} strokeWidth={1.5} color={theme.themeSuccessText?.get() as string} />
              <IconHeadingText color="$themeSuccessText">
                Congratulations! You can pass now!
              </IconHeadingText>
            </IconHeading>
            <EarlyWinText>
              You&apos;ve answered {session.correctAnswers} out of {gameSettings.winThreshold}{' '}
              questions correctly to pass. You can finish now or continue to answer all{' '}
              {questions.length} questions.
            </EarlyWinText>
            <XStack gap={12} justifyContent="center">
              <GameButton success onPress={handleEarlyFinish}>
                Finish Now
              </GameButton>
              <GameButton onPress={handleNext}>Continue</GameButton>
            </XStack>
          </EarlyWinBox>
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
        {showKeyboardHelp ? (
          <KeyboardHelpOverlay
            {...(isWeb
              ? { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 } }
              : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 })}
          >
            <KeyboardHelpCard>
              <IconHeading marginBottom={16}>
                <Keyboard size={18} strokeWidth={1.5} color={theme.editorialInk?.get() as string} />
                <IconHeadingText color="$editorialInk">Keyboard Shortcuts</IconHeadingText>
              </IconHeading>
              <ShortcutList>
                <ShortcutRow>
                  <ShortcutLabel>Select answers:</ShortcutLabel>
                  <ShortcutKey>1-4 or A-D</ShortcutKey>
                </ShortcutRow>
                <ShortcutRow>
                  <ShortcutLabel>Next question:</ShortcutLabel>
                  <ShortcutKey>Enter or Space</ShortcutKey>
                </ShortcutRow>
                <ShortcutRow>
                  <ShortcutLabel>Restart game:</ShortcutLabel>
                  <ShortcutKey>R</ShortcutKey>
                </ShortcutRow>
              </ShortcutList>
              <GameButton onPress={dismissKeyboardHelp}>Got it!</GameButton>
            </KeyboardHelpCard>
          </KeyboardHelpOverlay>
        ) : null}

        {/* Keyboard Help Toggle */}
        <KeyboardHelpToggle
          onPress={() => setKeyboardHelpOverride(true)}
          {...(isWeb
            ? {
                title: 'Show keyboard shortcuts',
                style: {
                  position: 'fixed',
                  bottom: 16,
                  right: 16,
                  boxShadow: theme.shadowMd?.get() as string
                }
              }
            : { position: 'absolute', bottom: 16, right: 16 })}
        >
          <Keyboard size={20} strokeWidth={1.5} color={theme.color?.get() as string} />
        </KeyboardHelpToggle>
      </YStack>
    </Frame>
  )
}
