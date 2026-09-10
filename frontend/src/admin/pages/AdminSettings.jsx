import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  Key,
  Server,
  Database,
  Cpu,
  LogOut,
  Sparkles,
  Camera,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAssetUrl, getInitials } from '../utils/assetUrl';
import RemoveAvatarModal from '../components/RemoveAvatarModal';

const AdminSettings = () => {
  const { admin, logout, updateAdmin, API_BASE, getAuthHeaders } = useAdminAuth();

  // Profile fields state
  const [fullName, setFullName] = useState(admin?.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Avatar file upload & preview state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Remove avatar modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);

  // Toast / error notifications
  const [notification, setNotification] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [nameError, setNameError] = useState(null);

  // Keep fullName in sync if admin context updates
  useEffect(() => {
    if (admin?.full_name) {
      setFullName(admin.full_name);
    }
  }, [admin?.full_name]);

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Handle file selection from disk
  const handleFileSelect = (e) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type and extension
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setAvatarError('Please upload a JPG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile image must be smaller than 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Create local preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const localUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localUrl);
  };

  // Cancel local preview
  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save selected photo
  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    setIsUploadingPhoto(true);
    setAvatarError(null);

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/admin/profile/avatar`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload profile picture.');
      }

      // Update global admin context immediately
      updateAdmin(data.admin);
      showToast('Profile picture updated successfully.');

      // Clear preview state
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('[AdminSettings] Avatar upload error:', err.message);
      setAvatarError(err.message || 'Unable to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Confirm remove photo
  const handleConfirmRemovePhoto = async () => {
    setIsRemovingPhoto(true);
    setAvatarError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/avatar`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove profile picture.');
      }

      updateAdmin(data.admin);
      showToast('Profile picture removed successfully.');
      setRemoveModalOpen(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('[AdminSettings] Avatar remove error:', err.message);
      setAvatarError(err.message || 'Unable to remove profile picture. Please try again.');
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // Save Full Name changes
  const handleSaveName = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setNameError('Full name cannot be empty.');
      return;
    }
    if (fullName.trim().length > 150) {
      setNameError('Full name cannot exceed 150 characters.');
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      updateAdmin(data.admin);
      showToast('Profile updated successfully.');
    } catch (err) {
      console.error('[AdminSettings] Name update error:', err.message);
      setNameError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const hasPhoto = Boolean(admin?.profile_image_url);
  const isPreviewing = Boolean(previewUrl);
  const activeAvatarSrc = previewUrl || (hasPhoto ? getAssetUrl(admin.profile_image_url) : null);

  return (
    <div className="admin-settings-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h2 className="dashboard-heading">Settings</h2>
          <p className="dashboard-subheading">
            Summit configuration, administrative profile, and system status.
          </p>
        </div>
      </div>

      {/* Global Toast Notification */}
      {notification && (
        <div
          style={{
            backgroundColor: notification.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${notification.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
            color: notification.type === 'error' ? '#991B1B' : '#166534',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Administrator Profile Card */}
        <div className="admin-card" style={{ margin: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="#123B6D" />
              <span>Administrator Profile</span>
            </h3>
            <span
              style={{
                backgroundColor: '#EBF2FA',
                color: '#123B6D',
                border: '1px solid rgba(18, 59, 109, 0.15)',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            >
              {admin?.role || 'admin'}
            </span>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* Profile Avatar Section */}
            <div className="profile-avatar-row">
              <div className="admin-avatar-lg">
                {activeAvatarSrc ? (
                  <img
                    src={activeAvatarSrc}
                    alt={admin?.full_name || 'Admin Profile'}
                    className="admin-avatar-img"
                  />
                ) : (
                  <span>{getInitials(fullName || admin?.full_name)}</span>
                )}
              </div>

              <div className="profile-avatar-actions">
                <div className="profile-avatar-buttons">
                  {isPreviewing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSavePhoto}
                        disabled={isUploadingPhoto}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 size={14} className="spin-animation" />
                            <span>Saving Photo...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Save Photo</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelPreview}
                        disabled={isUploadingPhoto}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <X size={14} />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Camera size={14} />
                        <span>{hasPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>

                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={() => setRemoveModalOpen(true)}
                          className="admin-btn admin-btn-sm"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {isPreviewing && (
                  <span className="profile-preview-notice">
                    <Sparkles size={12} />
                    <span>New photo selected. Click Save Photo to apply.</span>
                  </span>
                )}

                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  JPG, PNG, or WEBP. Maximum file size 5 MB.
                </span>

                {avatarError && (
                  <span style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>
                    {avatarError}
                  </span>
                )}
              </div>
            </div>

            {/* Editable Profile Form */}
            <form onSubmit={handleSaveName}>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label htmlFor="admin-fullname" className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-fullname"
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    maxLength={150}
                    required
                  />
                </div>
                {nameError && (
                  <span style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.3rem', display: 'block' }}>
                    {nameError}
                  </span>
                )}
              </div>

              {/* Email Address (Read-only) */}
              <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                <label htmlFor="admin-email" className="form-label">
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-email"
                    type="email"
                    className="form-input"
                    value={admin?.email || ''}
                    disabled
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                </div>
                <span style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                  Email address is linked to system authentication and cannot be modified.
                </span>
              </div>

              {/* Role & Auth Method Info */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={13} />
                    <span>Role Access</span>
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B1F3A', textTransform: 'capitalize' }}>
                    {admin?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Key size={13} />
                    <span>Authentication</span>
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669' }}>
                    Signed JWT (HTTP-Only Cookie)
                  </span>
                </div>
              </div>

              {/* Save Name Button */}
              <button
                type="submit"
                disabled={isSavingName || fullName.trim() === (admin?.full_name || '')}
                className="admin-btn admin-btn-primary admin-btn-sm"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                {isSavingName ? (
                  <>
                    <Loader2 size={15} className="spin-animation" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>

            {/* Sign Out Button */}
            <div style={{ paddingTop: '1.1rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={logout}
                className="admin-btn admin-btn-danger"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <LogOut size={16} />
                <span>Sign Out of Admin Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Event Information Card */}
        <div className="admin-card" style={{ margin: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#123B6D" />
              <span>Event Information</span>
            </h3>
            <span
              style={{
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Active
            </span>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Event Name</span>
                <span className="details-value" style={{ fontWeight: 700, color: '#0B1F3A' }}>
                  IT Innovation Summit 2026
                </span>
              </div>

              <div className="details-row">
                <span className="details-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} />
                  <span>Date</span>
                </span>
                <span className="details-value">October 10, 2026</span>
              </div>

              <div className="details-row">
                <span className="details-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} />
                  <span>Time</span>
                </span>
                <span className="details-value">8:00 AM – 2:00 PM (EAT)</span>
              </div>

              <div className="details-row">
                <span className="details-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} />
                  <span>Venue</span>
                </span>
                <span className="details-value">
                  Arusha International Conference Centre (AICC) / Hybrid Stream
                </span>
              </div>

              <div className="details-row">
                <span className="details-label">Registration Access</span>
                <span className="details-value" style={{ color: '#059669', fontWeight: 700 }}>
                  Open to Public
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
              <Link to="/admin/events" className="admin-btn admin-btn-secondary admin-btn-sm">
                <Calendar size={14} />
                <span>Manage All Summit Events</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Information Card */}
      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} color="#123B6D" />
            <span>System Information</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            Environment: Development
          </span>
        </div>

        <div
          style={{
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#EBF2FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#123B6D',
                flexShrink: 0,
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Application
              </span>
              <div style={{ fontWeight: 700, color: '#0B1F3A', fontSize: '0.92rem', marginTop: '0.15rem' }}>
                IT Innovation Summit 2026
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>React 19 + Vite Frontend</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0,
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Database Engine
              </span>
              <div style={{ fontWeight: 700, color: '#0B1F3A', fontSize: '0.92rem', marginTop: '0.15rem' }}>
                PostgreSQL
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Event-Scoped Relational Store</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Access Control
              </span>
              <div style={{ fontWeight: 700, color: '#0B1F3A', fontSize: '0.92rem', marginTop: '0.15rem' }}>
                Role-Based JWT
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>HttpOnly Cookies + Bearer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Avatar Confirmation Modal */}
      <RemoveAvatarModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={handleConfirmRemovePhoto}
        isRemoving={isRemovingPhoto}
      />
    </div>
  );
};

export default AdminSettings;
