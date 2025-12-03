import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'
import { TamaguiProvider } from '@/components/TamaguiProvider'

function renderWithProvider(component) {
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
    dispatchEvent: jest.fn(),
  }))
  
  // Reset document.documentElement.classList
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('should render a button', () => {
    renderWithProvider(<ThemeToggle />)
    
    // Should show a button element
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should initialize with system preference when no saved theme', async () => {
    // Mock system preference for dark mode
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
    
    mockLocalStorage.getItem.mockReturnValue(null)

    renderWithProvider(<ThemeToggle />)
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
    })
    
    // Should set dark class on document
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should initialize with saved theme preference', async () => {
    mockLocalStorage.getItem.mockReturnValue('dark')

    renderWithProvider(<ThemeToggle />)
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
    })
    
    // Should set dark class on document
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme when clicked', async () => {
    mockLocalStorage.getItem.mockReturnValue('light')

    renderWithProvider(<ThemeToggle />)
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    })
    
    // Initially should be light mode
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    
    // Click to toggle to dark mode
    fireEvent.click(screen.getByLabelText('Switch to dark mode'))
    
    // Should update to dark mode
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
  })

  it('should persist theme preference in localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue('light')

    renderWithProvider(<ThemeToggle />)
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    })
    
    // Toggle to dark mode
    fireEvent.click(screen.getByLabelText('Switch to dark mode'))
    
    // Should save to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    
    // Toggle back to light mode
    fireEvent.click(screen.getByLabelText('Switch to light mode'))
    
    // Should save to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw error
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    
    // Mock system preference for light mode
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: light)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    renderWithProvider(<ThemeToggle />)
    
    // Should still work and fall back to system preference
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    })
    
    // Should toggle even with localStorage errors
    fireEvent.click(screen.getByLabelText('Switch to dark mode'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should display correct icons for light and dark modes', async () => {
    mockLocalStorage.getItem.mockReturnValue('light')

    renderWithProvider(<ThemeToggle />)
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    })
    
    // Should show moon icon for light mode (click to switch to dark)
    const lightModeButton = screen.getByLabelText('Switch to dark mode')
    expect(lightModeButton.querySelector('svg')).toBeInTheDocument()
    
    // Click to toggle to dark mode
    fireEvent.click(lightModeButton)
    
    // Should show sun icon for dark mode (click to switch to light)
    const darkModeButton = screen.getByLabelText('Switch to light mode')
    expect(darkModeButton.querySelector('svg')).toBeInTheDocument()
  })

  it('should render with Tamagui styled button', async () => {
    mockLocalStorage.getItem.mockReturnValue('light')

    renderWithProvider(<ThemeToggle />)

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
    })

    const button = screen.getByLabelText('Switch to dark mode')

    // Should render as a button element (Tamagui styled)
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })
})