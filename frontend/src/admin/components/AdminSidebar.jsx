import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays,
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sparkles 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAssetUrl, getInitials } from '../utils/assetUrl';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { admin, logout } = useAdminAuth();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/events', label: 'Events', icon: CalendarDays },
    { to: '/admin/registrations', label: 'Registrations', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="admin-sidebar-overlay" onClick={onClose} />}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="admin-sidebar-header">
          <h2 className="admin-brand-title">
            <Sparkles size={18} color="#38BDF8" />
            <span>IT Summit 2026</span>
          </h2>
          <span className="admin-brand-badge">Admin Panel</span>
        </div>

        {/* Navigation Links */}
        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="admin-sidebar-footer">
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
            <div className="admin-user-info">
              <span className="admin-user-name">{admin?.full_name || 'Administrator'}</span>
              <span className="admin-user-role">{admin?.role || 'admin'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="admin-logout-btn"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
