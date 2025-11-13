import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from './ImageUpload';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: () => ({
    addNode: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit image successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-id',
        type: 'image',
        content: 'image-path.jpg',
        metadata: { title: 'Test Image', tags: ['test'] },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ImageUpload />);

    const fileInput = screen.getByLabelText(/Image File/i) as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const submitButton = screen.getByText('Upload Image');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/nodes',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should show error when no file is selected', async () => {
    render(<ImageUpload />);

    const submitButton = screen.getByText('Upload Image');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please select an image file/i)).toBeInTheDocument();
    });
  });

  it('should reject files larger than 10MB', async () => {
    render(<ImageUpload />);

    const fileInput = screen.getByLabelText(/Image File/i) as HTMLInputElement;
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/File size must be less than 10MB/i)).toBeInTheDocument();
    });
  });
});
