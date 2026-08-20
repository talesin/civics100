import React, { useState, useEffect, useCallback } from 'react'
import { StateAbbreviation } from 'civics2json'
import { StatesByAbbreviation } from 'civics2json'
import { XStack, YStack, Text, EditorialSelect, LoadingSpinner } from './tamagui'
import { MapPin } from './icons'
import { styled } from 'tamagui'

interface StateSelectorProps {
  readonly selectedState: StateAbbreviation
  readonly onStateChange: (state: StateAbbreviation) => void
  readonly className?: string
}

// List of states sorted by name for dropdown
const stateOptions = Object.values(StatesByAbbreviation)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((state) => ({
    value: state.abbreviation,
    label: state.name,
    isTerritory: ['AS', 'GU', 'MP', 'PR', 'VI'].includes(state.abbreviation)
  }))

const DetectButton = styled(XStack, {
  tag: 'button',
  backgroundColor: '$blue1',
  paddingHorizontal: '$3',
  paddingVertical: '$1',
  borderRadius: '$2',
  alignItems: 'center',
  gap: '$1',
  cursor: 'pointer',
  borderWidth: 0,

  hoverStyle: {
    backgroundColor: '$blue2'
  },

  pressStyle: {
    opacity: 0.9
  }
})

const DetectButtonText = styled(Text, {
  fontSize: '$4',
  color: '$primary'
})

const InfoBox = styled(XStack, {
  backgroundColor: '$backgroundHover',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$2',
  flexWrap: 'wrap'
})

const InfoText = styled(Text, {
  fontSize: '$5',
  color: '$placeholderColor'
})

const HelperText = styled(Text, {
  fontSize: '$5',
  color: '$placeholderColor'
})

const Label = styled(Text, {
  fontSize: '$5',
  fontWeight: '500',
  color: '$color'
})

// Geolocation is web-only: RN removed navigator.geolocation in 0.60, so on
// native this stays false and the component degrades to the plain dropdown.
const hasGeolocation = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined'

// Cache for detected location to avoid repeated API calls
const locationCache = {
  detectedState: null as StateAbbreviation | null,
  timestamp: 0,
  CACHE_DURATION_MS: 5 * 60 * 1000 // 5 minutes
}

const StateSelector = ({
  selectedState,
  onStateChange,
  className = ''
}: StateSelectorProps): React.ReactElement => {
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null)

  const selectedStateInfo = StatesByAbbreviation[selectedState]

  // Function to detect user's location and determine their state
  const detectLocation = useCallback(async () => {
    if (!hasGeolocation()) {
      console.log('Geolocation is not supported by this browser')
      return
    }

    // Check cache first
    const now = Date.now()
    if (
      locationCache.detectedState !== null &&
      now - locationCache.timestamp < locationCache.CACHE_DURATION_MS
    ) {
      onStateChange(locationCache.detectedState)
      setHasLocationPermission(true)
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
        const detectedState = stateAbbr as StateAbbreviation
        // Update cache
        locationCache.detectedState = detectedState
        locationCache.timestamp = Date.now()

        onStateChange(detectedState)
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
  }, [onStateChange])

  // Check if geolocation permission has been granted previously
  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.permissions === 'undefined' ||
      typeof navigator.permissions.query === 'undefined'
    ) {
      return
    }
    let cancelled = false
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (!cancelled) {
          setHasLocationPermission(result.state === 'granted')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasLocationPermission(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    // Type guard: only call onStateChange if value is a valid state abbreviation
    if (value in StatesByAbbreviation) {
      onStateChange(value as StateAbbreviation)
    }
  }

  return (
    <YStack gap="$3" className={className}>
      <XStack alignItems="center" justifyContent="space-between">
        <Label tag="label" htmlFor="state-selector">
          Select your state:
        </Label>

        {hasGeolocation() && hasLocationPermission !== false ? (
          <DetectButton
            onPress={detectLocation}
            disabled={isDetectingLocation}
            opacity={isDetectingLocation ? 0.5 : 1}
          >
            {isDetectingLocation ? (
              <>
                <LoadingSpinner width={12} height={12} borderBottomColor="$primary" />
                <DetectButtonText>Detecting...</DetectButtonText>
              </>
            ) : (
              <>
                <MapPin size={12} />
                <DetectButtonText>Auto-detect</DetectButtonText>
              </>
            )}
          </DetectButton>
        ) : null}
      </XStack>

      <YStack position="relative">
        <EditorialSelect id="state-selector" value={selectedState} onChange={handleStateChange}>
          {stateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} {option.isTerritory ? '(Territory)' : ''}
            </option>
          ))}
        </EditorialSelect>
      </YStack>

      {selectedStateInfo !== undefined ? (
        <InfoBox>
          <InfoText>
            <Text fontWeight="500">Selected:</Text> {selectedStateInfo.name}
            {selectedStateInfo.capital !== 'D.C. is not a state and does not have a capital' ? (
              <Text marginLeft="$2">
                <Text fontWeight="500">Capital:</Text> {selectedStateInfo.capital}
              </Text>
            ) : null}
          </InfoText>
        </InfoBox>
      ) : null}

      <HelperText>
        Questions will be customized based on your selected state&apos;s representatives, senators,
        and governor.
      </HelperText>
    </YStack>
  )
}

export default StateSelector
