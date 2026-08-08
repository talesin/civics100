import React from 'react'

interface SpeakerButtonProps {
  readonly onPress: () => void
  readonly isSpeaking: boolean
}

// Speaker icon (idle) - simple speaker shape
const SpeakerIcon: React.FC = () => (
  <svg width={22} height={22} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494a1 1 0 01-1.632.772L6.1 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.1l4.268-3.52A1 1 0 0112 6.254z"
    />
  </svg>
)

// Speaker icon with sound waves (speaking)
const SpeakerWavesIcon: React.FC = () => (
  <svg width={22} height={22} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 6.253v11.494a1 1 0 01-1.632.772L6.1 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.1l4.268-3.52A1 1 0 0112 6.254z"
    />
  </svg>
)

const buttonBaseStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'inherit',
}

// PHASE5: the .speaker-pulse keyframes (globals.css) become a moti/reanimated
// opacity loop on native.
const SpeakerButton: React.FC<SpeakerButtonProps> = ({ onPress, isSpeaking }) => {
  return (
    <button
      onClick={onPress}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={isSpeaking ? 'Stop reading' : 'Read question aloud'}
      style={buttonBaseStyle}
      type="button"
    >
      <div className={isSpeaking ? 'speaker-pulse' : undefined}>
        {isSpeaking ? <SpeakerWavesIcon /> : <SpeakerIcon />}
      </div>
    </button>
  )
}

export default SpeakerButton
