import { Effect, Array as EffectArray, Option } from 'effect'
import type { Question as CivicsQuestion } from 'civics2json'
import type { QuestionWithDistractors } from 'distractions'
import { QuestionNumber, type Question } from './types.js'
import { createQuestion } from './QuestionSelector.js'

export type QuestionDataSource = {
  civicsQuestions: ReadonlyArray<CivicsQuestion>
  questionsWithDistractors: ReadonlyArray<QuestionWithDistractors>
}

const parseQuestionNumber = (questionNumber: number): QuestionNumber => {
  return QuestionNumber(questionNumber.toString())
}

const findDistractorsForQuestion = (
  questionNumber: QuestionNumber,
  questionsWithDistractors: ReadonlyArray<QuestionWithDistractors>
): Option.Option<ReadonlyArray<string>> => {
  const found = questionsWithDistractors.find((q) => q.questionNumber.toString() === questionNumber)
  return found ? Option.some(found.distractors) : Option.none()
}

const extractCorrectAnswers = (civicsQuestion: CivicsQuestion): ReadonlyArray<string> => {
  switch (civicsQuestion.answers._type) {
    case 'text':
      return civicsQuestion.answers.choices
    case 'senator':
      return civicsQuestion.answers.choices.map((choice) => choice.senator)
    case 'representative':
      return civicsQuestion.answers.choices.map((choice) => choice.representative)
    case 'governor':
      return civicsQuestion.answers.choices.map((choice) => choice.governor)
    case 'capital':
      return civicsQuestion.answers.choices.map((choice) => choice.capital)
    default:
      return []
  }
}

const createQuestionFromData = (
  civicsQuestion: CivicsQuestion,
  questionsWithDistractors: ReadonlyArray<QuestionWithDistractors>
): Effect.Effect<Option.Option<Question>, never, never> => {
  return Effect.gen(function* () {
    const questionNumber = parseQuestionNumber(civicsQuestion.questionNumber)
    const correctAnswers = extractCorrectAnswers(civicsQuestion)

    if (correctAnswers.length === 0) {
      return Option.none()
    }

    const distractorsOption = findDistractorsForQuestion(questionNumber, questionsWithDistractors)

    if (Option.isNone(distractorsOption)) {
      return Option.none()
    }

    const distractors = distractorsOption.value
    const question = yield* createQuestion(
      questionNumber,
      civicsQuestion.question,
      correctAnswers,
      distractors
    )

    return Option.some(question)
  })
}

export const loadQuestions = (
  dataSource: QuestionDataSource
): Effect.Effect<ReadonlyArray<Question>, never, never> => {
  return Effect.gen(function* () {
    const questionEffects = dataSource.civicsQuestions.map((civicsQuestion) =>
      createQuestionFromData(civicsQuestion, dataSource.questionsWithDistractors)
    )

    const questionOptions = yield* Effect.all(questionEffects)
    const questions = EffectArray.filterMap(
      questionOptions,
      Option.match({
        onNone: () => Option.none(),
        onSome: (question) => Option.some(question)
      })
    )

    return questions
  })
}

export const getAvailableQuestionNumbers = (
  questions: ReadonlyArray<Question>
): ReadonlyArray<QuestionNumber> => {
  return questions.map((q) => q.questionNumber)
}

export const findQuestionByNumber = (
  questionNumber: QuestionNumber,
  questions: ReadonlyArray<Question>
): Option.Option<Question> => {
  const found = questions.find((q) => q.questionNumber === questionNumber)
  return found ? Option.some(found) : Option.none()
}

export const getQuestionCount = (questions: ReadonlyArray<Question>): number => {
  return questions.length
}

export const getQuestionsWithMissingDistractors = (
  civicsQuestions: ReadonlyArray<CivicsQuestion>,
  questionsWithDistractors: ReadonlyArray<QuestionWithDistractors>
): ReadonlyArray<string> => {
  const distractorNumbers = new Set(
    questionsWithDistractors.map((q) => q.questionNumber.toString())
  )

  return civicsQuestions
    .filter((q) => !distractorNumbers.has(q.questionNumber.toString()))
    .map((q) => q.questionNumber.toString())
}
