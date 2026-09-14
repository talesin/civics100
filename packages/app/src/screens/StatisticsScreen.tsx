import { useEffect, useMemo, useState } from 'react'
import { Effect } from 'effect'
import { isWeb, styled } from 'tamagui'
import type { PairedAnswers } from 'questionnaire'
import { civicsQuestionsWithDistractors, loadQuestions } from 'questionnaire'
import {
  EditorialInput,
  EditorialSelect,
  LoadingSpinner,
  Text,
  XStack,
  YStack
} from '../components/tamagui'
import QuestionDetailModal from '../components/QuestionDetailModal'
import QuestionStatisticsTable from '../components/QuestionStatisticsTable'
import { LocalStorageService } from '../services/LocalStorageService'
import { runWithServicesAndErrorHandling } from '../services/ServiceLayer'
import { StatisticsService, filterQuestions, sortQuestions } from '../services/StatisticsService'
import { QuestionFilter, QuestionSortField } from '../types'
import type { QuestionStatistics } from '../types'
import { Eyebrow, PageTitle } from './editorial'

interface SummaryCell {
  readonly label: string
  readonly value: number
  readonly helper?: string
}

interface SummaryStats {
  readonly totalQuestions: number
  readonly questionsAttempted: number
  readonly questionsMastered: number
  readonly questionsNeedingPractice: number
}

const EMPTY_SUMMARY: SummaryStats = {
  totalQuestions: 0,
  questionsAttempted: 0,
  questionsMastered: 0,
  questionsNeedingPractice: 0
}

const isQuestionFilter = (value: string): value is QuestionFilter =>
  Object.values(QuestionFilter).includes(value as QuestionFilter)

// Port of the .stats-strip CSS grid (globals.css, now deleted): four 1fr
// columns, two under $sm (the old 768px breakpoint, 1px wider), one under
// $xxs (the old 480px breakpoint). Cells are equal-width flex items with
// border-box sizing, so the inter-cell rules sit exactly where the grid's did;
// which edges carry a rule depends on the column count, hence the per-cell
// media props at the call site.
const SummaryStrip = styled(XStack, {
  flexWrap: 'wrap',
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: '$editorialRule'
})

const SummaryCellFrame = styled(YStack, {
  flexBasis: '25%',
  flexGrow: 0,
  flexShrink: 0,
  paddingVertical: 24,
  paddingHorizontal: 20,
  borderColor: '$editorialRule'
})

const SummaryLabel = styled(Text, {
  tag: 'span',
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 0.88, // 0.08em at 11px
  textTransform: 'uppercase',
  color: '$editorialMuted',
  marginBottom: 6
})

// clamp(2rem, 4vw, 2.5rem): 40px at the desktop baseline, 32px under $sm
// (exact for widths ≤ 800 and ≥ 1000; the vw ramp between is approximated).
const SummaryValue = styled(Text, {
  tag: 'span',
  fontFamily: '$serifDisplay',
  fontSize: 40,
  lineHeight: 40,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.8, // -0.02em at 40px
  marginBottom: 6,

  $sm: {
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64
  }
})

// Was an inline span, so it sat in the cell's 24px body line box (16px × 1.5
// strut) with its 14px content box 6px below the top; lineHeight 22 +
// marginTop 2 reproduce both. The old marginTop: 6 was inert on an inline
// element and is dropped.
const SummaryHelper = styled(Text, {
  tag: 'span',
  fontSize: 12,
  lineHeight: 22,
  marginTop: 2,
  color: '$editorialMuted'
})

const FieldLabel = styled(Text, {
  tag: 'label',
  fontSize: 13,
  fontWeight: '500',
  color: '$editorialMuted',
  marginBottom: 6
})

export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<QuestionStatistics[]>([])
  const [pairedAnswers, setPairedAnswers] = useState<PairedAnswers>({})
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<QuestionFilter>(QuestionFilter.All)
  const [sortField, setSortField] = useState<QuestionSortField>(QuestionSortField.QuestionNumber)
  const [sortAscending, setSortAscending] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionStatistics | null>(null)
  const [summary, setSummary] = useState<SummaryStats>(EMPTY_SUMMARY)

  // Derived in render (React 19 guidance) instead of the old state + effect
  // pair, which re-ran the service on every keystroke and double-rendered.
  const filteredStatistics = useMemo(() => {
    let filtered = filterQuestions(statistics, filter, pairedAnswers)

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (stat) =>
          stat.questionText.toLowerCase().includes(query) ||
          stat.correctAnswerText.toLowerCase().includes(query) ||
          stat.questionNumber.includes(query)
      )
    }

    return sortQuestions(filtered, sortField, sortAscending)
  }, [statistics, filter, pairedAnswers, searchQuery, sortField, sortAscending])

  useEffect(() => {
    let mounted = true

    void runWithServicesAndErrorHandling(
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
      }).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            if (mounted) setIsLoading(false)
          })
        )
      ),
      (error) => {
        console.error('Failed to load statistics:', error)
      }
    )

    return () => {
      mounted = false
    }
  }, [])

  const handleSort = (field: QuestionSortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending)
    } else {
      setSortField(field)
      setSortAscending(true)
    }
  }

  const summaryCells: ReadonlyArray<SummaryCell> = [
    { label: 'Total Questions', value: summary.totalQuestions },
    { label: 'Attempted', value: summary.questionsAttempted },
    { label: 'Mastered', value: summary.questionsMastered, helper: '3+ consecutive correct' },
    { label: 'Need Practice', value: summary.questionsNeedingPractice, helper: '<60% accuracy' }
  ]

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={384}>
        <YStack alignItems="center">
          <LoadingSpinner marginBottom={16} />
          <Text tag="p" color="$editorialMuted" fontSize={16} lineHeight={24}>
            Loading question statistics...
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <>
      <YStack gap={32} maxWidth={1100} marginHorizontal="auto">
        <YStack>
          <Eyebrow>Performance · Civics Questions</Eyebrow>
          <PageTitle marginBottom={10}>Question Statistics</PageTitle>
          <Text tag="p" color="$editorialMuted" fontSize={14} lineHeight={22.39}>
            Detailed breakdown of your performance on each question.
          </Text>
        </YStack>

        <SummaryStrip>
          {summaryCells.map((cell, i) => (
            <SummaryCellFrame
              key={cell.label}
              borderLeftWidth={i > 0 ? 1 : 0}
              $sm={{
                flexBasis: '50%',
                borderLeftWidth: i % 2 === 1 ? 1 : 0,
                borderTopWidth: i >= 2 ? 1 : 0
              }}
              $xxs={{
                flexBasis: '100%',
                borderLeftWidth: 0,
                borderTopWidth: i >= 1 ? 1 : 0
              }}
            >
              <SummaryLabel>{cell.label}</SummaryLabel>
              <SummaryValue>{cell.value}</SummaryValue>
              {cell.helper !== undefined ? <SummaryHelper>{cell.helper}</SummaryHelper> : null}
            </SummaryCellFrame>
          ))}
        </SummaryStrip>

        <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={20}>
          <Eyebrow>Filter · Search</Eyebrow>
          <XStack flexWrap="wrap" gap={16}>
            <YStack flexShrink={0}>
              <FieldLabel>Filter</FieldLabel>
              <EditorialSelect
                value={filter}
                onChange={(e) => {
                  const value = e.target.value
                  if (isQuestionFilter(value)) {
                    setFilter(value)
                  }
                }}
                style={{ width: 192 }}
              >
                <option value={QuestionFilter.All}>All Questions</option>
                <option value={QuestionFilter.Mastered}>Mastered</option>
                <option value={QuestionFilter.NeedsPractice}>Needs Practice</option>
                <option value={QuestionFilter.NeverAsked}>Never Asked</option>
              </EditorialSelect>
            </YStack>

            <YStack flexGrow={1} flexShrink={1} minWidth={200}>
              <FieldLabel>Search</FieldLabel>
              <EditorialInput
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
              />
            </YStack>
          </XStack>

          <Text fontSize={13} color="$editorialMuted" marginTop={12}>
            Showing {filteredStatistics.length} of {statistics.length} questions
          </Text>
        </YStack>

        <YStack borderTopWidth={1} borderBottomWidth={1} borderColor="$editorialRule">
          {/* The scroll box is web-only (vh/rem units, overflow-y: auto — the
              Tamagui `overflow` prop maps to `scroll`, whose always-on
              scrollbar gutter would shift the table). Native gets the plain
              list; the route wrapper owns scrolling there. */}
          <YStack
            {...(isWeb
              ? { maxHeight: 'calc(100vh - 28rem)', style: { overflowY: 'auto' as const } }
              : {})}
          >
            <QuestionStatisticsTable
              statistics={filteredStatistics}
              sortField={sortField}
              sortAscending={sortAscending}
              onSort={handleSort}
              onQuestionClick={(stat) => setSelectedQuestion(stat)}
            />
          </YStack>
        </YStack>
      </YStack>

      {selectedQuestion !== null ? (
        <QuestionDetailModal
          question={selectedQuestion}
          pairedAnswers={pairedAnswers}
          onClose={() => setSelectedQuestion(null)}
        />
      ) : null}
    </>
  )
}
