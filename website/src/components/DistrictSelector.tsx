import React, { useState, useEffect } from 'react'
import { StateAbbreviation } from 'civics2json'
import { 
  getDistrictsForState, 
  formatDistrictLabel
} from '@/services/DistrictDataService'

type NonEmptyArray<T> = [T, ...T[]];

function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}


interface DistrictSelectorProps {
  selectedState: StateAbbreviation
  selectedDistrict?: string | undefined
  onDistrictChange: (district: string | undefined) => void
  className?: string
}

export default function DistrictSelector({
  selectedState,
  selectedDistrict,
  onDistrictChange,
  className = ''
}: DistrictSelectorProps) {
  const [districts, setDistricts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load districts when state changes
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    try {
      const stateDistricts = getDistrictsForState(selectedState)
      setDistricts(stateDistricts)

      // Auto-select if only one district
      if (stateDistricts.length === 1 && selectedDistrict !== stateDistricts[0]) {
        onDistrictChange(stateDistricts[0])
      }
      // Clear selection if current district is not valid for new state
      else if ((selectedDistrict != null) && !stateDistricts.includes(selectedDistrict)) {
        onDistrictChange(undefined)
      }
    } catch (err) {
      console.error('Failed to load districts:', err)
      setError('Failed to load district information')
      setDistricts([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedState, selectedDistrict, onDistrictChange])

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    onDistrictChange(value === '' ? undefined : value)
  }

  // Don't render if no districts loaded yet or error occurred
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Congressional District:
          </label>
        </div>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading districts...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error != null) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Congressional District:
          </label>
        </div>
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  // Don't render if no districts available
  if (!isNonEmptyArray(districts)) {
    return null
  }

  // If only one district, show it as read-only info
  if (districts.length === 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Congressional District:
          </label>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
          <span className="font-medium">District:</span> {formatDistrictLabel(districts[0])}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="district-selector"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Select your congressional district:
        </label>
      </div>

      <div className="relative">
        <select
          id="district-selector"
          value={selectedDistrict ?? ''}
          onChange={handleDistrictChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
        >
          <option value="">Select a district...</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {formatDistrictLabel(district)}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </div>

      {(selectedDistrict != null) && (
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
          <span className="font-medium">Selected:</span> {formatDistrictLabel(selectedDistrict)}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Selecting your district will show only your specific representative in relevant questions.
      </div>
    </div>
  )
}