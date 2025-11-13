import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters } from './SearchFilters';

describe('SearchFilters', () => {
  let mockOnFilterChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnFilterChange = vi.fn();
  });

  it('should call onFilterChange when content type is selected', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    const noteCheckbox = screen.getByLabelText(/Note/i);
    fireEvent.click(noteCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      types: ['note'],
      dateRange: { start: null, end: null },
      tags: []
    });
  });

  it('should call onFilterChange when date range is set', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    const startDateInput = screen.getByLabelText(/From/i);
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      types: [],
      dateRange: { start: new Date('2024-01-01'), end: null },
      tags: []
    });
  });

  it('should add and remove tags', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    const tagInput = screen.getByPlaceholderText(/Add tag.../i);
    const addButton = screen.getByText('Add');

    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      types: [],
      dateRange: { start: null, end: null },
      tags: ['test-tag']
    });

    const removeButton = screen.getByLabelText(/Remove test-tag/i);
    fireEvent.click(removeButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      types: [],
      dateRange: { start: null, end: null },
      tags: []
    });
  });

  it('should clear all filters', () => {
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);

    // Set some filters
    const noteCheckbox = screen.getByLabelText(/Note/i);
    fireEvent.click(noteCheckbox);

    const tagInput = screen.getByPlaceholderText(/Add tag.../i);
    fireEvent.change(tagInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add'));

    // Clear all
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      types: [],
      dateRange: { start: null, end: null },
      tags: []
    });
  });
});
