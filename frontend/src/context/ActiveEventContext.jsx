import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  formatEventDateFull,
  formatEventDateShort,
  formatTime12h,
  formatTimeRange,
  formatDuration,
} from '../utils/eventFormatters';

const ActiveEventContext = createContext(null);

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

// Safe default fallback if network fails or backend is unreachable
const DEFAULT_FALLBACK_EVENT = {
  id: 1,
  name: 'IT Innovation Summit 2026',
  year: 2026,
  event_date: '2026-10-10',
  start_time: '08:00:00',
  end_time: '14:00:00',
  venue: 'Arusha International Conference Centre',
  description:
    'The flagship summit bringing together students, developers, entrepreneurs, technology enthusiasts, and innovators to exchange game-changing ideas and shape the future of digital transformation.',
  image_url: null,
  registration_open: true,
  is_active: true,
};

export const ActiveEventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchActiveEvent() {
      try {
        const res = await fetch(`${API_BASE}/api/events/active`);
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        if (!data.success || !data.event) {
          throw new Error(data.message || 'Active event data unavailable');
        }

        if (isMounted) {
          setEvent(data.event);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[ActiveEventContext] Could not fetch active event, using fallback:', err.message);
          setError(err.message);
          // Fall back gracefully so UI never crashes or displays blank
          setEvent((prev) => prev || DEFAULT_FALLBACK_EVENT);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchActiveEvent();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // Use the fetched event or fall back to default
  const effectiveEvent = event || DEFAULT_FALLBACK_EVENT;

  // Memoized formatted values
  const formattedDate = useMemo(
    () => formatEventDateFull(effectiveEvent.event_date),
    [effectiveEvent.event_date]
  );

  const formattedDateShort = useMemo(
    () => formatEventDateShort(effectiveEvent.event_date),
    [effectiveEvent.event_date]
  );

  const formattedTime = useMemo(
    () => formatTimeRange(effectiveEvent.start_time, effectiveEvent.end_time),
    [effectiveEvent.start_time, effectiveEvent.end_time]
  );

  const formattedDuration = useMemo(
    () => formatDuration(effectiveEvent.start_time, effectiveEvent.end_time),
    [effectiveEvent.start_time, effectiveEvent.end_time]
  );

  const isRegistrationOpen = Boolean(effectiveEvent.registration_open);

  const value = useMemo(
    () => ({
      event: effectiveEvent,
      rawEvent: event,
      loading,
      error,
      refetch,
      formattedDate,
      formattedDateShort,
      formattedTime,
      formattedDuration,
      isRegistrationOpen,
      formatEventDateFull,
      formatEventDateShort,
      formatTime12h,
      formatTimeRange,
      formatDuration,
    }),
    [
      effectiveEvent,
      event,
      loading,
      error,
      refetch,
      formattedDate,
      formattedDateShort,
      formattedTime,
      formattedDuration,
      isRegistrationOpen,
    ]
  );

  return <ActiveEventContext.Provider value={value}>{children}</ActiveEventContext.Provider>;
};

export const useActiveEvent = () => {
  const context = useContext(ActiveEventContext);
  if (!context) {
    // Provide a safe fallback if used outside provider
    return {
      event: DEFAULT_FALLBACK_EVENT,
      rawEvent: null,
      loading: false,
      error: null,
      refetch: () => {},
      formattedDate: formatEventDateFull(DEFAULT_FALLBACK_EVENT.event_date),
      formattedDateShort: formatEventDateShort(DEFAULT_FALLBACK_EVENT.event_date),
      formattedTime: formatTimeRange(DEFAULT_FALLBACK_EVENT.start_time, DEFAULT_FALLBACK_EVENT.end_time),
      formattedDuration: formatDuration(DEFAULT_FALLBACK_EVENT.start_time, DEFAULT_FALLBACK_EVENT.end_time),
      isRegistrationOpen: Boolean(DEFAULT_FALLBACK_EVENT.registration_open),
      formatEventDateFull,
      formatEventDateShort,
      formatTime12h,
      formatTimeRange,
      formatDuration,
    };
  }
  return context;
};

export default ActiveEventContext;
