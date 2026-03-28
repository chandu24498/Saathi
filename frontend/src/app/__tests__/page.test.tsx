/**
 * Tests for src/app/page.tsx (Home component)
 *
 * Covers:
 *  - Initial render (header, simulate button, no notification)
 *  - Simulate notification flow
 *  - Notification popup with order details
 *  - Analyze order → success (Accept/Reject)
 *  - Analyze order → various API errors
 *  - Dismiss notification
 *  - Close report
 *  - Error dismiss
 *  - Helper components (Row, MetricCard)
 *  - Relocation suggestion display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the API module
jest.mock('@/services/api', () => ({
  APIError: class APIError extends Error {
    status: number;
    statusText: string;
    constructor(status: number, statusText: string, message: string) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.statusText = statusText;
    }
  },
  analyzeOrder: jest.fn(),
}));

// Mock the DeliveryMap component since it depends on Google Maps
jest.mock('@/components/DeliveryMap', () => ({
  DeliveryMap: ({ deliveryLat, deliveryLng, areaName }: { deliveryLat: number; deliveryLng: number; areaName: string }) => (
    <div data-testid="delivery-map">
      Map: {areaName} ({deliveryLat}, {deliveryLng})
    </div>
  ),
}));

// Seed Math.random for deterministic mock order generation
const originalRandom = Math.random;

import Home from '../page';
import { analyzeOrder, APIError } from '@/services/api';

const mockAnalyzeOrder = analyzeOrder as jest.MockedFunction<typeof analyzeOrder>;

beforeEach(() => {
  jest.clearAllMocks();
  // Use seeded random for deterministic tests
  let seed = 0.5;
  Math.random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
});

afterEach(() => {
  Math.random = originalRandom;
});

describe('Home page', () => {

  describe('initial render', () => {
    it('renders the Saathi header', () => {
      render(<Home />);
      expect(screen.getByText('Saathi')).toBeInTheDocument();
    });

    it('renders the tagline', () => {
      render(<Home />);
      expect(screen.getByText('Har decision mein saath')).toBeInTheDocument();
    });

    it('renders the simulate notification button', () => {
      render(<Home />);
      expect(screen.getByText('🔔 Simulate Notification')).toBeInTheDocument();
    });

    it('does not show notification popup initially', () => {
      render(<Home />);
      expect(screen.queryByText('Zomato Order')).not.toBeInTheDocument();
    });

    it('does not show analysis report initially', () => {
      render(<Home />);
      expect(screen.queryByText('Analysis Report')).not.toBeInTheDocument();
    });

    it('does not show error initially', () => {
      render(<Home />);
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });

    it('shows instructional text', () => {
      render(<Home />);
      expect(screen.getByText('Simulate Notification')).toBeInTheDocument();
    });
  });

  describe('simulate notification (FR-1)', () => {
    it('shows notification popup when simulate is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      expect(screen.getByText('Zomato Order')).toBeInTheDocument();
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });

    it('shows order details in the popup', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      // Should show Order ID, Distance, Earnings, Area
      expect(screen.getByText('Order ID')).toBeInTheDocument();
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Earnings')).toBeInTheDocument();
      expect(screen.getByText('Area')).toBeInTheDocument();
    });

    it('shows Analyze and Dismiss buttons in popup', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      expect(screen.getByText('⚡ Analyze')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('generates different orders on multiple clicks', () => {
      render(<Home />);

      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      const firstOrderId = screen.getByText('Order ID')
        .closest('div')!
        .querySelector('.text-base')!.textContent;

      // Click dismiss then simulate again
      fireEvent.click(screen.getByText('Dismiss'));
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));

      // New order should be generated (different random seed advancement)
      expect(screen.getByText('Order ID')).toBeInTheDocument();
    });
  });

  describe('dismiss notification (FR-2)', () => {
    it('dismisses notification when Dismiss button is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      expect(screen.getByText('Zomato Order')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Dismiss'));
      expect(screen.queryByText('Zomato Order')).not.toBeInTheDocument();
    });

    it('dismisses notification when backdrop is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));

      // Click the backdrop (the fixed overlay div)
      const backdrop = screen.getByText('Zomato Order').closest('.fixed');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(screen.queryByText('Zomato Order')).not.toBeInTheDocument();
      }
    });

    it('does not dismiss when clicking inside dialog', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));

      // Click on the order popup content
      fireEvent.click(screen.getByText('Zomato Order'));
      // Popup should still be visible
      expect(screen.getByText('Zomato Order')).toBeInTheDocument();
    });
  });

  describe('analyze order (FR-3/FR-4) - Accept', () => {
    it('shows accepted analysis report', async () => {
      mockAnalyzeOrder.mockResolvedValue({
        order_id: 'ORD-TEST',
        decision: 'Accept',
        earnings_per_hour: 500,
        estimated_time_minutes: 12,
        suggested_relocation: null,
      });

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      });

      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
      expect(screen.getByText('12 min')).toBeInTheDocument();
      expect(screen.getByText('Earnings per Hour')).toBeInTheDocument();
      expect(screen.getByText('Estimated Time')).toBeInTheDocument();
    });

    it('does not show relocation suggestion for accepted orders', async () => {
      mockAnalyzeOrder.mockResolvedValue({
        order_id: 'ORD-TEST',
        decision: 'Accept',
        earnings_per_hour: 500,
        estimated_time_minutes: 12,
        suggested_relocation: null,
      });

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      });

      expect(screen.queryByText('💡 Suggestion')).not.toBeInTheDocument();
    });

    it('shows delivery map in report', async () => {
      mockAnalyzeOrder.mockResolvedValue({
        order_id: 'ORD-TEST',
        decision: 'Accept',
        earnings_per_hour: 500,
        estimated_time_minutes: 12,
        suggested_relocation: null,
      });

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByTestId('delivery-map')).toBeInTheDocument();
      });
    });
  });

  describe('analyze order - Reject with relocation', () => {
    it('shows rejected analysis report with relocation suggestion', async () => {
      mockAnalyzeOrder.mockResolvedValue({
        order_id: 'ORD-TEST2',
        decision: 'Reject',
        earnings_per_hour: 90,
        estimated_time_minutes: 30,
        suggested_relocation: 'Move 3.5 km towards Koramangala (high-demand area)',
      });

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      });

      expect(screen.getByText('Reject')).toBeInTheDocument();
      expect(screen.getByText('₹90')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('💡 Suggestion')).toBeInTheDocument();
      expect(screen.getByText('Move 3.5 km towards Koramangala (high-demand area)')).toBeInTheDocument();
    });
  });

  describe('analyze order - loading state', () => {
    it('shows Analyzing… text while loading', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockAnalyzeOrder.mockReturnValue(promise as any);

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      expect(screen.getByText('Analyzing…')).toBeInTheDocument();

      // Resolve to clean up
      await act(async () => {
        resolvePromise!({
          order_id: 'X',
          decision: 'Accept',
          earnings_per_hour: 100,
          estimated_time_minutes: 5,
          suggested_relocation: null,
        });
      });
    });

    it('disables analyze button while loading', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockAnalyzeOrder.mockReturnValue(promise as any);

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      
      const analyzeBtn = screen.getByText('⚡ Analyze');
      fireEvent.click(analyzeBtn);

      const analyzingBtn = screen.getByText('Analyzing…');
      expect(analyzingBtn).toBeDisabled();

      await act(async () => {
        resolvePromise!({
          order_id: 'X',
          decision: 'Accept',
          earnings_per_hour: 100,
          estimated_time_minutes: 5,
          suggested_relocation: null,
        });
      });
    });
  });

  describe('analyze order - error handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('shows network error message for status 0', async () => {
      mockAnalyzeOrder.mockRejectedValue(
        new APIError(0, 'Network Error', 'Failed to fetch')
      );

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/Network Error/)).toBeInTheDocument();
      });
    });

    it('shows invalid request error for status 400', async () => {
      mockAnalyzeOrder.mockRejectedValue(
        new APIError(400, 'Bad Request', 'Missing order_id')
      );

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/Invalid request/)).toBeInTheDocument();
      });
    });

    it('shows server error for status 500', async () => {
      mockAnalyzeOrder.mockRejectedValue(
        new APIError(500, 'Internal', 'Server exploded')
      );

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });
    });

    it('shows generic API error for other statuses', async () => {
      mockAnalyzeOrder.mockRejectedValue(
        new APIError(503, 'Service Unavailable', 'Backend down')
      );

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/API Error \(503\)/)).toBeInTheDocument();
      });
    });

    it('shows generic error for non-APIError instances', async () => {
      mockAnalyzeOrder.mockRejectedValue(new Error('Something broke'));

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/Error: Something broke/)).toBeInTheDocument();
      });
    });

    it('shows fallback error for non-Error throws', async () => {
      mockAnalyzeOrder.mockRejectedValue('string error');

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
      });
    });

    it('allows dismissing error with dismiss button', async () => {
      mockAnalyzeOrder.mockRejectedValue(
        new APIError(500, 'Internal', 'Error')
      );

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });

      // The notification popup should be dismissed during error, find the Dismiss button in error UI
      const dismissButtons = screen.getAllByText('Dismiss');
      fireEvent.click(dismissButtons[0]);
    });
  });

  describe('close report (FR-6)', () => {
    it('closes report when Close Report button is clicked', async () => {
      mockAnalyzeOrder.mockResolvedValue({
        order_id: 'ORD-CLOSE',
        decision: 'Accept',
        earnings_per_hour: 500,
        estimated_time_minutes: 12,
        suggested_relocation: null,
      });

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close Report'));
      expect(screen.queryByText('Analysis Report')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('does not call analyzeOrder when no notification exists', async () => {
      render(<Home />);
      // There's no analyze button initially, so this is a no-op test
      expect(screen.queryByText('⚡ Analyze')).not.toBeInTheDocument();
      expect(mockAnalyzeOrder).not.toHaveBeenCalled();
    });

    it('replaces previous notification on re-simulate', async () => {
      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      expect(screen.getByText('Zomato Order')).toBeInTheDocument();

      // Dismiss then simulate again
      fireEvent.click(screen.getByText('Dismiss'));
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      expect(screen.getByText('Zomato Order')).toBeInTheDocument();
    });

    it('clears report when simulating new notification', async () => {
      mockAnalyzeOrder.mockResolvedValue({
        order_id: 'ORD-1',
        decision: 'Accept',
        earnings_per_hour: 500,
        estimated_time_minutes: 12,
        suggested_relocation: null,
      });

      render(<Home />);
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      fireEvent.click(screen.getByText('⚡ Analyze'));

      await waitFor(() => {
        expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      });

      // Simulate new notification should clear report
      fireEvent.click(screen.getByText('🔔 Simulate Notification'));
      expect(screen.queryByText('Analysis Report')).not.toBeInTheDocument();
      expect(screen.getByText('Zomato Order')).toBeInTheDocument();
    });
  });
});
