import React, { useState, useEffect, useRef } from 'react'
import { StateAbbreviation } from 'civics2json'
import {
  getDistrictsForState,
  formatDistrictLabel
} from '@/services/DistrictDataService'
import { XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

type NonEmptyArray<T> = [T, ...T[]];

function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

interface DistrictSelectorProps {
  readonly selectedState: StateAbbreviation
  readonly selectedDistrict?: string | undefined
  readonly onDistrictChange: (district: string | undefined) => void
  readonly className?: string
}

const Label = styled(Text, {
  fontSize: '$3',
  fontWeight: '500',
  color: '$color',
})

const LoadingBox = styled(XStack, {
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderWidth: 1,
  borderColor: '#d1d5db', // gray-300
  borderRadius: '$2',
  backgroundColor: '#f9fafb', // gray-50
  alignItems: 'center',
  gap: '$2',
})

const LoadingText = styled(Text, {
  fontSize: '$3',
  color: '#6b7280', // gray-500
})

const ErrorBox = styled(YStack, {
  backgroundColor: '#fef2f2', // red-50
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$2',
})

const ErrorText = styled(Text, {
  fontSize: '$3',
  color: '#dc2626', // red-600
})

const InfoBox = styled(XStack, {
  backgroundColor: '#f9fafb', // gray-50
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$2',
})

const InfoText = styled(Text, {
  fontSize: '$2',
  color: '#4b5563', // gray-600
})

const HelperText = styled(Text, {
  fontSize: '$2',
  color: '#6b7280', // gray-500
})

const DistrictSelector = ({
  selectedState,
  selectedDistrict,
  onDistrictChange,
  className = ''
}: DistrictSelectorProps): React.ReactElement | null => {
  const [districts, setDistricts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use ref to avoid infinite loop - callback changes should not trigger effect
  const onDistrictChangeRef = useRef(onDistrictChange)
  onDistrictChangeRef.current = onDistrictChange

  // Load districts when state changes
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    try {
      const stateDistricts = getDistrictsForState(selectedState)
      setDistricts(stateDistricts)

      // Auto-select if only one district
      if (stateDistricts.length === 1 && selectedDistrict !== stateDistricts[0]) {
        onDistrictChangeRef.current(stateDistricts[0])
      }
      // Clear selection if current district is not valid for new state
      else if (selectedDistrict !== null && selectedDistrict !== undefined && !stateDistricts.includes(selectedDistrict)) {
        onDistrictChangeRef.current(undefined)
      }
    } catch (err) {
      console.error('Failed to load districts:', err)
      setError('Failed to load district information')
      setDistricts([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedState, selectedDistrict])

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    onDistrictChange(value === '' ? undefined : value)
  }

  // Don't render if no districts loaded yet or error occurred
  if (isLoading) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <LoadingBox>
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
            <circle
              opacity={0.25}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              opacity={0.75}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <LoadingText>Loading districts...</LoadingText>
        </LoadingBox>
      </YStack>
    )
  }

  if (error !== null) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <ErrorBox>
          <ErrorText>{error}</ErrorText>
        </ErrorBox>
      </YStack>
    )
  }

  // Don't render if no districts available
  if (!isNonEmptyArray(districts)) {
    return null
  }

  // If only one district, show it as read-only info
  if (districts.length === 1) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <InfoBox>
          <InfoText>
            <Text fontWeight="500">District:</Text> {formatDistrictLabel(districts[0])}
          </InfoText>
        </InfoBox>
      </YStack>
    )
  }

  return (
    <YStack gap="$3" className={className}>
      <XStack alignItems="center" justifyContent="space-between">
        <Label tag="label" htmlFor="district-selector">
          Select your congressional district:
        </Label>
      </XStack>

      <YStack position="relative">
        <select
          id="district-selector"
          value={selectedDistrict ?? ''}
          onChange={handleDistrictChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: '#d1d5db',
            borderRadius: 6,
            backgroundColor: 'white',
            fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="">Select a district...</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {formatDistrictLabel(district)}
            </option>
          ))}
        </select>
      </YStack>

      {selectedDistrict !== null && selectedDistrict !== undefined ? (
        <InfoBox>
          <InfoText>
            <Text fontWeight="500">Selected:</Text> {formatDistrictLabel(selectedDistrict)}
          </InfoText>
        </InfoBox>
      ) : null}

      <HelperText>
        Selecting your district will show only your specific representative in relevant questions.
      </HelperText>
    </YStack>
  )
}

export default DistrictSelector
