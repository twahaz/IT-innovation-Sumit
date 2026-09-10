import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import '../admin.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.includes('/registrations')) return 'Registration Management';
    if (pathname.includes('/analytics')) return 'Analytics & Insights';
    if (pathname.includes('/settings')) return 'System Settings';
    return 'Dashboard Overview';
  };

  return (
    <div className="admin-shell">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar 
          title={getPageTitle(location.pathname)} 
          onMenuToggle={() => setSidebarOpen((prev) => !prev)} 
        />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
