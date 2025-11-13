import { useEffect, useCallback } from 'react';
import { BehavioralEvent } from '@shared/types';

export function useBehavioralTracking() {
  const captureEvent = useCallback(async (
    eventType: 'click' | 'hover' | 'focus' | 'scroll',
    target: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const event: Omit<BehavioralEvent, 'id' | 'timestamp'> = {
        eventType,
        target,
        metadata,
        timestamp: new Date(),
      };

      await fetch('/api/behavioral-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to capture behavioral event:', error);
    }
  }, []);

  const registerClickHook = useCallback((selector: string, elementName: string) => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches(selector) || target.closest(selector)) {
        captureEvent('click', elementName, {
          selector,
          timestamp: Date.now(),
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [captureEvent]);

  const registerHoverHook = useCallback((selector: string, elementName: string) => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches(selector) || target.closest(selector)) {
        captureEvent('hover', elementName, {
          selector,
          timestamp: Date.now(),
        });
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    return () => document.removeEventListener('mouseenter', handleMouseEnter, true);
  }, [captureEvent]);

  const registerFocusHook = useCallback((selector: string, elementName: string) => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches(selector) || target.closest(selector)) {
        captureEvent('focus', elementName, {
          selector,
          timestamp: Date.now(),
        });
      }
    };

    document.addEventListener('focus', handleFocus, true);
    return () => document.removeEventListener('focus', handleFocus, true);
  }, [captureEvent]);

  return {
    captureEvent,
    registerClickHook,
    registerHoverHook,
    registerFocusHook,
  };
}
