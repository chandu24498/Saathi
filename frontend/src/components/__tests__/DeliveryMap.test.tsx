/**
 * Tests for src/components/DeliveryMap.tsx
 *
 * Since this component relies heavily on Google Maps JS API and browser
 * geolocation, we mock those browser APIs and test the component's
 * rendering, state transitions, and error handling.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Google Maps before importing the component
const mockMap = jest.fn();
const mockMarker = jest.fn();
const mockPolyline = jest.fn();
const mockInfoWindow = jest.fn().mockReturnValue({ open: jest.fn() });
const mockLatLng = jest.fn().mockImplementation((lat: number, lng: number) => ({ lat, lng }));
const mockLatLngBounds = jest.fn().mockReturnValue({
  extend: jest.fn(),
  getCenter: jest.fn().mockReturnValue({ lat: 12.95, lng: 77.6 }),
});

// Set up global google mock
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Mock createElement/appendChild for script loading
  const originalCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'script') {
      const script = originalCreateElement('script');
      // Simulate script loading
      setTimeout(() => {
        if (script.onload) (script.onload as () => void)();
      }, 0);
      return script;
    }
    return originalCreateElement(tagName);
  });

  jest.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => node);

  // Setup google maps mock
  (window as unknown as Record<string, unknown>).google = {
    maps: {
      Map: mockMap.mockReturnValue({ fitBounds: jest.fn(), markers: [] }),
      Marker: mockMarker,
      Polyline: mockPolyline,
      InfoWindow: mockInfoWindow,
      LatLng: mockLatLng,
      LatLngBounds: mockLatLngBounds,
      SymbolPath: { CIRCLE: 0 },
    },
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  delete (window as unknown as Record<string, unknown>).google;
});

// Dynamic import to get fresh module per test
async function getDeliveryMap() {
  const mod = await import('../DeliveryMap');
  return mod.DeliveryMap;
}

describe('DeliveryMap', () => {
  const defaultProps = {
    deliveryLat: 12.9352,
    deliveryLng: 77.6245,
    areaName: 'Koramangala',
  };

  it('renders the legend with You and Delivery labels', async () => {
    // Mock geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) => {
          success({ coords: { latitude: 12.97, longitude: 77.59 } });
        }),
      },
      writable: true,
      configurable: true,
    });

    const DeliveryMap = await getDeliveryMap();
    render(<DeliveryMap {...defaultProps} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
  });

  it('shows location error when geolocation is not supported', async () => {
    // Remove geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const DeliveryMap = await getDeliveryMap();
    render(<DeliveryMap {...defaultProps} />);

    expect(screen.getByText('Geolocation not supported by this browser')).toBeInTheDocument();
  });

  it('shows location error when geolocation permission is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((_success, error) => {
          error(new Error('Permission denied'));
        }),
      },
      writable: true,
      configurable: true,
    });

    const DeliveryMap = await getDeliveryMap();
    render(<DeliveryMap {...defaultProps} />);

    expect(screen.getByText('Location access denied – using Bangalore center')).toBeInTheDocument();
  });

  it('renders the map container div', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) => {
          success({ coords: { latitude: 12.97, longitude: 77.59 } });
        }),
      },
      writable: true,
      configurable: true,
    });

    const DeliveryMap = await getDeliveryMap();
    const { container } = render(<DeliveryMap {...defaultProps} />);

    // Map container should exist with 280px height
    const mapDiv = container.querySelector('div[style*="height: 280px"]') 
      || container.querySelector('div[style*="height:280px"]');
    expect(mapDiv).toBeTruthy();
  });

  it('initializes Google Map when script is loaded and location available', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) => {
          success({ coords: { latitude: 12.97, longitude: 77.59 } });
        }),
      },
      writable: true,
      configurable: true,
    });

    const DeliveryMap = await getDeliveryMap();
    render(<DeliveryMap {...defaultProps} />);

    // Since google is already set, map should be initialized
    // Wait for effects
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // The Map constructor should have been called
    expect(mockMap).toHaveBeenCalled();
  });
});
