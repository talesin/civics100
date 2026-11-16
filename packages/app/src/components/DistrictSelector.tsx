import React, { useMemo, useEffect, useEffectEvent } from 'react'
import { StateAbbreviation } from 'civics2json'
import { getDistrictsForState, formatDistrictLabel } from '../services'
import { XStack, YStack, Text, EditorialSelect } from './tamagui'
import { styled } from 'tamagui'

type NonEmptyArray<T> = [T, ...T[]]

function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0
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
  color: '$color'
})

const ErrorBox = styled(YStack, {
  backgroundColor: '$themeErrorBg',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6
})

const InfoBox = styled(XStack, {
  backgroundColor: '$backgroundHover',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6
})

const DistrictSelector = ({
  selectedState,
  selectedDistrict,
  onDistrictChange,
  className = ''
}: DistrictSelectorProps): React.ReactElement | null => {
  // District lookup is synchronous, so the list is derived state, not
  // effect-loaded state (set-state-in-effect).
  const { districts, error } = useMemo(() => {
    try {
      return { districts: getDistrictsForState(selectedState), error: null }
    } catch (err) {
      console.error('Failed to load districts:', err)
      return { districts: [] as string[], error: 'Failed to load district information' }
    }
  }, [selectedState])

  // Effect event: reconciling may auto-select/clear without re-running the
  // effect when the parent passes a new callback identity.
  const changeDistrict = useEffectEvent((district: string | undefined) => {
    onDistrictChange(district)
  })

  // Reconcile the parent's selection with the derived list
  useEffect(() => {
    if (error !== null) {
      return
    }
    // Auto-select if only one district
    if (districts.length === 1 && selectedDistrict !== districts[0]) {
      changeDistrict(districts[0])
    }
    // Clear selection if current district is not valid for new state
    else if (
      selectedDistrict !== null &&
      selectedDistrict !== undefined &&
      !districts.includes(selectedDistrict)
    ) {
      changeDistrict(undefined)
    }
  }, [districts, error, selectedDistrict])

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    onDistrictChange(value === '' ? undefined : value)
  }

  if (error !== null) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <ErrorBox>
          <Text fontSize={16} color="$themeError">
            {error}
          </Text>
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
