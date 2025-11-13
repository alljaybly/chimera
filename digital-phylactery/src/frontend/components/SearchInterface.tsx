import React, { useState, useCallback } from 'react';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { SearchResult } from '@shared/types';
import { useAppStore } from '../store';

export const SearchInterface: React.FC = () => {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const searchResults = useAppStore((state) => state.searchResults);
  const setSearchResults = useAppStore((state) => state.setSearchResults);
  const isSearching = useAppStore((state) => state.isSearching);
  const setIsSearching = useAppStore((state) => state.setIsSearching);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  
  const [searchText, setSearchText] = useState(searchQuery);
  const [filters, setFilters] = useState<{
    types: Array<'note' | 'image' | 'webpage'>;
    dateRange: { start: Date | null; end: Date | null };
    tags: string[];
  }>({
    types: [],
    dateRange: { start: null, end: null },
    tags: []
  });
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = useCallback(async (
    text: string,
    currentFilters: typeof filters,
    currentOffset: number
  ) => {
    setIsSearching(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (text.trim()) {
        params.append('text', text.trim());
      }
      
      if (currentFilters.types.length > 0) {
        params.append('types', currentFilters.types.join(','));
      }
      
      if (currentFilters.dateRange.start) {
        params.append('dateStart', currentFilters.dateRange.start.toISOString());
      }
      
      if (currentFilters.dateRange.end) {
        params.append('dateEnd', currentFilters.dateRange.end.toISOString());
      }
      
      if (currentFilters.tags.length > 0) {
        params.append('tags', currentFilters.tags.join(','));
      }
      
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.items);
        setTotal(data.data.total);
        setHasSearched(true);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setSearchResults([]);
      setTotal(0);
    } finally {
      setIsSearching(false);
    }
  }, [limit, setIsSearching, setSearchResults]);

  const handleSearch = () => {
    setOffset(0);
    setSearchQuery(searchText);
    executeSearch(searchText, filters, 0);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    if (hasSearched) {
      setOffset(0);
      executeSearch(searchText, newFilters, 0);
    }
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    executeSearch(searchText, filters, newOffset);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchBar}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search your knowledge base..."
          data-search-input
          style={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          data-search-button
          style={{
            ...styles.searchButton,
            ...(isSearching ? styles.searchButtonDisabled : {})
          }}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <SearchFilters onFilterChange={handleFilterChange} />

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {hasSearched && !isSearching && (
        <SearchResults
          results={searchResults}
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={handlePageChange}
          onNodeClick={handleNodeClick}
        />
      )}

      {!hasSearched && !isSearching && (
        <div style={styles.placeholder}>
          <p style={styles.placeholderText}>
            Enter a search query and click Search to find knowledge nodes
          </p>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  searchButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c00',
    marginBottom: '20px'
  },
  placeholder: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  placeholderText: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  }
};
