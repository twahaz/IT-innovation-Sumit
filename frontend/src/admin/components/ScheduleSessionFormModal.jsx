import React, { useState, useEffect } from 'react';
import { X, Edit3, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const SESSION_TYPE_OPTIONS = [
  'Check-in & Networking',
  'Keynote Address',
  'Tech Deep Dives',
  'Interactive Session',
  'Live Demos',
  'Wrap-Up & Awards',
  'Panel Discussion',
  'Workshop',
  'Fireside Chat',
  'Lightning Talk',
  'Other',
];

const ScheduleSessionFormModal = ({ isOpen, eventId, session, onClose, onSuccess }) => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();
  const isEdit = Boolean(session && session.id);

  const cleanTime = (t) => {
    if (!t) return '';
    const parts = String(t).split(':');
    return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : t;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    speaker_name: '',
    session_type: 'Tech Deep Dives',
    custom_type: '',
    start_time: '09:00',
    end_time: '10:00',
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal opens or session prop changes
  useEffect(() => {
    if (isOpen) {
      if (session && session.id) {
        const hasPredefinedType = SESSION_TYPE_OPTIONS.includes(session.session_type);
        setFormData({
          title: session.title || '',
          description: session.description || '',
          speaker_name: session.speaker_name || '',
          session_type: hasPredefinedType ? session.session_type : (session.session_type ? 'Other' : 'Tech Deep Dives'),
          custom_type: hasPredefinedType ? '' : (session.session_type || ''),
          start_time: cleanTime(session.start_time) || '09:00',
          end_time: cleanTime(session.end_time) || '10:00',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          speaker_name: '',
          session_type: 'Tech Deep Dives',
          custom_type: '',
          start_time: '09:00',
          end_time: '10:00',
        });
      }
      setValidationErrors([]);
    }
  }, [isOpen, session]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
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
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) {
      errors.push('Session title is required.');
    } else if (formData.title.trim().length > 200) {
      errors.push('Session title cannot exceed 200 characters.');
    }

    if (!formData.start_time) {
      errors.push('Start time is required.');
    }
    if (!formData.end_time) {
      errors.push('End time is required.');
    }

    if (formData.start_time && formData.end_time) {
      if (formData.end_time <= formData.start_time) {
        errors.push('End time must be later than start time.');
      }
    }

    if (formData.session_type === 'Other' && !formData.custom_type.trim()) {
      errors.push('Please specify a session type or choose from the list.');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateForm();
    if (clientErrors.length > 0) {
      setValidationErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    const finalSessionType =
      formData.session_type === 'Other'
        ? formData.custom_type.trim()
        : formData.session_type.trim();

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      speaker_name: formData.speaker_name.trim() || null,
      session_type: finalSessionType || null,
      start_time: formData.start_time,
      end_time: formData.end_time,
    };

    try {
      const url = isEdit
        ? `${API_BASE}/api/admin/events/${eventId}/schedule/${session.id}`
        : `${API_BASE}/api/admin/events/${eventId}/schedule`;

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
        } else {
          setValidationErrors([data.message || 'Failed to save session.']);
        }
        return;
      }

      onSuccess(data.session, isEdit ? 'updated' : 'created');
      onClose();
    } catch (err) {
      console.error('[ScheduleSessionFormModal] Submission error:', err.message);
      setValidationErrors(['A network error occurred. Please check your connection.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-form-title"
    >
      <div className="modal-card" style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isEdit ? <Edit3 size={20} color="#123B6D" /> : <PlusCircle size={20} color="#123B6D" />}
            <h3 id="session-form-title" className="modal-title">
              {isEdit ? 'Edit Agenda Session' : 'Add Agenda Session'}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div className="modal-body">
            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {validationErrors.map((msg, i) => (
                    <span key={i}>{msg}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Session Title */}
            <div className="form-group">
              <label htmlFor="session-title" className="form-label">
                Session Title <span className="required">*</span>
              </label>
              <input
                id="session-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. AI Keynote: The Future of Deep Learning"
                value={formData.title}
                onChange={handleChange}
                maxLength={200}
                required
              />
            </div>

            {/* Time Grid (Start & End Time) */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="session-start-time" className="form-label">
                  Start Time <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="session-start-time"
                    name="start_time"
                    type="time"
                    className="form-input"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="session-end-time" className="form-label">
                  End Time <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="session-end-time"
                    name="end_time"
                    type="time"
                    className="form-input"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Session Type & Custom Type */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="session-type" className="form-label">
                  Session Tag / Format
                </label>
                <select
                  id="session-type"
                  name="session_type"
                  className="form-select"
                  value={formData.session_type}
                  onChange={handleChange}
                >
                  {SESSION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="speaker-name" className="form-label">
                  Speaker / Presenter
                </label>
                <input
                  id="speaker-name"
                  name="speaker_name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Jane Doe (Optional)"
                  value={formData.speaker_name}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>
            </div>

            {formData.session_type === 'Other' && (
              <div className="form-group">
                <label htmlFor="custom-type" className="form-label">
                  Custom Tag Name <span className="required">*</span>
                </label>
                <input
                  id="custom-type"
                  name="custom_type"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hackathon Pitch"
                  value={formData.custom_type}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label htmlFor="session-desc" className="form-label">
                Description / Overview
              </label>
              <textarea
                id="session-desc"
                name="description"
                className="form-textarea"
                rows={3}
                placeholder="Brief summary of what will be covered in this session..."
                value={formData.description}
                onChange={handleChange}
                maxLength={1000}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Session' : 'Add Session'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionFormModal;
