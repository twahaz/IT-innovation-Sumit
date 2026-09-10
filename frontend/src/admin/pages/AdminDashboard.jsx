import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import StatCard from '../components/StatCard';
import EventSelector from '../components/EventSelector';

const AdminDashboard = () => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventObj, setSelectedEventObj] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    this_week: 0,
    this_month: 0,
    email_sent: 0,
    email_failed: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  // Fetch dashboard statistics and recent registrations
  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const queryParams = selectedEventId && selectedEventId !== 'all'
          ? `?event_id=${selectedEventId}`
          : '';

        const res = await fetch(`${API_BASE}/api/admin/dashboard/stats${queryParams}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }

        if (isMounted) {
          setStats(data.stats || {
            total: 0,
            today: 0,
            this_week: 0,
            this_month: 0,
            email_sent: 0,
            email_failed: 0,
          });
          setRecent(data.recent || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminDashboard] Fetch error:', err.message);
          setError('Unable to load dashboard data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [API_BASE, getAuthHeaders, reloadKey, selectedEventId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  // Handle CSV export of registrations for selected event
  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const queryParams = selectedEventId && selectedEventId !== 'all'
        ? `?event_id=${selectedEventId}`
        : '';

      const res = await fetch(`${API_BASE}/api/admin/registrations/export${queryParams}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      const eventSlug = selectedEventObj ? `-${selectedEventObj.year}` : '';
      a.download = `summit-registrations${eventSlug}-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[AdminDashboard] Export error:', err.message);
      setExportError('Failed to download registrations CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Format date helper
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

  // Loading State
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h2 className="dashboard-heading">Dashboard</h2>
            <p className="dashboard-subheading">
              Overview of IT Innovation Summit 2026 registrations and activity.
            </p>
          </div>
        </div>
        <div className="admin-card">
          <div className="loading-spinner-container">
            <Loader2 size={32} className="spin-animation" />
            <span style={{ marginLeft: '0.85rem', fontWeight: 600, color: '#123B6D' }}>
              Loading dashboard metrics...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h2 className="dashboard-heading">Dashboard</h2>
            <p className="dashboard-subheading">
              Overview of IT Innovation Summit 2026 registrations and activity.
            </p>
          </div>
        </div>
        <div className="admin-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#0B1F3A', marginBottom: '0.5rem', fontWeight: 800 }}>
            Unable to load dashboard data. Please try again.
          </h3>
          <p style={{ color: '#64748B', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
            We encountered a network or server issue while retrieving the latest registration stats.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="admin-btn admin-btn-primary"
          >
            <RefreshCw size={15} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Dashboard Top Header & Quick Actions */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h2 className="dashboard-heading">Dashboard</h2>
          <p className="dashboard-subheading">
            {selectedEventObj
              ? `Overview of ${selectedEventObj.name} registrations and activity.`
              : 'Overview of all-time summit registrations and activity.'}
          </p>
        </div>
        <div className="dashboard-quick-actions">
          <EventSelector
            selectedEventId={selectedEventId}
            onSelectEvent={(id, eventObj) => {
              setSelectedEventId(id);
              setSelectedEventObj(eventObj);
            }}
          />
          <Link to="/admin/registrations" className="admin-btn admin-btn-secondary">
            <Users size={16} />
            <span>View Registrations</span>
          </Link>
          <Link to="/admin/analytics" className="admin-btn admin-btn-secondary">
            <BarChart3 size={16} />
            <span>View Analytics</span>
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="admin-btn admin-btn-primary"
            title="Download registrations as a CSV spreadsheet"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export Registrations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export notification error if any */}
      {exportError && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
          }}
        >
          <span>{exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard
          title="Total Registrations"
          value={stats.total ?? 0}
          subtext="All-time summit attendees"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Today"
          value={stats.today ?? 0}
          subtext="Registered today"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="This Week"
          value={stats.this_week ?? 0}
          subtext="Current week registrations"
          icon={TrendingUp}
          color="sky"
        />
        <StatCard
          title="This Month"
          value={stats.this_month ?? 0}
          subtext="Current month registrations"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Recent Registrations Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Registrations</h3>
          <div className="admin-card-actions">
            <Link to="/admin/registrations" className="admin-btn admin-btn-secondary admin-btn-sm">
              <span>View All Registrations</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <Inbox size={40} className="empty-state-icon" />
            <p style={{ margin: 0, fontWeight: 600 }}>No registrations yet.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Registration ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Institution</th>
                  <th>Registered At</th>
                  <th>Email Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <span className="admin-id-badge">#{reg.id}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0B1F3A' }}>{reg.full_name}</td>
                    <td style={{ color: '#475569' }}>{reg.email}</td>
                    <td>{reg.institution?.trim() ? reg.institution : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', color: '#64748B', fontSize: '0.85rem' }}>
                      {formatDate(reg.registered_at)}
                    </td>
                    <td>
                      {reg.email_sent ? (
                        <span className="status-pill sent">
                          <CheckCircle size={13} />
                          <span>Sent</span>
                        </span>
                      ) : (
                        <span className="status-pill failed">
                          <AlertCircle size={13} />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
