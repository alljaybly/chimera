import { useEffect } from 'react';
import { useBehavioralTracking } from '../../hooks/useBehavioralTracking';
import { useUIMutations } from '../../hooks/useUIMutations';

export function BehavioralTracker() {
  const { registerClickHook, registerFocusHook } = useBehavioralTracking();
  const { isLoading } = useUIMutations();

  useEffect(() => {
    if (isLoading) return;

    // Register behavioral hooks for key UI elements
    const cleanupFunctions: Array<() => void> = [];

    // Track navigation clicks
    cleanupFunctions.push(registerClickHook('nav a', 'navigation-link'));
    
    // Track search interactions
    cleanupFunctions.push(registerClickHook('[data-search-button]', 'search-button'));
    cleanupFunctions.push(registerFocusHook('[data-search-input]', 'search-input'));
    
    // Track node interactions
    cleanupFunctions.push(registerClickHook('[data-node]', 'knowledge-node'));
    
    // Track sidebar interactions
    cleanupFunctions.push(registerClickHook('[data-sidebar-toggle]', 'sidebar-toggle'));
    
    // Track content ingestion
    cleanupFunctions.push(registerClickHook('[data-ingest-note]', 'ingest-note-button'));
    cleanupFunctions.push(registerClickHook('[data-ingest-image]', 'ingest-image-button'));
    cleanupFunctions.push(registerClickHook('[data-ingest-webpage]', 'ingest-webpage-button'));

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [registerClickHook, registerFocusHook, isLoading]);

  return null; // This component doesn't render anything
}
