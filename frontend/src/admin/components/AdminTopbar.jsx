import React from 'react';
import { Menu, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAssetUrl, getInitials } from '../utils/assetUrl';

const AdminTopbar = ({ title, onMenuToggle }) => {
  const { admin } = useAdminAuth();

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          onClick={onMenuToggle}
          className="admin-menu-toggle"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="admin-page-title">{title}</h1>
      </div>

      <div className="admin-topbar-right">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-public-link"
          title="Open public landing page in new tab"
        >
          <span>Live Site</span>
          <ExternalLink size={14} />
        </a>

        <div className="admin-user-preview">
          <div className="admin-avatar">
            {admin?.profile_image_url ? (
              <img
                src={getAssetUrl(admin.profile_image_url)}
                alt={admin.full_name || 'Admin Profile'}
                className="admin-avatar-img"
              />
            ) : (
              <span>{getInitials(admin?.full_name)}</span>
            )}
          </div>
          <div className="admin-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="admin-user-name" style={{ color: '#0B1F3A', fontSize: '0.86rem', fontWeight: 700 }}>
              {admin?.full_name || 'Administrator'}
            </span>
            <span className="admin-user-role" style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'capitalize', fontWeight: 600 }}>
              {admin?.role === 'superadmin' ? 'Super Administrator' : (admin?.role || 'Administrator')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
