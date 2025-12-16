'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesProps {
  onCancel?: () => void;
}

/**
 * Hook for managing unsaved changes detection and navigation blocking
 * Handles beforeunload, popstate, and internal link clicks
 */
export function useUnsavedChanges({ onCancel }: UseUnsavedChangesProps = {}) {
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markClean = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      window.history.pushState(null, '', window.location.href);

      setPendingNavigation(() => () => router.back());
      setShowExitConfirmation(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges, router]);

  // Handle internal link clicks
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLinkClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;

      const target = event.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      try {
        const linkUrl = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
          event.preventDefault();
          event.stopPropagation();
          setPendingNavigation(() => () =>
            router.push(linkUrl.pathname + linkUrl.search + linkUrl.hash)
          );
          setShowExitConfirmation(true);
        }
      } catch (error) {
        console.warn('Invalid URL in link:', anchor.href, error);
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges, router]);

  // Handle cancel button
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingNavigation(
        onCancel ? () => onCancel() : () => router.push('/assinatura-digital/templates')
      );
      setShowExitConfirmation(true);
    } else if (onCancel) {
      onCancel();
    } else {
      router.push('/assinatura-digital/templates');
    }
  }, [hasUnsavedChanges, onCancel, router]);

  // Confirm exit (discard changes)
  const confirmExit = useCallback(() => {
    setShowExitConfirmation(false);
    setHasUnsavedChanges(false);
    const navigation =
      pendingNavigation ??
      (onCancel ? () => onCancel() : () => router.push('/assinatura-digital/templates'));
    setPendingNavigation(null);
    navigation();
  }, [pendingNavigation, onCancel, router]);

  // Cancel exit (keep editing)
  const cancelExit = useCallback(() => {
    setShowExitConfirmation(false);
    setPendingNavigation(null);
  }, []);

  return {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    markDirty,
    markClean,
    showExitConfirmation,
    setShowExitConfirmation,
    handleCancel,
    confirmExit,
    cancelExit,
  };
}
