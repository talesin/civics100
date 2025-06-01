import { Effect, Console } from 'effect'
import { NodeContext } from '@effect/platform-node'
import { fetchCivicsQuestions } from './fetchCivicsQuestions'
import { parseQuestions } from './parseQuestions'
import { FetchHttpClient } from '@effect/platform'
import * as fs from 'fs'
import * as path from 'path'

// Example program that fetches and parses civics questions
const program = Effect.gen(function* (_) {
  // Option 1: Fetch questions from the web
  yield* Console.log('Fetching civics questions from USCIS website...')
  const textFromWeb = yield* fetchCivicsQuestions
  yield* Console.log(`Fetched ${textFromWeb.length} characters`)

  // Option 2: Read from local file if available
  // This is more reliable for testing
  let textToUse = textFromWeb
  const localFilePath = path.join(process.cwd(), 'data', '100q.txt')

  if (fs.existsSync(localFilePath)) {
    yield* Console.log('Local file found, using it instead of web content')
    textToUse = fs.readFileSync(localFilePath, 'utf-8')
  } else {
    // Save the fetched content to a local file for future use
    yield* Console.log('Saving fetched content to local file')
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
    fs.writeFileSync(localFilePath, textFromWeb, 'utf-8')
  }

  // Parse the questions
  yield* Console.log('Parsing questions...')
  const questions = yield* parseQuestions(textToUse)

  // Log some statistics
  yield* Console.log(`Successfully parsed ${questions.length} questions`)

  // Log the first 3 questions as a sample
  yield* Console.log('\nSample questions:')
  yield* Console.log(JSON.stringify(questions, null, 2))

  // Save the parsed questions as JSON
  const outputPath = path.join(process.cwd(), 'data', 'civics-questions.json')
  yield* Console.log(`\nSaving parsed questions to ${outputPath}`)
  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf-8')

  return questions
}).pipe(Effect.provide(NodeContext.layer), Effect.provide(FetchHttpClient.layer))

// Run the program
Effect.runPromise(program)
  .then(() => console.log('Program completed successfully'))
  .catch((error) => console.error('Program failed:', error))
