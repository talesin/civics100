import { Effect, Layer, ManagedRuntime } from 'effect'
import { GameService } from 'questionnaire'
import { LocalStorageService } from './LocalStorageService'
import { QuestionDataService } from './QuestionDataService'
import { SessionService } from './SessionService'
import { SoundService } from './SoundService'
import { StatisticsService } from './StatisticsService'
import { TtsService } from './TtsService'

/**
 * Per-platform layer overrides. The service Defaults are already
 * platform-correct via the package-internal `.native` splits, so apps need
 * zero wiring — overrides exist for tests and future platform variants.
 */
export interface PlatformLayers {
  readonly storage: Layer.Layer<LocalStorageService>
  readonly tts: Layer.Layer<TtsService>
  readonly sound: Layer.Layer<SoundService>
}

/**
 * Centralized service layer that provides all application services.
 * This eliminates the need to manually provide layers in each component.
 *
 * HAZARD: never merge questionnaire's QuestionDataServiceDefault here — it
 * shares the Effect tag string 'QuestionDataService' with app's own
 * QuestionDataService and would silently collide.
 */
export const makeAppServiceLayer = (platform?: Partial<PlatformLayers>) =>
  Layer.mergeAll(
    platform?.storage ?? LocalStorageService.Default,
    platform?.tts ?? TtsService.Default,
    platform?.sound ?? SoundService.Default,
    GameService.Default,
    QuestionDataService.Default,
    SessionService.Default,
    StatisticsService.Default
  )

export const AppServiceLayer = makeAppServiceLayer()

/**
 * Shared lazy runtime over AppServiceLayer. Memoizes service construction
 * across calls so stateful services (AudioContext, speech state) persist —
 * per-call Effect.provide would rebuild them on every run.
 */
export const AppRuntime = ManagedRuntime.make(AppServiceLayer)

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
  | TtsService
  | SoundService

/**
 * Helper function to run Effect programs with all required services
 * This provides a consistent way to execute Effects in React components
 */
export const runWithServices = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> => {
  // TypeScript cannot statically reduce Exclude<R, AppServices> to never for a generic R,
  // so we assert. The cast is safe: AppRuntime provides all AppServices.
  return AppRuntime.runPromise(effect as unknown as Effect.Effect<A, E, AppServices>)
}

/**
 * Helper function to run Effect programs with all required services and custom error handling
 * This provides a consistent way to execute Effects in React components with error handling
 */
export const runWithServicesAndErrorHandling = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  onError: (error: unknown) => void = (error) => console.error('Service error:', error)
): Promise<A | undefined> => {
  // Same cast rationale as runWithServices.
  const handled = (effect as unknown as Effect.Effect<A, E, AppServices>).pipe(
    Effect.catchAll((error: unknown) => {
      onError(error)
      return Effect.succeed(undefined)
    })
  )
  return AppRuntime.runPromise(handled)
}
