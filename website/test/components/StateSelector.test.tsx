import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StateSelector from '@/components/StateSelector'

type StateAbbreviation = 'CA' | 'NY' | 'TX' | 'FL' | 'DC' | 'PR'

// Mock the geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

// Mock the permissions API
const mockPermissions = {
  query: jest.fn(),
}

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: mockGeolocation,
    permissions: mockPermissions,
  },
  writable: true,
})

// Mock fetch for reverse geocoding
global.fetch = jest.fn()

describe('StateSelector', () => {
  const mockOnStateChange = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockPermissions.query.mockResolvedValue({ state: 'prompt' })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render state selector with all states', () => {
    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    // Should show the label
    expect(screen.getByText('Select your state:')).toBeInTheDocument()

    // Should have a select element
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('CA')

    // Should have all states as options
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(50) // 50 states + DC + territories
  })

  it('should call onStateChange when state is selected', () => {
    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'NY' } })

    expect(mockOnStateChange).toHaveBeenCalledWith('NY')
  })

  it('should show selected state info', () => {
    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    expect(screen.getByText('Selected:')).toBeInTheDocument()
    expect(screen.getByText('California')).toBeInTheDocument()
    expect(screen.getByText('Capital:')).toBeInTheDocument()
    expect(screen.getByText('Sacramento')).toBeInTheDocument()
  })

  it('should show auto-detect button when geolocation is available', () => {
    mockPermissions.query.mockResolvedValue({ state: 'granted' })
    
    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    expect(screen.getByText('Auto-detect')).toBeInTheDocument()
  })

  it('should handle geolocation detection successfully', async () => {
    mockPermissions.query.mockResolvedValue({ state: 'granted' })
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      })
    })

    // Mock successful reverse geocoding
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        principalSubdivision: 'NY',
      }),
    } as Response)

    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    const autoDetectButton = screen.getByText('Auto-detect')
    fireEvent.click(autoDetectButton)

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith('NY')
    })
  })

  it('should handle geolocation permission denied', async () => {
    mockPermissions.query.mockResolvedValue({ state: 'denied' })
    
    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    // Auto-detect button should not be shown when permission is denied
    expect(screen.queryByText('Auto-detect')).not.toBeInTheDocument()
  })

  it('should handle geolocation error gracefully', async () => {
    mockPermissions.query.mockResolvedValue({ state: 'granted' })
    
    // Mock geolocation error
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'User denied geolocation',
      })
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    const autoDetectButton = screen.getByText('Auto-detect')
    fireEvent.click(autoDetectButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error detecting location:', expect.any(Object))
    })

    consoleSpy.mockRestore()
  })

  it('should handle invalid state from geolocation', async () => {
    mockPermissions.query.mockResolvedValue({ state: 'granted' })
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      })
    })

    // Mock reverse geocoding with invalid state
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        principalSubdivision: 'INVALID',
      }),
    } as Response)

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    const autoDetectButton = screen.getByText('Auto-detect')
    fireEvent.click(autoDetectButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Could not determine state from location')
    })

    // Should not call onStateChange with invalid state
    expect(mockOnStateChange).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should show loading state during geolocation detection', async () => {
    mockPermissions.query.mockResolvedValue({ state: 'granted' })
    
    // Mock geolocation that takes time
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
        })
      }, 100)
    })

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        principalSubdivision: 'NY',
      }),
    } as Response)

    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
      />
    )

    const autoDetectButton = screen.getByText('Auto-detect')
    fireEvent.click(autoDetectButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Detecting...')).toBeInTheDocument()
    })

    // Should go back to normal state after detection
    await waitFor(() => {
      expect(screen.getByText('Auto-detect')).toBeInTheDocument()
    })
  })

  it('should handle DC state display correctly', () => {
    render(
      <StateSelector
        selectedState="DC"
        onStateChange={mockOnStateChange}
      />
    )

    expect(screen.getByText('Selected:')).toBeInTheDocument()
    expect(screen.getByText('District of Columbia')).toBeInTheDocument()
    // Should not show capital for DC
    expect(screen.queryByText('Capital:')).not.toBeInTheDocument()
  })

  it('should mark territories correctly in dropdown', () => {
    render(
      <StateSelector
        selectedState="PR"
        onStateChange={mockOnStateChange}
      />
    )

    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option'))
    
    // Find Puerto Rico option
    const prOption = options.find(option => option.textContent?.includes('Puerto Rico'))
    expect(prOption?.textContent).toContain('(Territory)')
  })

  it('should apply custom className', () => {
    render(
      <StateSelector
        selectedState="CA"
        onStateChange={mockOnStateChange}
        className="custom-class"
      />
    )

    const container = screen.getByText('Select your state:').closest('div')
    expect(container).toHaveClass('custom-class')
  })
})