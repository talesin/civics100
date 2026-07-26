// Moved to packages/app in Phase 3; shim keeps `@/services/DistrictDataService` imports working.
export {
  formatDistrictLabel,
  getDistrictsForState,
  getGovernorForState,
  getLocationDisplayName,
  getRepresentativeForDistrict,
  getSenatorForState,
  isValidDistrict
} from 'app/services'
