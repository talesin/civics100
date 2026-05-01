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
 */
export const runWithServices = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Promise<A> => {
  // TypeScript cannot statically reduce Exclude<R, AppServices> to never for a generic R,
  // so we assert after providing. The cast is safe: AppServiceLayer provides all AppServices.
  const provided = effect.pipe(Effect.provide(AppServiceLayer)) as unknown as Effect.Effect<A, E, never>
  return Effect.runPromise(provided)
}

/**
 * Helper function to run Effect programs with all required services and custom error handling
 * This provides a consistent way to execute Effects in React components with error handling
 */
export const runWithServicesAndErrorHandling = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  onError: (error: unknown) => void = (error) => console.error('Service error:', error)
): Promise<A | undefined> => {
  // TypeScript cannot statically reduce Exclude<R, AppServices> to never for a generic R,
  // so we assert after providing. The cast is safe: AppServiceLayer provides all AppServices.
  const provided = effect.pipe(
    Effect.provide(AppServiceLayer),
    Effect.catchAll((error: unknown) => {
      onError(error)
      return Effect.succeed(undefined)
    })
  ) as unknown as Effect.Effect<A | undefined, never, never>
  return Effect.runPromise(provided)
}
