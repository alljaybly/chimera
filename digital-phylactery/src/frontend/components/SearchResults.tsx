import React from 'react';
import { SearchResult } from '@shared/types';

export interface SearchResultsProps {
  results: SearchResult[];
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  onNodeClick?: (nodeId: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  total,
  limit,
  offset,
  onPageChange,
  onNodeClick
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handlePrevPage = () => {
    if (offset > 0) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      onPageChange(offset + limit);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return '📝';
      case 'image': return '🖼️';
      case 'webpage': return '🌐';
      default: return '📄';
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return '#22c55e';
    if (relevance >= 0.6) return '#eab308';
    if (relevance >= 0.4) return '#f97316';
    return '#94a3b8';
  };

  if (results.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No results found</p>
        <p style={styles.emptySubtext}>Try adjusting your search query or filters</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          Search Results ({total} {total === 1 ? 'result' : 'results'})
        </h3>
        {totalPages > 1 && (
          <div style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      <div style={styles.resultsList}>
        {results.map((result) => (
          <div
            key={result.node.id}
            style={styles.resultItem}
            onClick={() => onNodeClick?.(result.node.id)}
          >
            <div style={styles.resultHeader}>
              <div style={styles.typeIcon}>{getTypeIcon(result.node.type)}</div>
              <div style={styles.resultMeta}>
                <h4 style={styles.resultTitle}>
                  {result.node.metadata.title || `Untitled ${result.node.type}`}
                </h4>
                <div style={styles.metaInfo}>
                  <span style={styles.metaItem}>
                    {result.node.type.charAt(0).toUpperCase() + result.node.type.slice(1)}
                  </span>
                  <span style={styles.metaDivider}>•</span>
                  <span style={styles.metaItem}>
                    {formatDate(result.node.metadata.createdAt)}
                  </span>
                  {result.node.metadata.tags.length > 0 && (
                    <>
                      <span style={styles.metaDivider}>•</span>
                      <span style={styles.metaItem}>
                        {result.node.metadata.tags.slice(0, 2).join(', ')}
                        {result.node.metadata.tags.length > 2 && ` +${result.node.metadata.tags.length - 2}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={styles.relevanceContainer}>
                <div
                  style={{
                    ...styles.relevanceBar,
                    width: `${result.relevance * 100}%`,
                    backgroundColor: getRelevanceColor(result.relevance)
                  }}
                />
                <span style={styles.relevanceText}>
                  {Math.round(result.relevance * 100)}%
                </span>
              </div>
            </div>

            {result.highlights.length > 0 && (
              <div style={styles.highlights}>
                {result.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    style={styles.highlight}
                    dangerouslySetInnerHTML={{ __html: highlight }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={handlePrevPage}
            disabled={offset === 0}
            style={{
              ...styles.paginationButton,
              ...(offset === 0 ? styles.paginationButtonDisabled : {})
            }}
          >
            ← Previous
          </button>
          <span style={styles.paginationInfo}>
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={handleNextPage}
            disabled={offset + limit >= total}
            style={{
              ...styles.paginationButton,
              ...(offset + limit >= total ? styles.paginationButtonDisabled : {})
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600
  },
  pageInfo: {
    fontSize: '14px',
    color: '#666'
  },
  resultsList: {
    maxHeight: '600px',
    overflowY: 'auto'
  },
  resultItem: {
    padding: '16px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '8px'
  },
  typeIcon: {
    fontSize: '24px',
    flexShrink: 0
  },
  resultMeta: {
    flex: 1,
    minWidth: 0
  },
  resultTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a'
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
    fontSize: '13px',
    color: '#666'
  },
  metaItem: {
    whiteSpace: 'nowrap'
  },
  metaDivider: {
    margin: '0 4px'
  },
  relevanceContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    minWidth: '80px'
  },
  relevanceBar: {
    height: '6px',
    borderRadius: '3px',
    transition: 'width 0.3s'
  },
  relevanceText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666'
  },
  highlights: {
    marginTop: '8px',
    paddingLeft: '36px'
  },
  highlight: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#444',
    marginBottom: '4px'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderTop: '1px solid #eee'
  },
  paginationButton: {
    padding: '8px 16px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 8px 0'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  }
};
