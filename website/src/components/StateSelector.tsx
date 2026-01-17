import React, { useState, useEffect } from 'react'
import { StateAbbreviation } from 'civics2json'
import { StatesByAbbreviation } from 'civics2json'
import { XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

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
    backgroundColor: '$blue2',
  },

  pressStyle: {
    opacity: 0.9,
  },
})

const DetectButtonText = styled(Text, {
  fontSize: '$2',
  color: '$primary',
})

const InfoBox = styled(XStack, {
  backgroundColor: '$backgroundHover',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$2',
  flexWrap: 'wrap',
})

const InfoText = styled(Text, {
  fontSize: '$2',
  color: '$placeholderColor',
})

const HelperText = styled(Text, {
  fontSize: '$2',
  color: '$placeholderColor',
})

const Label = styled(Text, {
  fontSize: '$3',
  fontWeight: '500',
  color: '$color',
})

export default function StateSelector({
  selectedState,
  onStateChange,
  className = ''
}: StateSelectorProps) {
  const { theme } = useThemeContext()
  const colors = themeColors[theme]
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
    <YStack gap="$3" className={className}>
      <XStack alignItems="center" justifyContent="space-between">
        <Label tag="label" htmlFor="state-selector">
          Select your state:
        </Label>

        {typeof navigator !== 'undefined' &&
          typeof navigator.geolocation !== 'undefined' &&
          hasLocationPermission !== false ? (
            <DetectButton
              onPress={detectLocation}
              disabled={isDetectingLocation}
              opacity={isDetectingLocation ? 0.5 : 1}
            >
              {isDetectingLocation ? (
                <>
                  <svg width={12} height={12} fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle
                      opacity={0.25}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      opacity={0.75}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <DetectButtonText>Detecting...</DetectButtonText>
                </>
              ) : (
                <>
                  <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <DetectButtonText>Auto-detect</DetectButtonText>
                </>
              )}
            </DetectButton>
          ) : null}
      </XStack>

      <YStack position="relative">
        <select
          id="state-selector"
          value={selectedState}
          onChange={handleStateChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: colors.border,
            borderRadius: 6,
            backgroundColor: colors.cardBg,
            fontSize: 14,
            color: colors.text,
          }}
        >
          {stateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} {option.isTerritory ? '(Territory)' : ''}
            </option>
          ))}
        </select>
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
