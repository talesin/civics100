import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'
import { TamaguiProvider } from '@/components/TamaguiProvider'

function renderWithProvider(component: React.ReactElement) {
  return render(
    <TamaguiProvider>{component}</TamaguiProvider>
  )
}

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Mock window.matchMedia
const mockMatchMedia = jest.fn()

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks()

  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  })

  // Setup matchMedia mock
  Object.defineProperty(window, 'matchMedia', {
    value: mockMatchMedia,
    writable: true
  })

  // Default matchMedia implementation
  mockMatchMedia.mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
})

describe('ThemeToggle', () => {
  it('should render a button', () => {
    renderWithProvider(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should have an accessibility label', () => {
    renderWithProvider(<ThemeToggle />)

    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
  })

  it('should render both sun and moon SVG icons', () => {
    renderWithProvider(<ThemeToggle />)

    const button = screen.getByRole('button')
    const svgs = button.querySelectorAll('svg')
    expect(svgs).toHaveLength(2)

    // Sun icon has theme-icon-sun class
    expect(button.querySelector('.theme-icon-sun')).toBeInTheDocument()
    // Moon icon has theme-icon-moon class
    expect(button.querySelector('.theme-icon-moon')).toBeInTheDocument()
  })

  it('should be clickable without errors', () => {
    renderWithProvider(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(() => fireEvent.click(button)).not.toThrow()
  })

  it('should render as a button element (Tamagui styled)', () => {
    renderWithProvider(<ThemeToggle />)

    const button = screen.getByLabelText('Toggle theme')
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })
})
