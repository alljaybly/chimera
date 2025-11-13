import { create } from 'zustand';
import { KnowledgeNode, Connection, UIMutation, SearchResult } from '@shared/types';

interface AppState {
  // Knowledge graph state
  nodes: KnowledgeNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  
  // Search state
  searchResults: SearchResult[];
  searchQuery: string;
  isSearching: boolean;
  
  // UI state
  uiMutations: UIMutation[];
  sidebarOpen: boolean;
  
  // Actions
  setNodes: (nodes: KnowledgeNode[]) => void;
  setConnections: (connections: Connection[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  setUIMutations: (mutations: UIMutation[]) => void;
  toggleSidebar: () => void;
  addNode: (node: KnowledgeNode) => void;
  addConnection: (connection: Connection) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  nodes: [],
  connections: [],
  selectedNodeId: null,
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  uiMutations: [],
  sidebarOpen: true,
  
  // Actions
  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setUIMutations: (mutations) => set({ uiMutations: mutations }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  addConnection: (connection) => set((state) => ({ connections: [...state.connections, connection] })),
}));
