import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchInterface } from './SearchInterface';

// Mock the store
const mockSetSearchResults = vi.fn();
const mockSetIsSearching = vi.fn();

vi.mock('../store', () => ({
  useAppStore: (selector: any) => {
    const state = {
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      setSearchQuery: vi.fn(),
      setSearchResults: mockSetSearchResults,
      setIsSearching: mockSetIsSearching,
      setSelectedNodeId: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('SearchInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute search when button is clicked', async () => {
    const mockResponse = {
      success: true,
      data: {
        items: [
          {
            node: {
              id: 'test-1',
              type: 'note',
              content: 'Test content',
              metadata: { title: 'Test', tags: [], createdAt: new Date() },
            },
            relevance: 0.9,
            highlights: ['Test content'],
          },
        ],
        total: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SearchInterface />);

    const searchInput = screen.getByPlaceholderText(/Search your knowledge base/i);
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/search?text=test+query')
      );
    });
  });

  it('should display placeholder when no search has been performed', () => {
    render(<SearchInterface />);
    expect(screen.getByText(/Enter a search query and click Search/i)).toBeInTheDocument();
  });

  it('should apply filters to search query', async () => {
    const mockResponse = {
      success: true,
      data: {
        items: [],
        total: 0,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SearchInterface />);

    const searchInput = screen.getByPlaceholderText(/Search your knowledge base/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Apply type filter
    const noteCheckbox = screen.getByLabelText(/Note/i);
    fireEvent.click(noteCheckbox);

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('types=note')
      );
    });
  });

  it('should handle search errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<SearchInterface />);

    const searchInput = screen.getByPlaceholderText(/Search your knowledge base/i);
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockSetIsSearching).toHaveBeenCalledWith(false);
    });
  });
});
