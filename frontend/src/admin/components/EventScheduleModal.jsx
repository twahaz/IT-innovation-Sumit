import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Clock,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  User,
  ListOrdered,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import ScheduleSessionFormModal from './ScheduleSessionFormModal';
import DeleteSessionModal from './DeleteSessionModal';

const format12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const calculateDuration = (start, end) => {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const diff = endMins - startMins;
  if (diff <= 0) return '';
  if (diff < 60) return `${diff} mins`;
  const hrs = Math.floor(diff / 60);
  const remMins = diff % 60;
  return remMins === 0 ? `${hrs} hr${hrs > 1 ? 's' : ''}` : `${hrs} hr${hrs > 1 ? 's' : ''} ${remMins} min`;
};

const EventScheduleModal = ({ isOpen, event, onClose }) => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  // Sub-modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedSessionForEdit, setSelectedSessionForEdit] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSessionForDelete, setSelectedSessionForDelete] = useState(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.msg === msg ? null : prev));
    }, 4000);
  };

  const fetchSchedule = useCallback(async () => {
    if (!event || !event.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}/schedule`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch schedule.');
      }

      setSessions(data.schedule || []);
    } catch (err) {
      console.error('[EventScheduleModal] Fetch error:', err.message);
      setError(err.message || 'Could not load schedule sessions.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, getAuthHeaders, event]);

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchSchedule();
    } else {
      setSessions([]);
      setError(null);
    }
  }, [isOpen, event, fetchSchedule]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !formModalOpen && !deleteModalOpen) {
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
  }, [isOpen, formModalOpen, deleteModalOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !formModalOpen && !deleteModalOpen) {
      onClose();
    }
  };

  // Move Session Up / Down
  const handleMoveSession = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sessions.length || isReordering) return;

    const newSessions = [...sessions];
    const temp = newSessions[index];
    newSessions[index] = newSessions[targetIndex];
    newSessions[targetIndex] = temp;

    // Optimistic update
    setSessions(newSessions);
    setIsReordering(true);

    try {
      const sessionIds = newSessions.map((s) => s.id);
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}/schedule/reorder`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ sessionIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update schedule order.');
      }

      setSessions(data.schedule);
      showToast('Agenda order updated.', 'success');
    } catch (err) {
      console.error('[EventScheduleModal] Reorder error:', err.message);
      showToast('Failed to save order. Reverting changes.', 'error');
      // Revert on error
      fetchSchedule();
    } finally {
      setIsReordering(false);
    }
  };

  const handleSessionSaved = (savedSession, action) => {
    fetchSchedule();
    showToast(
      action === 'created'
        ? `Added "${savedSession.title}" to schedule.`
        : `Updated "${savedSession.title}".`,
      'success'
    );
  };

  const handleSessionDeleted = (deletedSession) => {
    fetchSchedule();
    showToast(`Removed "${deletedSession.title}" from schedule.`, 'success');
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        <div
          className="modal-card"
          style={{
            maxWidth: '820px',
            width: '95%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ListOrdered size={20} color="#123B6D" />
                </div>
                <div>
                  <h3 id="schedule-modal-title" className="modal-title">
                    Schedule & Agenda
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      {event.name} ({event.year})
                    </span>
                    {event.is_active && (
                      <span className="badge badge-active" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        Active Event
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div
              style={{
                backgroundColor: toastMessage.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                borderBottom: `1px solid ${toastMessage.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
                color: toastMessage.type === 'error' ? '#991B1B' : '#166534',
                padding: '0.6rem 1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {toastMessage.type === 'error' ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{toastMessage.msg}</span>
            </div>
          )}

          {/* Subheader Toolbar */}
          <div
            style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0B1F3A' }}>
                {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'} Scheduled
              </span>
              <button
                type="button"
                onClick={fetchSchedule}
                disabled={loading}
                className="admin-btn admin-btn-secondary admin-btn-sm"
                title="Reload schedule list"
                style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
              >
                <RefreshCw size={13} className={loading ? 'spin-animation' : ''} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedSessionForEdit(null);
                setFormModalOpen(true);
              }}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={15} />
              <span>Add Session</span>
            </button>
          </div>

          {/* Modal Content / Sessions List */}
          <div
            className="modal-body"
            style={{
              padding: '1.25rem 1.5rem',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#FAFCFE',
            }}
          >
            {loading && sessions.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 1rem',
                  gap: '0.75rem',
                  color: '#64748B',
                }}
              >
                <Loader2 size={30} className="spin-animation" color="#123B6D" />
                <span style={{ fontSize: '0.9rem' }}>Loading agenda schedule...</span>
              </div>
            ) : error ? (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={fetchSchedule}
                  className="admin-btn admin-btn-sm"
                  style={{ backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none' }}
                >
                  Retry
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    color: '#64748B',
                  }}
                >
                  <Clock size={24} />
                </div>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#0B1F3A', fontSize: '1rem' }}>
                  No sessions in this agenda yet
                </h4>
                <p style={{ margin: '0 0 1.25rem 0', color: '#64748B', fontSize: '0.86rem' }}>
                  Start structuring the summit day by creating keynote addresses, breakout circles, or demo slots.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionForEdit(null);
                    setFormModalOpen(true);
                  }}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={15} />
                  <span>Add First Session</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map((item, index) => {
                  const duration = calculateDuration(item.start_time, item.end_time);
                  const isFirst = index === 0;
                  const isLast = index === sessions.length - 1;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      {/* Left: Reorder Controls + Order Number */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleMoveSession(index, 'up')}
                            disabled={isFirst || isReordering}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: isFirst || isReordering ? '#CBD5E1' : '#64748B',
                              cursor: isFirst || isReordering ? 'not-allowed' : 'pointer',
                              padding: '0.15rem',
                              lineHeight: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={isFirst ? 'First item' : 'Move up'}
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSession(index, 'down')}
                            disabled={isLast || isReordering}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: isLast || isReordering ? '#CBD5E1' : '#64748B',
                              cursor: isLast || isReordering ? 'not-allowed' : 'pointer',
                              padding: '0.15rem',
                              lineHeight: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={isLast ? 'Last item' : 'Move down'}
                          >
                            <ArrowDown size={15} />
                          </button>
                        </div>

                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={`Sort Order: ${item.sort_order}`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Middle: Session Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          {/* Time badge */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: '#EFF6FF',
                              color: '#123B6D',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            <Clock size={12} />
                            <span>
                              {format12Hour(item.start_time)} – {format12Hour(item.end_time)}
                            </span>
                          </div>

                          {/* Duration */}
                          {duration && (
                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '500' }}>
                              ({duration})
                            </span>
                          )}

                          {/* Session Type Tag */}
                          {item.session_type && (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                fontWeight: '600',
                                fontSize: '0.74rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              {item.session_type}
                            </span>
                          )}

                          {/* Speaker */}
                          {item.speaker_name && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.78rem',
                                color: '#0369A1',
                                fontWeight: '600',
                              }}
                            >
                              <User size={12} />
                              <span>{item.speaker_name}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            fontWeight: '700',
                            color: '#0B1F3A',
                            fontSize: '0.94rem',
                            marginBottom: item.description ? '0.2rem' : 0,
                          }}
                        >
                          {item.title}
                        </div>

                        {/* Description snippet */}
                        {item.description && (
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: '#64748B',
                              lineHeight: '1.4',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '520px',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionForEdit(item);
                            setFormModalOpen(true);
                          }}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          style={{ padding: '0.35rem 0.6rem' }}
                          title="Edit session"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionForDelete(item);
                            setDeleteModalOpen(true);
                          }}
                          className="admin-btn admin-btn-sm"
                          style={{
                            padding: '0.35rem 0.5rem',
                            backgroundColor: 'transparent',
                            color: '#DC2626',
                            border: '1px solid transparent',
                          }}
                          title="Delete session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Submodal: Form */}
      {formModalOpen && (
        <ScheduleSessionFormModal
          isOpen={formModalOpen}
          eventId={event.id}
          session={selectedSessionForEdit}
          onClose={() => {
            setFormModalOpen(false);
            setSelectedSessionForEdit(null);
          }}
          onSuccess={handleSessionSaved}
        />
      )}

      {/* Submodal: Delete */}
      {deleteModalOpen && selectedSessionForDelete && (
        <DeleteSessionModal
          isOpen={deleteModalOpen}
          session={selectedSessionForDelete}
          eventName={event.name}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedSessionForDelete(null);
          }}
          onSuccess={handleSessionDeleted}
        />
      )}
    </>
  );
};

export default EventScheduleModal;
