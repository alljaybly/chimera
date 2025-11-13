import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteInput } from './NoteInput';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: () => ({
    addNode: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('NoteInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit note successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-id',
        type: 'note',
        content: 'Test note',
        metadata: { title: 'Test', tags: [] },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<NoteInput />);

    const contentInput = screen.getByPlaceholderText('Enter your note...');
    const submitButton = screen.getByText('Create Note');

    fireEvent.change(contentInput, { target: { value: 'Test note' } });
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

  it('should show error when content is empty', async () => {
    render(<NoteInput />);

    const submitButton = screen.getByText('Create Note');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter some content/i)).toBeInTheDocument();
    });
  });
});
