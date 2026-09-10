import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const RegistrationDetailsModal = ({ isOpen, registration, onClose }) => {
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

  if (!isOpen || !registration) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
    >
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <h3 id="details-modal-title" className="modal-title">
            Registration Details
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="details-list">
            <div className="details-row">
              <span className="details-label">Registration ID</span>
              <span className="details-value">
                <span className="admin-id-badge">#{registration.id}</span>
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Full Name</span>
              <span className="details-value" style={{ fontWeight: 700, color: '#0B1F3A' }}>
                {registration.full_name}
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Email Address</span>
              <span className="details-value">
                <a
                  href={`mailto:${registration.email}`}
                  style={{ color: '#123B6D', textDecoration: 'none', fontWeight: 600 }}
                >
                  {registration.email}
                </a>
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Phone Number</span>
              <span className="details-value">
                <a
                  href={`tel:${registration.phone}`}
                  style={{ color: '#172033', textDecoration: 'none' }}
                >
                  {registration.phone || '—'}
                </a>
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Institution / Organization</span>
              <span className="details-value">
                {registration.institution?.trim() ? registration.institution : 'Not Specified'}
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Registration Date</span>
              <span className="details-value">
                {formatDate(registration.registered_at)}
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Email Delivery Status</span>
              <span className="details-value">
                {registration.email_sent ? (
                  <span className="status-pill sent">
                    <CheckCircle size={13} />
                    <span>Sent</span>
                  </span>
                ) : (
                  <span className="status-pill failed">
                    <AlertCircle size={13} />
                    <span>Failed / Not Sent</span>
                  </span>
                )}
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

export default RegistrationDetailsModal;
