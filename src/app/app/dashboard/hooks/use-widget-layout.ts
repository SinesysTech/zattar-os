'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'zattar-widget-layout';

export interface WidgetLayoutState {
  enabledWidgets: string[];
  lastUpdated: string;
}

export function useWidgetLayout(userId: number) {
  const storageKey = `${STORAGE_KEY_PREFIX}-${userId}`;

  const [state, setState] = useState<WidgetLayoutState>(() => {
    if (typeof window === 'undefined') return { enabledWidgets: [], lastUpdated: '' };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as WidgetLayoutState;
    } catch {
      // Ignorar erros de parse
    }
    return { enabledWidgets: [], lastUpdated: '' };
  });

  // Indica se o usuário já personalizou o layout (vs. usar defaults)
  const hasCustomized = state.lastUpdated !== '';

  // Persistir no localStorage sempre que o estado mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.lastUpdated) {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey]);

  const isWidgetEnabled = useCallback(
    (widgetId: string) => state.enabledWidgets.includes(widgetId),
    [state.enabledWidgets]
  );

  const toggleWidget = useCallback((widgetId: string) => {
    setState((prev) => {
      const enabled = prev.enabledWidgets.includes(widgetId)
        ? prev.enabledWidgets.filter((id) => id !== widgetId)
        : [...prev.enabledWidgets, widgetId];
      return { enabledWidgets: enabled, lastUpdated: new Date().toISOString() };
    });
  }, []);

  const setWidgets = useCallback((widgetIds: string[]) => {
    setState({ enabledWidgets: widgetIds, lastUpdated: new Date().toISOString() });
  }, []);

  const resetToDefaults = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setState({ enabledWidgets: [], lastUpdated: '' });
  }, [storageKey]);

  return {
    enabledWidgets: state.enabledWidgets,
    hasCustomized,
    isWidgetEnabled,
    toggleWidget,
    setWidgets,
    resetToDefaults,
  };
}
