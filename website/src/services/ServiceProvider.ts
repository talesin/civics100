import { Effect, Layer } from 'effect'
import { GameService } from 'questionnaire'
import { QuestionDataService } from './QuestionDataService'
import { SessionService } from './SessionService'
import { LocalStorageService } from './LocalStorageService'
import { StatisticsService } from './StatisticsService'

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
  SessionService.Default,
  StatisticsService.Default
)

/**
 * Type representing all services provided by AppServiceLayer
 * Used to constrain effects to only require services we can provide
 */
export type AppServices =
  | LocalStorageService
  | GameService
  | QuestionDataService
  | SessionService
  | StatisticsService

/**
 * Helper function to run Effect programs with all required services
 * This provides a consistent way to execute Effects in React components
 *
 * Only accepts Effects that require services provided by AppServiceLayer.
 * TypeScript will error at compile time if an effect requires a service not listed.
 */
export const runWithServices = <A, E>(
  effect: Effect.Effect<A, E, AppServices>
): Promise<A> => {
  return Effect.runPromise(effect.pipe(Effect.provide(AppServiceLayer)))
}

/**
 * Helper function to run Effect programs with all required services and custom error handling
 * This provides a consistent way to execute Effects in React components with error handling
 *
 * Only accepts Effects that require services provided by AppServiceLayer.
 * TypeScript will error at compile time if an effect requires a service not listed.
 */
export const runWithServicesAndErrorHandling = <A, E>(
  effect: Effect.Effect<A, E, AppServices>,
  onError: (error: unknown) => void = (error) => console.error('Service error:', error)
): Promise<A | undefined> => {
  return Effect.runPromise(
    effect.pipe(
      Effect.provide(AppServiceLayer),
      Effect.catchAll((error: unknown) => {
        onError(error)
        return Effect.succeed(undefined)
      })
    )
  )
}
