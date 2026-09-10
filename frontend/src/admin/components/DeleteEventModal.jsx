import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const DeleteEventModal = ({ isOpen, event, onClose, onSuccess }) => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleClose = React.useCallback(() => {
    setDeleteError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        handleClose();
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
  }, [isOpen, isDeleting, handleClose]);

  if (!isOpen || !event) return null;

  const regCount = parseInt(event.registration_count, 10) || 0;
  const hasRegistrations = regCount > 0;
  const isActive = Boolean(event.is_active);
  const cannotDelete = hasRegistrations || isActive;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (cannotDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.message || 'Cannot delete this event.');
        setIsDeleting(false);
        return;
      }

      if (data.success) {
        onSuccess(event, `Event "${event.name}" deleted successfully.`);
        onClose();
      } else {
        setDeleteError(data.message || 'Failed to delete event.');
      }
    } catch (err) {
      console.error('[DeleteEventModal] Error:', err.message);
      setDeleteError('Network error while deleting event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-event-dialog-title"
      aria-describedby="delete-event-dialog-desc"
    >
      <div className="modal-card" style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="#DC2626" />
            <h3 id="delete-event-dialog-title" className="modal-title" style={{ color: '#DC2626' }}>
              Delete Event
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isDeleting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p
            id="delete-event-dialog-desc"
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#0B1F3A',
              marginBottom: '0.75rem',
            }}
          >
            Delete {event.name}?
          </p>

          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
            This action cannot be undone. The annual event configuration for{' '}
            <strong style={{ color: '#0B1F3A' }}>{event.name} ({event.year})</strong> will be permanently removed.
          </p>

          {/* Warning banner if has registrations */}
          {hasRegistrations && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong>Cannot delete an event that has registrations.</strong>
                <div style={{ marginTop: '0.25rem', fontSize: '0.82rem', color: '#7F1D1D' }}>
                  This event has {regCount} registered attendee{regCount > 1 ? 's' : ''}. To preserve data integrity and prevent orphaned records, events with registered attendees cannot be removed.
                </div>
              </div>
            </div>
          )}

          {/* Warning banner if active event */}
          {!hasRegistrations && isActive && (
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#92400E',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong>Cannot delete the currently active event.</strong>
                <div style={{ marginTop: '0.25rem', fontSize: '0.82rem' }}>
                  Please activate another annual event before deleting this one.
                </div>
              </div>
            </div>
          )}

          {/* Backend error if any */}
          {deleteError && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.86rem',
                marginTop: '0.5rem',
              }}
            >
              {deleteError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || cannotDelete}
            className="admin-btn admin-btn-danger"
            title={cannotDelete ? 'Cannot delete this event' : 'Delete Event'}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Event</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEventModal;
