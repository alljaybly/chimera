import { useEffect, useState, useCallback } from 'react';
import { UIMutation } from '@shared/types';
import { useAppStore } from '../store';

export function useUIMutations() {
  const [isLoading, setIsLoading] = useState(true);
  const uiMutations = useAppStore((state) => state.uiMutations);
  const setUIMutations = useAppStore((state) => state.setUIMutations);

  // Load UI mutations on mount
  useEffect(() => {
    const loadMutations = async () => {
      try {
        const response = await fetch('/api/ui-mutations');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUIMutations(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load UI mutations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMutations();
  }, [setUIMutations]);

  // Apply mutations to the DOM
  const applyMutations = useCallback((mutations: UIMutation[]) => {
    mutations.forEach((mutation) => {
      try {
        const element = document.querySelector(mutation.target);
        if (!element) return;

        switch (mutation.type) {
          case 'hide':
            (element as HTMLElement).style.display = 'none';
            break;
          
          case 'show':
            (element as HTMLElement).style.display = mutation.parameters.display || 'block';
            break;
          
          case 'resize':
            if (mutation.parameters.width) {
              (element as HTMLElement).style.width = mutation.parameters.width;
            }
            if (mutation.parameters.height) {
              (element as HTMLElement).style.height = mutation.parameters.height;
            }
            break;
          
          case 'reorder':
            if (mutation.parameters.order !== undefined) {
              (element as HTMLElement).style.order = mutation.parameters.order.toString();
            }
            break;
          
          case 'shortcut':
            // Shortcuts are handled separately in the UI
            break;
        }
      } catch (error) {
        console.error(`Failed to apply mutation ${mutation.id}:`, error);
      }
    });
  }, []);

  // Apply mutations when they change
  useEffect(() => {
    if (!isLoading && uiMutations.length > 0) {
      applyMutations(uiMutations);
    }
  }, [uiMutations, isLoading, applyMutations]);

  const revertToState = useCallback(async (timestamp: Date) => {
    try {
      const response = await fetch('/api/ui-mutations/revert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: timestamp.toISOString() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUIMutations(data.data);
          // Reload page to apply reverted state
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to revert UI state:', error);
    }
  }, [setUIMutations]);

  return {
    mutations: uiMutations,
    isLoading,
    applyMutations,
    revertToState,
  };
}
