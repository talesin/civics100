import React from 'react'
import { StateAbbreviation } from 'civics2json'
import {
  getSenatorForState,
  getGovernorForState,
  getRepresentativeForDistrict
} from '@/services/DistrictDataService'
import { YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface PoliticianVerificationBoxProps {
  readonly selectedState: StateAbbreviation
  readonly selectedDistrict?: string | undefined
}

const VerificationBox = styled(YStack, {
  backgroundColor: '$backgroundHover',
  paddingHorizontal: '$3',
  paddingVertical: '$3',
  borderRadius: '$2',
  gap: '$2',
})

const Title = styled(Text, {
  fontSize: '$3',
  fontWeight: '600',
  color: '$color',
})

const PoliticianRow = styled(YStack, {
  gap: '$1',
})

const PoliticianLabel = styled(Text, {
  fontSize: '$2',
  fontWeight: '500',
  color: '$placeholderColor',
})

const PoliticianName = styled(Text, {
  fontSize: '$3',
  color: '$color',
})

const NoPoliticianText = styled(Text, {
  fontSize: '$3',
  color: '$placeholderColor',
  fontStyle: 'italic',
})

const PoliticianVerificationBox = ({
  selectedState,
  selectedDistrict
}: PoliticianVerificationBoxProps): React.ReactElement => {
  const senators = getSenatorForState(selectedState)
  const governor = getGovernorForState(selectedState)
  const representative =
    selectedDistrict != null
      ? getRepresentativeForDistrict(selectedState, selectedDistrict)
      : null

  return (
    <VerificationBox>
      <Title>Your Elected Officials</Title>

      <PoliticianRow>
        <PoliticianLabel>Senators:</PoliticianLabel>
        {senators.length > 0 ? (
          senators.map((senator, index) => (
            <PoliticianName key={index}>{senator}</PoliticianName>
          ))
        ) : (
          <NoPoliticianText>None (territories do not have senators)</NoPoliticianText>
        )}
      </PoliticianRow>

      <PoliticianRow>
        <PoliticianLabel>Governor:</PoliticianLabel>
        {governor != null ? (
          <PoliticianName>{governor}</PoliticianName>
        ) : (
          <NoPoliticianText>None available</NoPoliticianText>
        )}
      </PoliticianRow>

      <PoliticianRow>
        <PoliticianLabel>U.S. Representative:</PoliticianLabel>
        {representative != null ? (
          <PoliticianName>{representative}</PoliticianName>
        ) : selectedDistrict == null ? (
          <NoPoliticianText>Select a district to see your representative</NoPoliticianText>
        ) : (
          <NoPoliticianText>None available</NoPoliticianText>
        )}
      </PoliticianRow>
    </VerificationBox>
  )
}

export default PoliticianVerificationBox
