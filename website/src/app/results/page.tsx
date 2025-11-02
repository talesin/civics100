'use client'

import React, { useState, useEffect } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameResult, GameStats } from '@/types'

export default function Results() {
  const [results, setResults] = useState<GameResult[]>([])
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    earlyWins: 0,
    earlyFailures: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const fetchData = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const gameResults = yield* storageService.getGameResults()
      const gameStats = yield* storageService.getGameStats()

      setResults([...gameResults])
      setStats(gameStats)
      setIsLoading(false)
    })

    Effect.runPromise(fetchData.pipe(Effect.provide(LocalStorageService.Default))).catch(
      console.error
    )
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all your test results? This cannot be undone.')) {
      const clearData = Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        yield* storageService.clearAllData()
        setResults([])
        setStats({
          totalGames: 0,
          averageScore: 0,
          bestScore: 0,
          earlyWins: 0,
          earlyFailures: 0
        })
      })

      Effect.runPromise(clearData.pipe(Effect.provide(LocalStorageService.Default))).catch(
        console.error
      )
    }
  }

  const getResultBadge = (result: GameResult) => {
    if (result.isEarlyFail === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          Early Fail
        </span>
      )
    } else if (result.isEarlyWin === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Early Win
        </span>
      )
    } else if (result.percentage >= 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Passed
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Failed
        </span>
      )
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (isLoading) {
    return (
      <Layout title="Loading Results...">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Test Results">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Test Results</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => (window.location.href = '/game')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Take New Test
            </button>
            {(results.length > 0) === true ? (
              <button
                onClick={handleClearData}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Clear All Data
              </button>
            ) : null}
          </div>
        </div>

        <StatsSummary stats={stats} />

        {results.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Test Results Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You haven&apos;t taken any civics tests yet. Take your first test to see your results
              here.
            </p>
            <button
              onClick={() => (window.location.href = '/game')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Take Your First Test
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test History ({results.length} tests)
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result, index) => (
                <div
                  key={result.sessionId}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Test #{results.length - index}
                        </span>
                        {getResultBadge(result)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {result.completedAt.toLocaleDateString()} at{' '}
                          {result.completedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <span className={`font-semibold ${getScoreColor(result.percentage)}`}>
                          {result.percentage}%
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </span>
                        {result.isEarlyWin === true ? (
                          <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                            ⭐ Early completion
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${result.percentage}, 100`}
                            className={result.percentage >= 60 ? 'text-green-500' : 'text-red-500'}
                          />
                        </svg>
                        <span
                          className={`absolute text-xs font-bold ${getScoreColor(result.percentage)}`}
                        >
                          {result.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
