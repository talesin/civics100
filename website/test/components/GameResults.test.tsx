import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GameResults from '@/components/GameResults'
import { GameResult } from '@/types'

describe('GameResults', () => {
  const mockOnPlayAgain = jest.fn()
  const mockOnViewHistory = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display correct number of answers for early win with 12 correct (20 questions)', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 12,
      percentage: 60,
      isEarlyWin: true,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText(/Excellent! You passed with 12 correct answers!/)).toBeInTheDocument()
    expect(
      screen.getByText(/Early Win Achievement! You answered 12 questions correctly/)
    ).toBeInTheDocument()
  })

  it('should display correct number of answers for early win with 30 correct (50 questions)', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 50,
      correctAnswers: 30,
      percentage: 60,
      isEarlyWin: true,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText(/Excellent! You passed with 30 correct answers!/)).toBeInTheDocument()
    expect(
      screen.getByText(/Early Win Achievement! You answered 30 questions correctly/)
    ).toBeInTheDocument()
  })

  it('should display correct number of answers for early win with 60 correct (100 questions)', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 100,
      correctAnswers: 60,
      percentage: 60,
      isEarlyWin: true,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText(/Excellent! You passed with 60 correct answers!/)).toBeInTheDocument()
    expect(
      screen.getByText(/Early Win Achievement! You answered 60 questions correctly/)
    ).toBeInTheDocument()
  })

  it('should display correct message for early fail with 9 incorrect', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 0,
      percentage: 0,
      isEarlyWin: false,
      isEarlyFail: true,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(
      screen.getByText(/Test ended - You answered 9 questions incorrectly/)
    ).toBeInTheDocument()
  })

  it('should display correct message for regular pass (no early win)', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 15,
      percentage: 75,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText(/Congratulations! You passed the civics test!/)).toBeInTheDocument()
    // Should NOT show early win achievement
    expect(screen.queryByText(/Early Win Achievement/)).not.toBeInTheDocument()
  })

  it('should display correct message for regular fail', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 8,
      percentage: 40,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText(/Keep studying! You need 60% to pass/)).toBeInTheDocument()
  })

  it('should display correct score and percentage', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 12,
      percentage: 60,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('12/20')).toBeInTheDocument()
  })

  it('should show green checkmark icon for passing scores', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 15,
      percentage: 75,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    const { getByTestId } = render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    const greenCircle = getByTestId('result-icon-success')
    expect(greenCircle).toBeInTheDocument()
  })

  it('should show red X icon for failing scores', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 8,
      percentage: 40,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    const { getByTestId } = render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    const redCircle = getByTestId('result-icon-failure')
    expect(redCircle).toBeInTheDocument()
  })

  it('should show red X icon for early fail', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 0,
      percentage: 0,
      isEarlyWin: false,
      isEarlyFail: true,
      completedAt: new Date()
    }

    const { getByTestId } = render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    const redCircle = getByTestId('result-icon-failure')
    expect(redCircle).toBeInTheDocument()
  })

  it('should call onPlayAgain when Play Again button is clicked', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 12,
      percentage: 60,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    fireEvent.click(screen.getByText('Play Again'))
    expect(mockOnPlayAgain).toHaveBeenCalledTimes(1)
  })

  it('should call onViewHistory when View History button is clicked', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 12,
      percentage: 60,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    fireEvent.click(screen.getByText('View History'))
    expect(mockOnViewHistory).toHaveBeenCalledTimes(1)
  })

  it('should display completion timestamp', () => {
    const completedAt = new Date('2025-01-15T10:30:00')
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 12,
      percentage: 60,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt
    }

    render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(
      screen.getByText(`Session completed at ${completedAt.toLocaleString()}`)
    ).toBeInTheDocument()
  })

  it('should show green progress bar for passing scores', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 15,
      percentage: 75,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    const { getByTestId } = render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    const progressBar = getByTestId('progress-bar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle({ width: '75%' })
  })

  it('should show red progress bar for failing scores', () => {
    const result: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 8,
      percentage: 40,
      isEarlyWin: false,
      isEarlyFail: false,
      completedAt: new Date()
    }

    const { getByTestId } = render(
      <GameResults
        result={result}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    const progressBar = getByTestId('progress-bar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle({ width: '40%' })
  })

  it('should only show early win achievement box when isEarlyWin is true', () => {
    const earlyWinResult: GameResult = {
      sessionId: 'test-session',
      totalQuestions: 20,
      correctAnswers: 12,
      percentage: 60,
      isEarlyWin: true,
      isEarlyFail: false,
      completedAt: new Date()
    }

    const { rerender } = render(
      <GameResults
        result={earlyWinResult}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.getByText(/Early Win Achievement!/)).toBeInTheDocument()

    // Now test with regular completion
    const regularResult: GameResult = {
      ...earlyWinResult,
      isEarlyWin: false
    }

    rerender(
      <GameResults
        result={regularResult}
        onPlayAgain={mockOnPlayAgain}
        onViewHistory={mockOnViewHistory}
      />
    )

    expect(screen.queryByText(/Early Win Achievement!/)).not.toBeInTheDocument()
  })
})
