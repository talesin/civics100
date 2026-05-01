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

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--theme-card-bg)',
    border: '1px solid var(--editorial-rule)',
    borderRadius: 8,
    padding: 24,
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 500, color: 'var(--editorial-ink)', letterSpacing: '-0.01em', marginBottom: 6 }}>
            Question Statistics
          </h1>
          <p style={{ color: 'var(--editorial-muted)', fontSize: 14 }}>
            Detailed breakdown of your performance on each question
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 4 }}>
              Total Questions
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--theme-primary)' }}>
              {summary.totalQuestions}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 4 }}>
              Questions Attempted
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--theme-purple)' }}>
              {summary.questionsAttempted}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 4 }}>
              Mastered
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--theme-success)' }}>
              {summary.questionsMastered}
            </div>
            <div style={{ fontSize: 12, color: 'var(--editorial-muted)', marginTop: 4 }}>
              3+ consecutive correct
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 4 }}>
              Need Practice
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--theme-warning)' }}>
              {summary.questionsNeedingPractice}
            </div>
            <div style={{ fontSize: 12, color: 'var(--editorial-muted)', marginTop: 4 }}>&lt;60% accuracy</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 4 }}>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--editorial-muted)', marginBottom: 4 }}>
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

          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--editorial-muted)' }}>
            Showing {filteredStatistics.length} of {statistics.length} questions
          </div>
        </div>

        {/* Statistics Table */}
        <div style={{ backgroundColor: 'var(--theme-card-bg)', border: '1px solid var(--editorial-rule)', borderRadius: 8, overflow: 'hidden' }}>
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
