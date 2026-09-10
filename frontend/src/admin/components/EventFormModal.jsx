import React, { useState, useEffect } from 'react';
import { X, CalendarPlus, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const EventFormModal = ({ isOpen, event, onClose, onSuccess }) => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();
  const isEdit = Boolean(event && event.id);

  const [formData, setFormData] = useState(() => {
    if (event && event.id) {
      const cleanTime = (t) => {
        if (!t) return '';
        const parts = String(t).split(':');
        return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : t;
      };
      return {
        name: event.name || '',
        year: event.year || '',
        event_date: event.event_date ? event.event_date.split('T')[0] : '',
        start_time: cleanTime(event.start_time) || '08:00',
        end_time: cleanTime(event.end_time) || '14:00',
        venue: event.venue || '',
        description: event.description || '',
        image_url: event.image_url || '',
        registration_open: event.registration_open !== false,
        is_active: Boolean(event.is_active),
      };
    }
    const nextYear = new Date().getFullYear() + 1;
    return {
      name: `IT Innovation Summit ${nextYear}`,
      year: nextYear,
      event_date: '',
      start_time: '08:00',
      end_time: '14:00',
      venue: '',
      description: '',
      image_url: '',
      registration_open: true,
      is_active: false,
    };
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for Escape key
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);

    // Client-side validations
    const errors = [];
    if (!formData.name.trim()) errors.push('Event name is required.');
    const parsedYear = parseInt(formData.year, 10);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      errors.push('Valid event year (between 2000 and 2100) is required.');
    }
    if (!formData.event_date) errors.push('Event date is required.');
    if (!formData.start_time) errors.push('Start time is required.');
    if (!formData.end_time) errors.push('End time is required.');
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.push('End time must be later than start time.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        year: parsedYear,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        venue: formData.venue.trim() || null,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        registration_open: formData.registration_open,
        is_active: formData.is_active,
      };

      const url = isEdit
        ? `${API_BASE}/api/admin/events/${event.id}`
        : `${API_BASE}/api/admin/events`;

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setValidationErrors(['An event for this year already exists.']);
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
        } else {
          setValidationErrors([data.message || 'Failed to save event.']);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        onSuccess(data.event, isEdit ? 'Event updated successfully.' : 'Event created successfully.');
        onClose();
      } else {
        setValidationErrors([data.message || 'Failed to process event request.']);
      }
    } catch (err) {
      console.error('[EventFormModal] Error:', err.message);
      setValidationErrors(['Network or server error occurred. Please try again.']);
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
      aria-labelledby="event-form-title"
    >
      <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isEdit ? <Edit3 size={20} color="#123B6D" /> : <CalendarPlus size={20} color="#123B6D" />}
            <h3 id="event-form-title" className="modal-title">
              {isEdit ? 'Edit Event' : 'Create New Event'}
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

            {/* Form Fields */}
            <div className="form-group">
              <label htmlFor="event-name" className="form-label">
                Event Name <span className="required">*</span>
              </label>
              <input
                id="event-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. IT Innovation Summit 2027"
                value={formData.name}
                onChange={handleChange}
                maxLength={200}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="event-year" className="form-label">
                  Year <span className="required">*</span>
                </label>
                <input
                  id="event-year"
                  name="year"
                  type="number"
                  min="2000"
                  max="2100"
                  className="form-input"
                  placeholder="2027"
                  value={formData.year}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-date" className="form-label">
                  Event Date <span className="required">*</span>
                </label>
                <input
                  id="event-date"
                  name="event_date"
                  type="date"
                  className="form-input"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="start-time" className="form-label">
                  Start Time <span className="required">*</span>
                </label>
                <input
                  id="start-time"
                  name="start_time"
                  type="time"
                  className="form-input"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end-time" className="form-label">
                  End Time <span className="required">*</span>
                </label>
                <input
                  id="end-time"
                  name="end_time"
                  type="time"
                  className="form-input"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-venue" className="form-label">
                Venue
              </label>
              <input
                id="event-venue"
                name="venue"
                type="text"
                className="form-input"
                placeholder="e.g. Arusha International Conference Centre"
                value={formData.venue}
                onChange={handleChange}
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-image-url" className="form-label">
                Event Image URL
              </label>
              <input
                id="event-image-url"
                name="image_url"
                type="url"
                className="form-input"
                placeholder="https://example.com/banner.jpg"
                value={formData.image_url}
                onChange={handleChange}
              />
              <span className="form-helper" style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.2rem' }}>
                Optional web URL to a promotional event image or summit banner.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="event-description" className="form-label">
                Description
              </label>
              <textarea
                id="event-description"
                name="description"
                className="form-textarea"
                rows="3"
                placeholder="Brief summary of the summit's themes, keynote focus, or objectives..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Checkbox toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <label className="form-checkbox-card">
                <input
                  type="checkbox"
                  name="registration_open"
                  checked={formData.registration_open}
                  onChange={handleChange}
                />
                <div className="form-checkbox-content">
                  <span className="form-checkbox-title">Registration Open</span>
                  <span className="form-checkbox-desc">
                    Allows attendees to submit registration forms for this summit. If unchecked, submissions will be closed.
                  </span>
                </div>
              </label>

              <label className="form-checkbox-card">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <div className="form-checkbox-content">
                  <span className="form-checkbox-title">Make Active Event</span>
                  <span className="form-checkbox-desc">
                    Sets this event as the primary summit featured on the public website. The previous active event will automatically be deactivated.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="admin-btn admin-btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>{isEdit ? 'Saving Changes...' : 'Creating Event...'}</span>
                </>
              ) : (
                <span>{isEdit ? 'Save Changes' : 'Create Event'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;
