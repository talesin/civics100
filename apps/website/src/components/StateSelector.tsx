import React, { useState, useEffect } from 'react'
import { StateAbbreviation } from 'civics2json'
import { StatesByAbbreviation } from 'civics2json'

interface StateSelectorProps {
  selectedState: StateAbbreviation
  onStateChange: (state: StateAbbreviation) => void
  className?: string
}

// List of states sorted by name for dropdown
const stateOptions = Object.values(StatesByAbbreviation)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((state) => ({
    value: state.abbreviation,
    label: state.name,
    isTerritory: ['AS', 'GU', 'MP', 'PR', 'VI'].includes(state.abbreviation)
  }))

export default function StateSelector({
  selectedState,
  onStateChange,
  className = ''
}: StateSelectorProps) {
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null)

  const selectedStateInfo = StatesByAbbreviation[selectedState]

  // Function to detect user's location and determine their state
  // TODO: refactor location detection to a service with proper error handling
  const detectLocation = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.geolocation === 'undefined') {
      console.log('Geolocation is not supported by this browser')
      return
    }

    setIsDetectingLocation(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords

      // Use a reverse geocoding service to get state from coordinates
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )

      if (!response.ok) {
        throw new Error('Failed to get location data')
      }

      const data = await response.json()
      const stateAbbr = data.principalSubdivision

      // Validate and convert state abbreviation
      if (
        typeof stateAbbr === 'string' &&
        StatesByAbbreviation[stateAbbr as StateAbbreviation] !== undefined
      ) {
        onStateChange(stateAbbr as StateAbbreviation)
        setHasLocationPermission(true)
      } else {
        console.log('Could not determine state from location')
      }
    } catch (error) {
      console.log('Error detecting location:', error)
      setHasLocationPermission(false)
    } finally {
      setIsDetectingLocation(false)
    }
  }

  // Check if geolocation permission has been granted previously
  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.permissions !== 'undefined' &&
      typeof navigator.permissions.query !== 'undefined'
    ) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setHasLocationPermission(result.state === 'granted')
        })
        .catch(() => {
          setHasLocationPermission(null)
        })
    }
  }, [])

  const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = event.target.value as StateAbbreviation
    onStateChange(newState)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="state-selector"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Select your state:
        </label>

        {typeof navigator !== 'undefined' &&
          typeof navigator.geolocation !== 'undefined' &&
          hasLocationPermission !== false && (
            <button
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              {isDetectingLocation ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Detecting...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Auto-detect
                </span>
              )}
            </button>
          )}
      </div>

      <div className="relative">
        <select
          id="state-selector"
          value={selectedState}
          onChange={handleStateChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
        >
          {stateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} {option.isTerritory ? '(Territory)' : ''}
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

      {selectedStateInfo !== undefined && (
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
          <span className="font-medium">Selected:</span> {selectedStateInfo.name}
          {selectedStateInfo.capital !== 'D.C. is not a state and does not have a capital' && (
            <span className="ml-2">
              <span className="font-medium">Capital:</span> {selectedStateInfo.capital}
            </span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Questions will be customized based on your selected state&apos;s representatives, senators,
        and governor.
      </div>
    </div>
  )
}
