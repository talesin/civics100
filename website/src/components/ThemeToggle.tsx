import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeContext } from '@/components/TamaguiProvider'

const buttonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 4,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--editorial-muted)',
}

export default function ThemeToggle() {
  const { toggleTheme } = useThemeContext()

  // Both icons are always in the DOM. CSS classes (.theme-icon-sun / .theme-icon-moon)
  // control visibility based on the html.t_dark class set before hydration.
  return (
    <button onClick={toggleTheme} aria-label="Toggle theme" style={buttonStyles}>
      <span className="theme-icon-sun" style={{ color: 'var(--editorial-muted)' }}>
        <Sun size={18} strokeWidth={1.5} />
      </span>
      <span className="theme-icon-moon" style={{ color: 'var(--editorial-muted)' }}>
        <Moon size={18} strokeWidth={1.5} />
      </span>
    </button>
  )
}
