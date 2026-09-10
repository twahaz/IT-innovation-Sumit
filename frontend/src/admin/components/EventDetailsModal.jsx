import React, { useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  CalendarDays
} from 'lucide-react';

const EventDetailsModal = ({ isOpen, event, onClose }) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  const formatTime12h = (t) => {
    if (!t) return '';
    const parts = String(t).split(':');
    if (parts.length < 2) return t;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return t;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const timeDisplay = `${formatTime12h(event.start_time)} – ${formatTime12h(event.end_time)}`;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
    >
      <div className="modal-card" style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarDays size={20} color="#123B6D" />
            <h3 id="event-details-title" className="modal-title">
              Event Details
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {/* Main Title & Status Badges */}
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="event-card-year-badge">{event.year}</span>
              {event.is_active && (
                <span className="event-pill active">
                  <Sparkles size={12} />
                  <span>Active Event</span>
                </span>
              )}
              {event.registration_open ? (
                <span className="event-pill open">
                  <CheckCircle2 size={12} />
                  <span>Registration Open</span>
                </span>
              ) : (
                <span className="event-pill closed">
                  <XCircle size={12} />
                  <span>Registration Closed</span>
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B1F3A', margin: '0 0 0.5rem 0' }}>
              {event.name}
            </h2>
            {event.description && (
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {event.description}
              </p>
            )}
          </div>

          {/* Event Image if present */}
          {event.image_url && (
            <div style={{ marginBottom: '1.25rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', maxHeight: '180px' }}>
              <img
                src={event.image_url}
                alt={event.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Key Event Metrics Grid */}
          <div className="details-list">
            <div className="details-row">
              <span className="details-label">
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Event Date
              </span>
              <span className="details-value">{formatDate(event.event_date)}</span>
            </div>

            <div className="details-row">
              <span className="details-label">
                <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Summit Hours
              </span>
              <span className="details-value">{timeDisplay}</span>
            </div>

            <div className="details-row">
              <span className="details-label">
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Venue / Location
              </span>
              <span className="details-value">{event.venue || 'To Be Announced'}</span>
            </div>

            <div className="details-row">
              <span className="details-label">
                <Users size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Total Registered Attendees
              </span>
              <span className="details-value" style={{ fontWeight: 800, color: '#0B1F3A', fontSize: '1.05rem' }}>
                {event.registration_count ?? 0} {event.registration_count === 1 ? 'Attendee' : 'Attendees'}
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">
                <Info size={13} style={{ display: 'inline', marginRight: '4px' }} />
                System Record ID
              </span>
              <span className="details-value">
                <span className="admin-id-badge">Event #{event.id}</span>
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Created At</span>
              <span className="details-value" style={{ fontSize: '0.85rem', color: '#64748B' }}>
                {formatTimestamp(event.created_at)}
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Last Updated</span>
              <span className="details-value" style={{ fontSize: '0.85rem', color: '#64748B' }}>
                {formatTimestamp(event.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
