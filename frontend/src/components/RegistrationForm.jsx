import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  Ticket, 
  Calendar,
  Clock,
  MapPin,
  Lock
} from 'lucide-react';
import { useActiveEvent } from '../hooks/useActiveEvent';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';
const API_URL = `${API_BASE}/api/registrations`;

const RegistrationForm = () => {
  const { 
    event, 
    formattedDateShort, 
    formattedTime, 
    isRegistrationOpen, 
    formatEventDateShort, 
    formatTimeRange 
  } = useActiveEvent();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    roleCategory: 'Student / Graduate',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [apiErrorsList, setApiErrorsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passDetails, setPassDetails] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Phone
    const phoneTrimmed = formData.phone.trim();
    const phoneDigits = phoneTrimmed.replace(/[^0-9]/g, '');
    if (!phoneTrimmed) {
      newErrors.phone = 'Please enter your phone number.';
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.phone = 'Please enter a valid contact number (7-15 digits).';
    }

    // Institution / Organization (Optional on backend, required by frontend label)
    if (!formData.organization.trim()) {
      newErrors.organization = 'Please specify your institution or organization.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for that specific field when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError(null);
      setApiErrorsList([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setApiErrorsList([]);

    if (!isRegistrationOpen) {
      setApiError(`Registration is currently closed for ${event?.name || 'this event'}.`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Prevent duplicate submissions while request is processing
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      institution: formData.organization.trim(),
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        if (response.status === 409) {
          const conflictMsg = responseData?.message || `This email is already registered for ${event?.name || 'the IT Innovation Summit'}.`;
          setApiError(conflictMsg);
          setErrors((prev) => ({
            ...prev,
            email: conflictMsg,
          }));
        } else if (response.status === 400 && responseData?.errors) {
          setApiError(responseData.message || 'Validation failed. Please review your details.');
          setApiErrorsList(Array.isArray(responseData.errors) ? responseData.errors : [responseData.errors]);
        } else if (responseData?.message) {
          setApiError(responseData.message);
        } else {
          setApiError('Unable to submit registration right now. Please try again.');
        }
        return;
      }

      // Registration successful - extract backend response
      const createdRecord = responseData?.data || {};

      setPassDetails({
        registrationId: createdRecord.id,
        fullName: createdRecord.full_name || payload.full_name,
        email: createdRecord.email || payload.email,
        phone: createdRecord.phone || payload.phone,
        institution: (createdRecord.institution || payload.institution || '').trim(),
        emailSent: responseData?.email_sent === true,
        emailMessage: responseData?.message,
        eventName: createdRecord.event_name || event?.name || 'IT Innovation Summit 2026',
        eventYear: createdRecord.event_year || event?.year || 2026,
        eventDate: event?.event_date,
        startTime: event?.start_time,
        endTime: event?.end_time,
        venue: event?.venue || 'Arusha International Conference Centre',
      });

      // Clear all form data and switch to confirmation state
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        organization: '',
        roleCategory: 'Student / Graduate',
      });
      setErrors({});
      setIsSubmitted(true);
    } catch (err) {
      console.error('[Registration] Network error or server unavailable:', err);
      setApiError('Unable to submit registration right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      organization: '',
      roleCategory: 'Student / Graduate',
    });
    setErrors({});
    setApiError(null);
    setApiErrorsList([]);
    setIsSubmitted(false);
    setPassDetails(null);
  };

  return (
    <section id="register" className="section-padding registration-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-pill">
            <Sparkles size={14} />
            <span>CLAIM YOUR PASS</span>
          </div>
          <h2 className="section-title">
            Register for the <span className="text-gradient">Summit</span>
          </h2>
          <p className="section-subtitle">
            Secure your complimentary entry pass. Registration is open to all students, tech professionals, and creators.
          </p>
        </div>

        <div className="registration-wrapper">
          {isSubmitted ? (
            /* Professional Registration Confirmation State */
            <div className="confirmation-card" role="region" aria-label="Registration Confirmation">
              {/* Centered Confirmation Header */}
              <div className="confirmation-header">
                <div className="confirmation-icon-wrapper" aria-hidden="true">
                  <CheckCircle2 size={38} className="confirmation-check-icon" />
                </div>
                <h3 className="confirmation-title">Registration Confirmed!</h3>
                <p className="confirmation-main-msg">
                  Thank you for registering for {passDetails?.eventName || event?.name || 'the IT Innovation Summit'}.
                </p>
                <p className="confirmation-sub-msg">
                  Your registration has been successfully received. We look forward to seeing you at the summit.
                </p>

                {/* Email Confirmation Status Notice */}
                {passDetails?.emailSent ? (
                  <div className="confirmation-email-note email-sent" role="status">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>A confirmation email has been sent to your email address.</span>
                  </div>
                ) : (
                  <div className="confirmation-email-note email-pending" role="status">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>Registration successful, but we couldn't send the confirmation email. Please keep your Registration ID for reference.</span>
                  </div>
                )}
              </div>

              {/* Registration ID Highlight */}
              <div className="confirmation-id-box" aria-label={`Registration ID ${passDetails?.registrationId}`}>
                <span className="confirmation-id-label">Registration ID</span>
                <span className="confirmation-id-value">#{passDetails?.registrationId}</span>
              </div>

              {/* Attendee Details & Event Information Grid */}
              <div className="confirmation-details-grid">
                {/* Attendee Submitted Information */}
                <div className="confirmation-section-card">
                  <h4 className="confirmation-section-title">
                    <User size={16} aria-hidden="true" />
                    <span>Attendee Details</span>
                  </h4>
                  <dl className="confirmation-list">
                    <div className="confirmation-list-row">
                      <dt>Full Name</dt>
                      <dd>{passDetails?.fullName}</dd>
                    </div>
                    <div className="confirmation-list-row">
                      <dt>Email</dt>
                      <dd>{passDetails?.email}</dd>
                    </div>
                    <div className="confirmation-list-row">
                      <dt>Phone</dt>
                      <dd>{passDetails?.phone}</dd>
                    </div>
                    {passDetails?.institution && (
                      <div className="confirmation-list-row">
                        <dt>Institution</dt>
                        <dd>{passDetails?.institution}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Event Information */}
                <div className="confirmation-section-card">
                  <h4 className="confirmation-section-title">
                    <Calendar size={16} aria-hidden="true" />
                    <span>Event Information</span>
                  </h4>
                  <dl className="confirmation-list">
                    <div className="confirmation-list-row">
                      <dt>Event</dt>
                      <dd>{passDetails?.eventName || event?.name || 'IT Innovation Summit 2026'}</dd>
                    </div>
                    <div className="confirmation-list-row">
                      <dt>Date</dt>
                      <dd>{passDetails?.eventDate ? formatEventDateShort(passDetails.eventDate) : formattedDateShort}</dd>
                    </div>
                    <div className="confirmation-list-row">
                      <dt>Time</dt>
                      <dd>
                        {passDetails?.startTime && passDetails?.endTime
                          ? formatTimeRange(passDetails.startTime, passDetails.endTime)
                          : formattedTime}
                      </dd>
                    </div>
                    {(passDetails?.venue || event?.venue) && (
                      <div className="confirmation-list-row">
                        <dt>Venue</dt>
                        <dd>{passDetails?.venue || event?.venue}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Return / Reset Button */}
              <div className="confirmation-actions">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-primary btn-lg confirmation-reset-btn"
                >
                  <RefreshCw size={18} aria-hidden="true" />
                  <span>Register Another Attendee</span>
                </button>
              </div>
            </div>
          ) : !isRegistrationOpen ? (
            /* Professional Registration Closed State */
            <div className="form-card closed-registration-card" role="region" aria-label="Registration Closed">
              <div className="form-card-header" style={{ textAlign: 'center', padding: '2.5rem 1.5rem 2rem' }}>
                <div 
                  className="form-header-badge" 
                  style={{ 
                    backgroundColor: '#FEF2F2', 
                    color: '#991B1B', 
                    borderColor: '#FCA5A5', 
                    margin: '0 auto 1.25rem',
                    padding: '0.4rem 0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Lock size={16} />
                  <span>Registration Closed</span>
                </div>
                <h3 className="form-title" style={{ fontSize: '1.45rem', color: '#0F172A', marginBottom: '0.75rem' }}>
                  Registration is Currently Closed
                </h3>
                <p className="form-subtitle" style={{ maxWidth: '540px', margin: '0 auto 1.75rem', color: '#64748B', lineHeight: '1.6' }}>
                  Online registrations for <strong>{event?.name || 'IT Innovation Summit 2026'}</strong> are currently closed. We are not accepting new entries at this moment.
                </p>

                <div 
                  className="registration-closed-info" 
                  style={{ 
                    backgroundColor: '#F8FAFC', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '12px', 
                    padding: '1.25rem 1.5rem', 
                    maxWidth: '460px', 
                    margin: '0 auto 1.5rem', 
                    textAlign: 'left' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem', color: '#334155', fontSize: '0.88rem' }}>
                    <Calendar size={16} color="#0284C7" />
                    <span><strong>Event Date:</strong> {formattedDateShort}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem', color: '#334155', fontSize: '0.88rem' }}>
                    <Clock size={16} color="#0284C7" />
                    <span><strong>Hours:</strong> {formattedTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.88rem' }}>
                    <MapPin size={16} color="#0284C7" />
                    <span><strong>Venue:</strong> {event?.venue || 'Arusha International Conference Centre'}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>
                  Please check back later or contact summit administration for inquiries.
                </p>
              </div>
            </div>
          ) : (
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-header-badge">
                  <Ticket size={18} />
                  <span>Free Attendance Pass</span>
                </div>
                <h3 className="form-title">Attendee Registration</h3>
                <p className="form-subtitle">Fill in the information below to reserve your seat.</p>
              </div>

              <form onSubmit={handleSubmit} className="register-form" noValidate>
                {/* Server/Network Error Alert Banner */}
                {apiError && (
                  <div className="error-alert-banner" role="alert">
                    <AlertCircle className="error-banner-icon" size={20} />
                    <div className="error-banner-content">
                      <h4 className="error-banner-title">{apiError}</h4>
                      {apiErrorsList.length > 0 && (
                        <ul className="error-banner-list">
                          {apiErrorsList.map((errItem, idx) => (
                            <li key={idx}>{errItem}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <div className={`input-container ${errors.fullName ? 'has-error' : ''}`}>
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Alex Mercer"
                      className="form-input"
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="required-star">*</span>
                  </label>
                  <div className={`input-container ${errors.email ? 'has-error' : ''}`}>
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="alex.mercer@example.com"
                      className="form-input"
                      required
                    />
                  </div>
                  {errors.email && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number <span className="required-star">*</span>
                  </label>
                  <div className={`input-container ${errors.phone ? 'has-error' : ''}`}>
                    <Phone className="input-icon" size={18} />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 019-2834"
                      className="form-input"
                      required
                    />
                  </div>
                  {errors.phone && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.phone}</span>
                    </div>
                  )}
                </div>

                {/* Institution / Organization */}
                <div className="form-group">
                  <label htmlFor="organization" className="form-label">
                    Institution / Organization <span className="required-star">*</span>
                  </label>
                  <div className={`input-container ${errors.organization ? 'has-error' : ''}`}>
                    <Building2 className="input-icon" size={18} />
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="e.g. Tech Institute / Acme Corp"
                      className="form-input"
                      required
                    />
                  </div>
                  {errors.organization && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.organization}</span>
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div className="form-group">
                  <label htmlFor="roleCategory" className="form-label">
                    Participant Role
                  </label>
                  <select
                    id="roleCategory"
                    name="roleCategory"
                    value={formData.roleCategory}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Student / Graduate">Student / Graduate</option>
                    <option value="Software Developer / Engineer">Software Developer / Engineer</option>
                    <option value="Tech Entrepreneur / Founder">Tech Entrepreneur / Founder</option>
                    <option value="Researcher / Academic">Researcher / Academic</option>
                    <option value="Technology Enthusiast">Technology Enthusiast</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-full btn-lg form-submit-btn"
                >
                  {isSubmitting ? (
                    <span className="btn-loading-state">
                      <RefreshCw className="spinner-icon" size={18} />
                      Submitting Registration...
                    </span>
                  ) : (
                    <>
                      <span>Register Now</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="form-privacy-note">
                  🔒 By registering, you agree to receive summit schedule updates and entry badge notifications.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
