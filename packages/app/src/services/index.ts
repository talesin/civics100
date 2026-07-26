// Public barrel for the shared service layer (exports-map subpath `app/services`).
//
// HAZARD: never `export *` from 'questionnaire' here, and never merge
// questionnaire's QuestionDataServiceDefault into an app layer — questionnaire's
// internal QuestionDataService shares the Effect tag string 'QuestionDataService'
// with the service below, and merging both would silently collide.
export * from './LocalStorageService'
export * from './SessionService'
export * from './QuestionDataService'
export * from './StatisticsService'
export * from './DistrictDataService'
export * from './TtsService'
export * from './SoundService'
export * from './ServiceLayer'
