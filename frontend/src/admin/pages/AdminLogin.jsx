import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import '../admin.css';

const AdminLogin = () => {
  const { isAuthenticated, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to /admin/dashboard
  if (!loading && isAuthenticated) {
    const from = location.state?.from?.pathname || '/admin/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your administrator email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(trimmedEmail, password);
      // Navigation is triggered upon successful login
      const targetPath = location.state?.from?.pathname || '/admin/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        {/* Header Branding */}
        <div className="admin-login-header">
          <div className="admin-login-pill">
            <Sparkles size={14} color="#0B1F3A" />
            <span>Admin Portal</span>
          </div>
          <h2 className="admin-login-title">IT Summit 2026</h2>
          <p className="admin-login-subtitle">
            Sign in to access registration management and summit analytics.
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div 
            className="error-alert-banner" 
            role="alert" 
            style={{ marginBottom: '1.25rem' }}
          >
            <AlertCircle className="error-banner-icon" size={18} />
            <div className="error-banner-content">
              <span className="error-banner-title">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="admin-email" className="form-label">
              Administrator Email
            </label>
            <div className="input-container">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="admin-email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="admin@itinnovationsummit.org"
                className="form-input"
                autoComplete="email"
                autoFocus
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>
            <div className="input-container has-right-action">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••••••"
                className="form-input"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-full btn-lg form-submit-btn"
            style={{ marginTop: '0.75rem' }}
          >
            {isSubmitting ? (
              <span className="btn-loading-state">
                <RefreshCw className="spinner-icon" size={18} />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <a
            href="/"
            style={{
              fontSize: '0.84rem',
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 600,
            }}
            onMouseOver={(e) => (e.target.style.color = '#0B1F3A')}
            onMouseOut={(e) => (e.target.style.color = '#64748B')}
          >
            ← Return to Summit Homepage
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
