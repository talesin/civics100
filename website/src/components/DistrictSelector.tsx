import React, { useState, useEffect, useRef, useMemo } from 'react'
import { StateAbbreviation } from 'civics2json'
import {
  getDistrictsForState,
  formatDistrictLabel
} from '@/services/DistrictDataService'
import { XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

// Extended theme colors for district selector specific UI
const districtThemeColors = {
  light: {
    loadingBorder: '#d1d5db',
    loadingBg: '#f9fafb',
    loadingText: '#6b7280',
    errorBg: '#fef2f2',
    errorText: '#dc2626',
    infoBg: '#f9fafb',
    infoText: '#4b5563',
    helperText: '#6b7280',
    selectBg: '#ffffff',
    selectBorder: '#d1d5db',
  },
  dark: {
    loadingBorder: '#4b5563',
    loadingBg: '#374151',
    loadingText: '#9ca3af',
    errorBg: 'rgba(220, 38, 38, 0.1)',
    errorText: '#f87171',
    infoBg: '#374151',
    infoText: '#d1d5db',
    helperText: '#9ca3af',
    selectBg: '#1f2937',
    selectBorder: '#4b5563',
  },
}

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

const DistrictSelector = ({
  selectedState,
  selectedDistrict,
  onDistrictChange,
  className = ''
}: DistrictSelectorProps): React.ReactElement | null => {
  const { theme } = useThemeContext()
  const baseColors = themeColors[theme]
  const districtColors = districtThemeColors[theme]
  const colors = useMemo(() => ({ ...baseColors, ...districtColors }), [baseColors, districtColors])

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

  // Memoized styles
  const loadingBoxStyles: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.loadingBorder,
    borderRadius: 6,
    backgroundColor: colors.loadingBg,
  }), [colors.loadingBorder, colors.loadingBg])

  const errorBoxStyles: React.CSSProperties = useMemo(() => ({
    backgroundColor: colors.errorBg,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 6,
  }), [colors.errorBg])

  const infoBoxStyles: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    backgroundColor: colors.infoBg,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 6,
  }), [colors.infoBg])

  const selectStyles: React.CSSProperties = useMemo(() => ({
    width: '100%',
    padding: '8px 12px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.selectBorder,
    borderRadius: 6,
    backgroundColor: colors.selectBg,
    color: colors.text,
    fontSize: 14,
    outline: 'none',
  }), [colors.selectBorder, colors.selectBg, colors.text])

  // Don't render if no districts loaded yet or error occurred
  if (isLoading) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <div style={loadingBoxStyles}>
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', color: colors.loadingText }}>
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
          <span style={{ fontSize: 14, color: colors.loadingText }}>Loading districts...</span>
        </div>
      </YStack>
    )
  }

  if (error !== null) {
    return (
      <YStack gap="$3" className={className}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>Congressional District:</Label>
        </XStack>
        <div style={errorBoxStyles}>
          <span style={{ fontSize: 14, color: colors.errorText }}>{error}</span>
        </div>
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
        <div style={infoBoxStyles}>
          <span style={{ fontSize: 12, color: colors.infoText }}>
            <span style={{ fontWeight: 500 }}>District:</span> {formatDistrictLabel(districts[0])}
          </span>
        </div>
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
          style={selectStyles}
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
        <div style={infoBoxStyles}>
          <span style={{ fontSize: 12, color: colors.infoText }}>
            <span style={{ fontWeight: 500 }}>Selected:</span> {formatDistrictLabel(selectedDistrict)}
          </span>
        </div>
      ) : null}

      <span style={{ fontSize: 12, color: colors.helperText }}>
        Selecting your district will show only your specific representative in relevant questions.
      </span>
    </YStack>
  )
}

export default DistrictSelector
