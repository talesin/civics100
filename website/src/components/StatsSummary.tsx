import React from 'react'
import { GameStats } from '@/types'

interface StatsSummaryProps {
  stats: GameStats
}

export default function StatsSummary({ stats }: StatsSummaryProps) {
  if (stats.totalGames === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Your Statistics
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          No games played yet. Start your first civics test!
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
          Your Statistics
        </h3>
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {stats.totalGames}
          </div>
          <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
            Games Played
          </div>
        </div>

        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {stats.averageScore}%
          </div>
          <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
            Average Score
          </div>
        </div>

        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {stats.bestScore}%
          </div>
          <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium">
            Best Score
          </div>
        </div>

        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
            {stats.earlyWins}
          </div>
          <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-medium">
            Early Wins
          </div>
        </div>
      </div>

      {(stats.averageScore >= 60 || stats.bestScore === 100) === true ? (
        <div className="mt-6 space-y-3">
          {(stats.averageScore >= 60) === true ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  🎯 Great job! You&apos;re consistently passing the civics test.
                </p>
              </div>
            </div>
          ) : null}

          {(stats.bestScore === 100) === true ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </div>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  🏆 Perfect score achieved! You&apos;re a civics expert!
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
