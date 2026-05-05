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
import type { PairedAnswers } from 'questionnaire'
import { loadQuestions, civicsQuestionsWithDistractors } from 'questionnaire'

type SummaryCell = {
  readonly label: string
  readonly value: number
  readonly helper?: string
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

  const applyFiltersAndSort = useCallback(() => {
    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const statisticsService = yield* StatisticsService

        let filtered = statisticsService.filterQuestions(statistics, filter, pairedAnswers)

        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (stat) =>
              stat.questionText.toLowerCase().includes(query) ||
              stat.correctAnswerText.toLowerCase().includes(query) ||
              stat.questionNumber.includes(query)
          )
        }

        const sorted = statisticsService.sortQuestions(filtered, sortField, sortAscending)
        setFilteredStatistics([...sorted])
      }),
      (error) => {
        console.error('Failed to apply filters:', error)
      }
    )
  }, [statistics, filter, pairedAnswers, searchQuery, sortField, sortAscending])

  useEffect(() => {
    let mounted = true

    runWithServicesAndErrorHandling(
      Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        const statisticsService = yield* StatisticsService

        const gameSettings = yield* storageService.getGameSettings()
        const answers = yield* storageService.getPairedAnswers()
        if (mounted) setPairedAnswers(answers)

        const allQuestions = yield* loadQuestions({
          questions: civicsQuestionsWithDistractors,
          userState: gameSettings.userState,
          userDistrict: gameSettings.userDistrict
        })

        const stats = yield* statisticsService.calculateQuestionStatistics(allQuestions, answers)
        if (mounted) setStatistics([...stats])

        const summaryStats = yield* statisticsService.getSummaryStatistics(allQuestions, answers)
        if (mounted) setSummary(summaryStats)
      }).pipe(Effect.ensuring(Effect.sync(() => {
        if (mounted) setIsLoading(false)
      }))),
      (error) => {
        console.error('Failed to load statistics:', error)
      }
    )

    return () => {
      mounted = false
    }
  }, [])

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

  const eyebrowStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--editorial-accent)',
    marginBottom: 10,
  }

  const statValueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)',
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    fontWeight: 500,
    color: 'var(--editorial-ink)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    display: 'block',
    marginBottom: 6,
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--editorial-muted)',
    display: 'block',
    marginBottom: 6,
  }

  const statHelperStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--editorial-muted)',
    marginTop: 6,
  }

  const summaryCells: ReadonlyArray<SummaryCell> = [
    { label: 'Total Questions', value: summary.totalQuestions },
    { label: 'Attempted', value: summary.questionsAttempted },
    { label: 'Mastered', value: summary.questionsMastered, helper: '3+ consecutive correct' },
    { label: 'Need Practice', value: summary.questionsNeedingPractice, helper: '<60% accuracy' },
  ]

  if (isLoading) {
    return (
      <Layout title="Loading Statistics...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--editorial-muted)' }}>Loading question statistics...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Question Statistics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1100, margin: '0 auto' }}>
        <div>
          <p style={eyebrowStyle}>Performance · Civics Questions</p>
          <h1 style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 500, color: 'var(--editorial-ink)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 10 }}>
            Question Statistics
          </h1>
          <p style={{ color: 'var(--editorial-muted)', fontSize: 14, lineHeight: 1.6 }}>
            Detailed breakdown of your performance on each question.
          </p>
        </div>

        {/* Summary Strip */}
        <div className="stats-strip">
          {summaryCells.map((cell) => (
            <div key={cell.label} className="stats-strip-cell">
              <span style={statLabelStyle}>{cell.label}</span>
              <span style={statValueStyle}>{cell.value}</span>
              {cell.helper !== undefined ? (
                <span style={statHelperStyle}>{cell.helper}</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div style={{ borderTop: '1px solid var(--editorial-rule)', paddingTop: 20 }}>
          <p style={eyebrowStyle}>Filter · Search</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 6 }}>
                Filter
              </label>
              <select
                value={filter}
                onChange={(e) => {
                  const value = e.target.value
                  if (Object.values(QuestionFilter).includes(value as QuestionFilter)) {
                    setFilter(value as QuestionFilter)
                  }
                }}
                className="input-editorial"
                style={{ width: 192 }}
              >
                <option value={QuestionFilter.All}>All Questions</option>
                <option value={QuestionFilter.Mastered}>Mastered</option>
                <option value={QuestionFilter.NeedsPractice}>Needs Practice</option>
                <option value={QuestionFilter.NeverAsked}>Never Asked</option>
              </select>
            </div>

            <div style={{ flexGrow: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 6 }}>
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="input-editorial"
              />
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--editorial-muted)' }}>
            Showing {filteredStatistics.length} of {statistics.length} questions
          </div>
        </div>

        {/* Statistics Table */}
        <div style={{ borderTop: '1px solid var(--editorial-rule)', borderBottom: '1px solid var(--editorial-rule)' }}>
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
// SENTINEL_1777939102
// ZSENTINEL_1777940798
