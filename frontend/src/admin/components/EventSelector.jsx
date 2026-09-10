import React, { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const EventSelector = ({
  selectedEventId,
  onSelectEvent,
  allowAll = true,
  disabled = false,
  showLabel = true,
}) => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/events`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.success && isMounted) {
          const list = data.events || [];
          setEvents(list);

          // If no selectedEventId is currently specified, default to active event
          if (selectedEventId === undefined || selectedEventId === null) {
            const activeEvent = list.find((e) => e.is_active);
            if (activeEvent) {
              onSelectEvent(activeEvent.id, activeEvent);
            } else if (allowAll) {
              onSelectEvent('all', null);
            } else if (list.length > 0) {
              onSelectEvent(list[0].id, list[0]);
            }
          }
        }
      } catch (err) {
        console.error('[EventSelector] Failed to fetch events:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, getAuthHeaders]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === 'all') {
      onSelectEvent('all', null);
    } else {
      const parsedId = parseInt(val, 10);
      const chosenEvent = events.find((ev) => ev.id === parsedId);
      onSelectEvent(parsedId, chosenEvent || null);
    }
  };

  return (
    <div className="event-selector-wrapper">
      {showLabel && (
        <span className="event-selector-label">
          <Calendar size={14} />
          <span>Event:</span>
        </span>
      )}
      {loading ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748B', padding: '0.4rem 0.75rem' }}>
          <Loader2 size={14} className="spin-animation" />
          <span>Loading...</span>
        </div>
      ) : (
        <select
          className="event-selector-select"
          value={selectedEventId || ''}
          onChange={handleChange}
          disabled={disabled || events.length === 0}
          title="Filter view by annual summit event"
          aria-label="Select Event"
        >
          {allowAll && <option value="all">All Events</option>}
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} {ev.is_active ? '★ (Active)' : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default EventSelector;
