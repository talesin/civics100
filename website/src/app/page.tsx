'use client'

import React, { useState, useEffect } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameStats } from '@/types'

export default function Home() {
  const [stats, setStats] = useState<GameStats>({ totalGames: 0, averageScore: 0, bestScore: 0, earlyWins: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const gameStats = yield* storageService.getGameStats()
      setStats(gameStats)
      setIsLoading(false)
    })

    Effect.runPromise(loadStats.pipe(Effect.provide(LocalStorageService.Default)))
      .catch(console.error)
  }, [])

  const handleStartGame = () => {
    window.location.href = '/game'
  }

  const handleViewResults = () => {
    window.location.href = '/results'
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="US Civics Test">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            US Civics Test
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Test your knowledge of American civics and history. Answer questions about the Constitution, 
            government structure, and American history to see if you can pass the citizenship test.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Take the Test
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start a new civics test with up to 10 questions. You need 6 correct answers to pass, 
                or you can continue to answer all 10 questions.
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start New Test
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                View Results
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Review your past test results, track your progress, and see detailed statistics 
                about your civics knowledge.
              </p>
            </div>
            <button
              onClick={handleViewResults}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              View Results
            </button>
          </div>
        </div>

        <StatsSummary stats={stats} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About the Test
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Test Format</h4>
              <ul className="space-y-1">
                <li>• Up to 10 multiple choice questions</li>
                <li>• Pass with 6 correct answers</li>
                <li>• Questions from real civics test</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Topics Covered</h4>
              <ul className="space-y-1">
                <li>• American Government</li>
                <li>• American History</li>
                <li>• Integrated Civics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features</h4>
              <ul className="space-y-1">
                <li>• Track your progress</li>
                <li>• Immediate feedback</li>
                <li>• Historical performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
