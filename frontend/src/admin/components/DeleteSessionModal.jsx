import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const DeleteSessionModal = ({ isOpen, session, eventName, onClose, onSuccess }) => {
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

  if (!isOpen || !session) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/events/${session.event_id}/schedule/${session.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.message || 'Cannot delete this schedule session.');
        return;
      }

      onSuccess(session);
      handleClose();
    } catch (err) {
      console.error('[DeleteSessionModal] Error:', err.message);
      setDeleteError('A network error occurred while deleting the session.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-session-title"
    >
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="#DC2626" />
            <h3 id="delete-session-title" className="modal-title" style={{ color: '#DC2626' }}>
              Delete Agenda Session
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
          {deleteError && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.86rem',
                marginBottom: '1rem',
              }}
            >
              {deleteError}
            </div>
          )}

          <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
            Are you sure you want to delete this session from{' '}
            <strong style={{ color: '#0B1F3A' }}>{eventName || 'the event'}</strong>?
          </p>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.9rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: '700', color: '#0B1F3A', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              {session.title}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Time: {session.start_time} – {session.end_time}
              {session.session_type && ` • Type: ${session.session_type}`}
            </div>
          </div>

          <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>
            This action will immediately remove the session from the public schedule agenda.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSessionModal;
