'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import QuestionStatisticsTable from '@/components/QuestionStatisticsTable'
import QuestionDetailModal from '@/components/QuestionDetailModal'
import { LocalStorageService } from '@/services/LocalStorageService'
import { StatisticsService } from '@/services/StatisticsService'
import { runWithServicesAndErrorHandling } from '@/services/ServiceProvider'
import { QuestionStatistics, QuestionFilter, QuestionSortField } from '@/types'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'
import type { PairedAnswers } from 'questionnaire'
import { loadQuestions, civicsQuestionsWithDistractors } from 'questionnaire'

// Extended theme colors for statistics-specific UI
const statsThemeColors = {
  light: {
    textLight: '#6b7280',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    blueText: '#2563eb',
    purpleText: '#9333ea',
    greenText: '#16a34a',
    orangeText: '#ea580c',
  },
  dark: {
    textLight: '#9ca3af',
    inputBg: '#374151',
    inputBorder: '#4b5563',
    blueText: '#60a5fa',
    purpleText: '#c084fc',
    greenText: '#4ade80',
    orangeText: '#fb923c',
  },
}

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
  const { theme } = useThemeContext()
  const baseColors = themeColors[theme]
  const statsColors = statsThemeColors[theme]
  const colors = { ...baseColors, ...statsColors }

  const loadData = useCallback(() => {
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
  }, [])

  const applyFiltersAndSort = useCallback(() => {
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
      }),
      (error) => {
        console.error('Failed to apply filters:', error)
      }
    )
  }, [statistics, filter, pairedAnswers, searchQuery, sortField, sortAscending])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    applyFiltersAndSort()
  }, [applyFiltersAndSort])

  const handleSort = (field: QuestionSortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending)
    } else {
      setSortField(field)
      setSortAscending(true)
    }
  }

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    padding: 24,
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 6,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 14,
    outline: 'none',
  }

  if (isLoading) {
    return (
      <Layout title="Loading Statistics...">
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
            <p style={{ color: colors.textMuted }}>Loading question statistics...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Question Statistics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
            Question Statistics
          </h1>
          <p style={{ color: colors.textLight }}>
            Detailed breakdown of your performance on each question
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}>
          <div style={cardStyles}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>
              Total Questions
            </div>
            <div style={{ fontSize: 30, fontWeight: 'bold', color: colors.blueText }}>
              {summary.totalQuestions}
            </div>
          </div>

          <div style={cardStyles}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>
              Questions Attempted
            </div>
            <div style={{ fontSize: 30, fontWeight: 'bold', color: colors.purpleText }}>
              {summary.questionsAttempted}
            </div>
          </div>

          <div style={cardStyles}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>
              Mastered
            </div>
            <div style={{ fontSize: 30, fontWeight: 'bold', color: colors.greenText }}>
              {summary.questionsMastered}
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              3+ consecutive correct
            </div>
          </div>

          <div style={cardStyles}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>
              Need Practice
            </div>
            <div style={{ fontSize: 30, fontWeight: 'bold', color: colors.orangeText }}>
              {summary.questionsNeedingPractice}
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>&lt;60% accuracy</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: 8,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: 16
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {/* Filter Dropdown */}
            <div style={{ flexShrink: 0 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: colors.textMuted,
                marginBottom: 4
              }}>
                Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as QuestionFilter)}
                style={{ ...inputStyles, width: 192 }}
              >
                <option value={QuestionFilter.All}>All Questions</option>
                <option value={QuestionFilter.Mastered}>Mastered</option>
                <option value={QuestionFilter.NeedsPractice}>Needs Practice</option>
                <option value={QuestionFilter.NeverAsked}>Never Asked</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ flexGrow: 1, minWidth: 200 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: colors.textMuted,
                marginBottom: 4
              }}>
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                style={inputStyles}
              />
            </div>
          </div>

          {/* Results count */}
          <div style={{ marginTop: 12, fontSize: 14, color: colors.textLight }}>
            Showing {filteredStatistics.length} of {statistics.length} questions
          </div>
        </div>

        {/* Statistics Table */}
        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: 8,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 28rem)' }}>
            <QuestionStatisticsTable
              statistics={filteredStatistics}
              sortField={sortField}
              sortAscending={sortAscending}
              onSort={handleSort}
              onQuestionClick={(stat) => setSelectedQuestion(stat)}
            />
          </div>
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
