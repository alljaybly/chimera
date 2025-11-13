import React, { useEffect, useState } from 'react';
import { UIMutation } from '@shared/types';
import { useUIMutations } from '../../hooks/useUIMutations';

export function MutationHistoryViewer() {
  const [history, setHistory] = useState<UIMutation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { revertToState } = useUIMutations();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ui-mutations');
        if (!response.ok) throw new Error('Failed to fetch mutation history');
        
        const data = await response.json();
        if (data.success && data.data) {
          setHistory(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleRevert = async (mutation: UIMutation) => {
    if (window.confirm(`Revert to state before "${mutation.triggeredBy}"?`)) {
      await revertToState(mutation.appliedAt);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMutationIcon = (type: string) => {
    switch (type) {
      case 'hide': return '👁️‍🗨️';
      case 'show': return '👁️';
      case 'resize': return '↔️';
      case 'reorder': return '🔄';
      case 'shortcut': return '⚡';
      default: return '🔧';
    }
  };

  const getMutationColor = (type: string) => {
    switch (type) {
      case 'hide': return '#e74c3c';
      case 'show': return '#2ecc71';
      case 'resize': return '#3498db';
      case 'reorder': return '#9b59b6';
      case 'shortcut': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading mutation history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>UI Mutation History</h2>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No UI mutations yet</p>
          <p style={styles.emptySubtext}>
            As you use the application, the adaptive UI engine will learn your patterns
            and make automatic adjustments. Those changes will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>UI Mutation History</h2>
      <p style={styles.subtitle}>
        {history.length} mutation{history.length !== 1 ? 's' : ''} recorded
      </p>

      <div style={styles.timeline}>
        {history.map((mutation, index) => (
          <div key={mutation.id} style={styles.timelineItem}>
            <div style={styles.timelineMarker}>
              <div
                style={{
                  ...styles.timelineDot,
                  backgroundColor: getMutationColor(mutation.type),
                }}
              />
              {index < history.length - 1 && <div style={styles.timelineLine} />}
            </div>

            <div style={styles.mutationCard}>
              <div style={styles.mutationHeader}>
                <div style={styles.mutationIcon}>
                  {getMutationIcon(mutation.type)}
                </div>
                <div style={styles.mutationInfo}>
                  <h3 style={styles.mutationType}>
                    {mutation.type.charAt(0).toUpperCase() + mutation.type.slice(1)}
                  </h3>
                  <p style={styles.mutationTarget}>{mutation.target}</p>
                </div>
                <button
                  onClick={() => handleRevert(mutation)}
                  style={styles.revertButton}
                  title="Revert to this state"
                >
                  ↶ Revert
                </button>
              </div>

              <div style={styles.mutationBody}>
                <div style={styles.mutationDetail}>
                  <strong>Triggered by:</strong> {mutation.triggeredBy}
                </div>
                <div style={styles.mutationDetail}>
                  <strong>Applied:</strong> {formatDate(mutation.appliedAt)}
                </div>
                {Object.keys(mutation.parameters).length > 0 && (
                  <div style={styles.mutationDetail}>
                    <strong>Parameters:</strong>
                    <pre style={styles.parametersCode}>
                      {JSON.stringify(mutation.parameters, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  },
  error: {
    padding: '20px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c00',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 12px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    display: 'flex',
    marginBottom: '20px',
  },
  timelineMarker: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: '20px',
  },
  timelineDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '3px solid white',
    boxShadow: '0 0 0 2px #ddd',
    flexShrink: 0,
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: '4px',
  },
  mutationCard: {
    flex: 1,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  mutationHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
    gap: '12px',
  },
  mutationIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  mutationInfo: {
    flex: 1,
    minWidth: 0,
  },
  mutationType: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  mutationTarget: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    fontFamily: 'monospace',
  },
  revertButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  mutationBody: {
    padding: '16px',
  },
  mutationDetail: {
    marginBottom: '12px',
    fontSize: '14px',
    color: '#444',
  },
  parametersCode: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    overflow: 'auto',
  },
};
