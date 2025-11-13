import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { KnowledgeGraphContainer } from './KnowledgeGraphContainer';

// Mock the store
const mockSetSelectedNodeId = vi.fn();
const mockSetNodes = vi.fn();
const mockSetConnections = vi.fn();

vi.mock('../store', () => ({
  useAppStore: (selector: any) => {
    const state = {
      nodes: [],
      connections: [],
      selectedNodeId: null,
      setNodes: mockSetNodes,
      setConnections: mockSetConnections,
      setSelectedNodeId: mockSetSelectedNodeId,
    };
    return selector ? selector(state) : state;
  },
}));

// Mock D3 visualizer component with interaction support
vi.mock('./KnowledgeGraphVisualizer', () => ({
  KnowledgeGraphVisualizer: ({ onNodeClick }: any) => (
    <div data-testid="graph-visualizer">
      <button onClick={() => onNodeClick?.('node-1')}>Click Node</button>
    </div>
  ),
}));

// Mock NodeDetailPanel component
vi.mock('./NodeDetailPanel', () => ({
  NodeDetailPanel: () => <div data-testid="node-detail-panel">Details</div>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('KnowledgeGraphContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and display graph data', async () => {
    const mockNodesResponse = {
      success: true,
      data: [
        {
          id: 'node-1',
          type: 'note',
          content: 'Test',
          metadata: { title: 'Test Node', tags: [], createdAt: new Date(), modifiedAt: new Date() },
          searchableText: 'Test',
        },
      ],
    };

    const mockConnectionsResponse = {
      success: true,
      data: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnectionsResponse,
      });

    render(<KnowledgeGraphContainer width={800} height={600} />);

    await waitFor(() => {
      expect(screen.getByTestId('graph-visualizer')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/nodes');
    expect(global.fetch).toHaveBeenCalledWith('/api/connections');
  });

  it('should show loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<KnowledgeGraphContainer width={800} height={600} />);
    expect(screen.getByText(/Loading graph/i)).toBeInTheDocument();
  });

  it('should handle node click interactions', async () => {
    const mockNodesResponse = {
      success: true,
      data: [
        {
          id: 'node-1',
          type: 'note',
          content: 'Test',
          metadata: { title: 'Test Node', tags: [], createdAt: new Date(), modifiedAt: new Date() },
          searchableText: 'Test',
        },
      ],
    };

    const mockConnectionsResponse = {
      success: true,
      data: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnectionsResponse,
      });

    render(<KnowledgeGraphContainer width={800} height={600} />);

    await waitFor(() => {
      expect(screen.getByTestId('graph-visualizer')).toBeInTheDocument();
    });

    const clickButton = screen.getByText('Click Node');
    fireEvent.click(clickButton);

    expect(mockSetSelectedNodeId).toHaveBeenCalledWith('node-1');
  });
});
