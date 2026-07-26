// Moved to packages/app in Phase 3 (generalized as makeAppServiceLayer + AppRuntime);
// shim keeps `@/services/ServiceProvider` imports working.
export {
  AppServiceLayer,
  AppRuntime,
  makeAppServiceLayer,
  runWithServices,
  runWithServicesAndErrorHandling
} from 'app/services'
export type { AppServices, PlatformLayers } from 'app/services'
