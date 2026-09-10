import React, { useEffect } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';

const RemoveAvatarModal = ({ isOpen, onClose, onConfirm, isRemoving }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isRemoving) {
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
  }, [isOpen, isRemoving, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isRemoving) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-avatar-modal-title"
    >
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="#DC2626" />
            <h3 id="remove-avatar-modal-title" className="modal-title" style={{ color: '#DC2626' }}>
              Remove Profile Picture?
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isRemoving}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 0.75rem 0' }}>
            Are you sure you want to remove your current profile picture?
          </p>
          <p style={{ color: '#64748B', fontSize: '0.84rem', margin: 0, lineHeight: '1.4' }}>
            Your profile will revert to displaying your default initials avatar across the Topbar, Sidebar, and Settings.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
            disabled={isRemoving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={onConfirm}
            disabled={isRemoving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isRemoving ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Remove Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveAvatarModal;
