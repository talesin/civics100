'use client'

import React, { useState, useEffect } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import QuestionStatisticsTable from '@/components/QuestionStatisticsTable'
import QuestionDetailModal from '@/components/QuestionDetailModal'
import { LocalStorageService } from '@/services/LocalStorageService'
import { StatisticsService } from '@/services/StatisticsService'
import { runWithServicesAndErrorHandling } from '@/services/ServiceProvider'
import { QuestionStatistics, QuestionFilter, QuestionSortField } from '@/types'
import type { PairedAnswers } from 'questionnaire'
import { loadQuestions, civicsQuestionsWithDistractors } from 'questionnaire'

export default function Statistics() {
  const [statistics, setStatistics] = useState<QuestionStatistics[]>([])
  const [filteredStatistics, setFilteredStatistics] = useState<QuestionStatistics[]>([])
  const [pairedAnswers, setPairedAnswers] = useState<PairedAnswers>({})
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<QuestionFilter>(QuestionFilter.All)
  const [sortField, setSortField] = useState<QuestionSortField>(QuestionSortField.QuestionNumber)
  const [sortAscending, setSortAscending] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionStatistics | null>(null)
  const [summary, setSummary] = useState({
    totalQuestions: 0,
    questionsAttempted: 0,
    questionsMastered: 0,
    questionsNeedingPractice: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statistics, filter, sortField, sortAscending, searchQuery])

  const loadData = () => {
    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        const statisticsService = yield* StatisticsService

        // Load game settings to get user state
        const gameSettings = yield* storageService.getGameSettings()

        // Load paired answers
        const answers = yield* storageService.getPairedAnswers()
        setPairedAnswers(answers)

        // Load all questions using loadQuestions from questionnaire package
        const allQuestions = yield* loadQuestions({
          questions: civicsQuestionsWithDistractors,
          userState: gameSettings.userState,
          userDistrict: gameSettings.userDistrict
        })

        // Calculate statistics
        const stats = yield* statisticsService.calculateQuestionStatistics(allQuestions, answers)
        setStatistics([...stats])

        // Get summary
        const summaryStats = yield* statisticsService.getSummaryStatistics(allQuestions, answers)
        setSummary(summaryStats)

        setIsLoading(false)
      }),
      (error) => {
        console.error('Failed to load statistics:', error)
        setIsLoading(false)
      }
    )
  }

  const applyFiltersAndSort = () => {
    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const statisticsService = yield* StatisticsService

        // Apply filter
        let filtered = statisticsService.filterQuestions(statistics, filter, pairedAnswers)

        // Apply search
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (stat) =>
              stat.questionText.toLowerCase().includes(query) ||
              stat.correctAnswerText.toLowerCase().includes(query) ||
              stat.questionNumber.includes(query)
          )
        }

        // Apply sort
        const sorted = statisticsService.sortQuestions(filtered, sortField, sortAscending)

        setFilteredStatistics([...sorted])
      })
    )
  }

  const handleSort = (field: QuestionSortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending)
    } else {
      setSortField(field)
      setSortAscending(true)
    }
  }

  if (isLoading) {
    return (
      <Layout title="Loading Statistics...">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading question statistics...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Question Statistics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Question Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed breakdown of your performance on each question
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Questions
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalQuestions}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Questions Attempted
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {summary.questionsAttempted}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mastered
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {summary.questionsMastered}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              3+ consecutive correct
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Need Practice
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {summary.questionsNeedingPractice}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">&lt;60% accuracy</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter Dropdown */}
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as QuestionFilter)}
                className="block w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={QuestionFilter.All}>All Questions</option>
                <option value={QuestionFilter.Mastered}>Mastered</option>
                <option value={QuestionFilter.NeedsPractice}>Needs Practice</option>
                <option value={QuestionFilter.NeverAsked}>Never Asked</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredStatistics.length} of {statistics.length} questions
          </div>
        </div>

        {/* Statistics Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <QuestionStatisticsTable
            statistics={filteredStatistics}
            sortField={sortField}
            sortAscending={sortAscending}
            onSort={handleSort}
            onQuestionClick={(stat) => setSelectedQuestion(stat)}
          />
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion !== null ? (
        <QuestionDetailModal
          question={selectedQuestion}
          pairedAnswers={pairedAnswers}
          onClose={() => setSelectedQuestion(null)}
        />
      ) : null}
    </Layout>
  )
}
