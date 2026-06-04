'use client';

import { useEffect, useRef } from 'react';

type UseAutoRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
  refreshOnFocus?: boolean;
  refreshOnVisible?: boolean;
};

export function useAutoRefresh(
  refresh: () => void | Promise<void>,
  {
    enabled = true,
    intervalMs = 15000,
    refreshOnFocus = true,
    refreshOnVisible = true,
  }: UseAutoRefreshOptions = {},
) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const runRefresh = () => {
      void refreshRef.current();
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      runRefresh();
    }, intervalMs);

    const handleFocus = () => {
      if (!refreshOnFocus) return;
      runRefresh();
    };

    const handleVisibilityChange = () => {
      if (!refreshOnVisible || document.visibilityState !== 'visible') return;
      runRefresh();
    };

    if (refreshOnFocus) {
      window.addEventListener('focus', handleFocus);
    }

    if (refreshOnVisible) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      window.clearInterval(intervalId);
      if (refreshOnFocus) {
        window.removeEventListener('focus', handleFocus);
      }
      if (refreshOnVisible) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [enabled, intervalMs, refreshOnFocus, refreshOnVisible]);
}
