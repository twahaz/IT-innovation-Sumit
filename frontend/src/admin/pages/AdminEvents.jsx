import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarPlus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Eye,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Inbox,
  ListOrdered
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import EventFormModal from '../components/EventFormModal';
import EventDetailsModal from '../components/EventDetailsModal';
import DeleteEventModal from '../components/DeleteEventModal';
import EventScheduleModal from '../components/EventScheduleModal';

const AdminEvents = () => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activatingId, setActivatingId] = useState(null);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedEventForSchedule, setSelectedEventForSchedule] = useState(null);

  // Toast notifications
  const [notification, setNotification] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const refreshList = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/events`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch events');
        }

        if (isMounted) {
          setEvents(data.events || []);
          setFetchError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminEvents] Fetch error:', err.message);
          setFetchError('Unable to load events. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [API_BASE, getAuthHeaders, reloadKey]);

  // Handle Quick "Make Active"
  const handleMakeActive = async (eventToActivate) => {
    if (eventToActivate.is_active || activatingId) return;

    setActivatingId(eventToActivate.id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${eventToActivate.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to activate event');
      }

      showToast(`"${eventToActivate.name}" is now the active summit event.`);
      refreshList();
    } catch (err) {
      console.error('[AdminEvents] Activation error:', err.message);
      showToast(err.message || 'Could not activate event. Please try again.', 'error');
    } finally {
      setActivatingId(null);
    }
  };

  // Format date helper
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

  // Format 12-hour time helper
  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="admin-events-page">
      {/* Header & Quick Action */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h2 className="dashboard-heading">Events</h2>
          <p className="dashboard-subheading">
            Manage IT Innovation Summit events and annual registrations.
          </p>
        </div>
        <div className="dashboard-quick-actions">
          <button
            type="button"
            onClick={refreshList}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
            title="Refresh events list"
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEventForEdit(null);
              setFormModalOpen(true);
            }}
            className="admin-btn admin-btn-primary"
          >
            <CalendarPlus size={16} />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            backgroundColor: notification.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            border: `1px solid ${notification.type === 'error' ? '#FCA5A5' : '#A7F3D0'}`,
            color: notification.type === 'error' ? '#991B1B' : '#065F46',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span style={{ fontWeight: 600 }}>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: notification.type === 'error' ? '#991B1B' : '#065F46',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && events.length === 0 && (
        <div className="admin-card">
          <div className="loading-spinner-container">
            <Loader2 size={32} className="spin-animation" />
            <span style={{ marginLeft: '0.85rem', fontWeight: 600, color: '#123B6D' }}>
              Loading events...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {fetchError && !loading && (
        <div className="admin-card">
          <div className="empty-state">
            <AlertCircle size={36} color="#DC2626" className="empty-state-icon" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.4rem' }}>
              {fetchError}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748B', marginBottom: '1rem' }}>
              There was a problem communicating with the backend server.
            </p>
            <button
              type="button"
              onClick={refreshList}
              className="admin-btn admin-btn-primary"
            >
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !fetchError && events.length === 0 && (
        <div className="admin-card">
          <div className="empty-state">
            <Inbox size={42} className="empty-state-icon" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.4rem' }}>
              No events have been created yet.
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Get started by creating your first annual summit event.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedEventForEdit(null);
                setFormModalOpen(true);
              }}
              className="admin-btn admin-btn-primary"
            >
              <CalendarPlus size={16} />
              <span>Create New Event</span>
            </button>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!loading && !fetchError && events.length > 0 && (
        <div className="events-grid">
          {events.map((ev) => {
            const timeDisplay = `${formatTime12h(ev.start_time)} – ${formatTime12h(ev.end_time)}`;
            const isActivatingThis = activatingId === ev.id;
            const regCount = parseInt(ev.registration_count, 10) || 0;

            return (
              <div
                key={ev.id}
                className={`event-card ${ev.is_active ? 'is-active' : ''}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="event-card-header">
                    <div className="event-card-title-group">
                      <span className="event-card-year-badge">{ev.year}</span>
                      <h3 className="event-card-title">{ev.name}</h3>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="event-card-badges">
                    {ev.is_active ? (
                      <span className="event-pill active" title="Currently featured on the public site">
                        <Sparkles size={11} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="event-pill inactive">
                        <span>Inactive</span>
                      </span>
                    )}

                    {ev.registration_open ? (
                      <span className="event-pill open">
                        <CheckCircle2 size={11} />
                        <span>Registration Open</span>
                      </span>
                    ) : (
                      <span className="event-pill closed">
                        <XCircle size={11} />
                        <span>Registration Closed</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata List */}
                  <div className="event-meta-list">
                    <div className="event-meta-item">
                      <Calendar size={15} className="event-meta-icon" />
                      <span className="event-meta-value">{formatDate(ev.event_date)}</span>
                    </div>

                    <div className="event-meta-item">
                      <Clock size={15} className="event-meta-icon" />
                      <span className="event-meta-value">{timeDisplay}</span>
                    </div>

                    <div className="event-meta-item">
                      <MapPin size={15} className="event-meta-icon" />
                      <span className="event-meta-value">{ev.venue || 'Venue TBD'}</span>
                    </div>
                  </div>

                  {/* Attendees Registration Count */}
                  <div className="event-reg-count">
                    <span className="event-reg-label">Registrations</span>
                    <span className="event-reg-number">
                      <Users size={16} color="#123B6D" />
                      <span>{regCount}</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="event-card-actions">
                  <div className="event-actions-left">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventForDetails(ev);
                        setDetailsModalOpen(true);
                      }}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      title="View complete event details"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventForEdit(ev);
                        setFormModalOpen(true);
                      }}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      title="Edit event details"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventForSchedule(ev);
                        setScheduleModalOpen(true);
                      }}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      title="Manage event schedule & agenda"
                    >
                      <ListOrdered size={14} />
                      <span>Schedule</span>
                    </button>

                    {!ev.is_active && (
                      <button
                        type="button"
                        onClick={() => handleMakeActive(ev)}
                        disabled={isActivatingThis}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        style={{ color: '#065F46', borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }}
                        title="Set as the active summit event"
                      >
                        {isActivatingThis ? (
                          <Loader2 size={13} className="spin-animation" />
                        ) : (
                          <Sparkles size={13} />
                        )}
                        <span>Make Active</span>
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEventForDelete(ev);
                      setDeleteModalOpen(true);
                    }}
                    className="admin-btn admin-btn-sm"
                    style={{
                      backgroundColor: 'transparent',
                      color: regCount > 0 || ev.is_active ? '#94A3B8' : '#DC2626',
                      border: '1px solid transparent',
                      cursor: regCount > 0 || ev.is_active ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      ev.is_active
                        ? 'Cannot delete active event'
                        : regCount > 0
                        ? 'Cannot delete event with registrations'
                        : 'Delete event'
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      <EventFormModal
        key={selectedEventForEdit ? selectedEventForEdit.id : 'new'}
        isOpen={formModalOpen}
        event={selectedEventForEdit}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedEventForEdit(null);
        }}
        onSuccess={(savedEvent, message) => {
          showToast(message);
          refreshList();
        }}
      />

      {/* View Details Modal */}
      <EventDetailsModal
        isOpen={detailsModalOpen}
        event={selectedEventForDetails}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedEventForDetails(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        isOpen={deleteModalOpen}
        event={selectedEventForDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedEventForDelete(null);
        }}
        onSuccess={(deletedEvent, message) => {
          showToast(message);
          refreshList();
        }}
      />

      {/* Event Schedule & Agenda Management Modal */}
      <EventScheduleModal
        isOpen={scheduleModalOpen}
        event={selectedEventForSchedule}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedEventForSchedule(null);
        }}
      />
    </div>
  );
};

export default AdminEvents;
