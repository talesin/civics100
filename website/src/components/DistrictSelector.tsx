import React, { useState, useEffect, useRef } from 'react'
import { StateAbbreviation } from 'civics2json'
import {
  getDistrictsForState,
  formatDistrictLabel
} from '@/services/DistrictDataService'
import { XStack, YStack, Text, EditorialSelect } from '@/components/tamagui'
import { styled, useTheme } from 'tamagui'

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
  fontSize: '$5',
  fontWeight: '500',
  color: '$color',
})

const LoadingBox = styled(XStack, {
  alignItems: 'center',
  gap: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialRule',
  borderRadius: 6,
  backgroundColor: '$backgroundHover',
})

const ErrorBox = styled(YStack, {
  backgroundColor: '$themeErrorBg',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
})

const InfoBox = styled(XStack, {
  backgroundColor: '$backgroundHover',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
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
  useEffect(() => {
    onDistrictChangeRef.current = onDistrictChange
  }, [onDistrictChange])

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

  const theme = useTheme()

  // Don't render if no districts loaded yet or error occurred
  if (isLoading) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <LoadingBox>
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', color: theme.editorialMuted?.get() as string }}>
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
          <Text fontSize={16} color="$editorialMuted">Loading districts...</Text>
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
          <Text fontSize={16} color="$themeError">{error}</Text>
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
          <Text fontSize={16} color="$editorialInk">
            <Text fontWeight="500">District:</Text> {formatDistrictLabel(districts[0])}
          </Text>
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
        <EditorialSelect
          id="district-selector"
          value={selectedDistrict ?? ''}
          onChange={handleDistrictChange}
        >
          <option value="">Select a district...</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {formatDistrictLabel(district)}
            </option>
          ))}
        </EditorialSelect>
      </YStack>

      {selectedDistrict !== null && selectedDistrict !== undefined ? (
        <InfoBox>
          <Text fontSize={16} color="$editorialInk">
            <Text fontWeight="500">Selected:</Text> {formatDistrictLabel(selectedDistrict)}
          </Text>
        </InfoBox>
      ) : null}

      <Text fontSize={16} color="$editorialMuted">
        Selecting your district will show only your specific representative in relevant questions.
      </Text>
    </YStack>
  )
}

export default DistrictSelector
