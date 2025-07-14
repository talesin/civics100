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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Your Statistics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalGames}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Games Played
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.averageScore}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Average Score
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.bestScore}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Best Score
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.earlyWins}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Early Wins
          </div>
        </div>
      </div>

      {stats.averageScore >= 60 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm text-center">
            🎯 Great job! You&apos;re consistently passing the civics test.
          </p>
        </div>
      )}

      {stats.bestScore === 100 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
            🏆 Perfect score achieved! You&apos;re a civics expert!
          </p>
        </div>
      )}
    </div>
  )
}