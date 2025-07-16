import { Effect, Layer } from 'effect'
import { GameService } from 'questionnaire'
import { QuestionDataService } from './QuestionDataService'
import { SessionService } from './SessionService'
import { LocalStorageService } from './LocalStorageService'

/**
 * Centralized service layer that provides all application services
 * This eliminates the need to manually provide layers in each component
 * 
 * We merge all the default layers - Effect will handle dependency resolution
 */
export const AppServiceLayer = Layer.mergeAll(
  LocalStorageService.Default,
  GameService.Default,
  QuestionDataService.Default,
  SessionService.Default
)

/**
 * Helper function to run Effect programs with all required services
 * This provides a consistent way to execute Effects in React components
 */
export const runWithServices = <A, E = never, R = never>(
  effect: Effect.Effect<A, E, R>
): Promise<A> => {
  // Type assertion needed due to Effect-TS layer providing complexities
  return Effect.runPromise(effect.pipe(Effect.provide(AppServiceLayer)) as Effect.Effect<A, E, never>)
}

/**
 * Helper function to run Effect programs with all required services and custom error handling
 * This provides a consistent way to execute Effects in React components with error handling
 */
export const runWithServicesAndErrorHandling = <A, E = never, R = never>(
  effect: Effect.Effect<A, E, R>,
  onError?: (error: unknown) => void
): Promise<A | undefined> => {
  // Type assertion needed due to Effect-TS layer providing complexities
  return Effect.runPromise(
    effect.pipe(
      Effect.provide(AppServiceLayer),
      Effect.catchAll((error: unknown) => {
        if (onError) {
          onError(error)
        } else {
          console.error('Service error:', error)
        }
        return Effect.succeed(undefined)
      })
    ) as Effect.Effect<A | undefined, never, never>
  )
}