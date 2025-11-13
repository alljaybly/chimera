import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebPageInput } from './WebPageInput';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: () => ({
    addNode: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('WebPageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit web page URL successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-id',
        type: 'webpage',
        content: 'Page content',
        metadata: { title: 'Test Page', tags: ['web'], source: 'https://example.com' },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<WebPageInput />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByText('Fetch Web Page');

    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/nodes',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('should show error when URL is empty', async () => {
    render(<WebPageInput />);

    const submitButton = screen.getByText('Fetch Web Page');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a URL/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid URL', async () => {
    render(<WebPageInput />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByText('Fetch Web Page');

    fireEvent.change(urlInput, { target: { value: 'not-a-valid-url' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    });
  });
});
