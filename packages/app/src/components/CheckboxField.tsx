import { useTheme } from 'tamagui'
import type { CheckboxFieldProps } from './CheckboxField.shared'

// Raw DOM on purpose (web half): the accent-coloured UA checkbox and the
// clickable <label htmlFor> are what the settings page always rendered.
export default function CheckboxField({ id, checked, onCheckedChange, label }: CheckboxFieldProps) {
  const theme = useTheme()
  const accent = theme.editorialAccent?.get() as string
  const muted = theme.editorialMuted?.get() as string

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        style={{ width: 16, height: 16, accentColor: accent, cursor: 'pointer' }}
      />
      <label
        htmlFor={id}
        style={{ fontSize: 14, fontWeight: 500, color: muted, cursor: 'pointer' }}
      >
        {label}
      </label>
    </div>
  )
}
