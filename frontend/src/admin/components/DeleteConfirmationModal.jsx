import React, { useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const DeleteConfirmationModal = ({
  isOpen,
  registration,
  isDeleting,
  error,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
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
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !registration) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="#DC2626" />
            <h3 id="delete-dialog-title" className="modal-title" style={{ color: '#DC2626' }}>
              Delete Registration
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p
            id="delete-dialog-description"
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#0B1F3A',
              marginBottom: '0.75rem',
            }}
          >
            Are you sure you want to delete this registration?
          </p>

          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
            This action cannot be undone. The registration record for{' '}
            <strong style={{ color: '#0B1F3A' }}>{registration.full_name}</strong> (ID{' '}
            <span className="admin-id-badge">#{registration.id}</span>
            {registration.email ? ` — ${registration.email}` : ''}) will be permanently removed
            from the database.
          </p>

          {error && (
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
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="admin-btn admin-btn-danger"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Registration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
