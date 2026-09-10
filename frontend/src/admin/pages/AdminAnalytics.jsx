import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Calendar,
  Building2,
  MailCheck,
  RotateCw,
  Loader2,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import StatCard from '../components/StatCard';
import EventSelector from '../components/EventSelector';

const AdminAnalytics = () => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventObj, setSelectedEventObj] = useState(null);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchAnalytics() {
      try {
        const queryParams = selectedEventId && selectedEventId !== 'all'
          ? `?event_id=${selectedEventId}`
          : '';

        const res = await fetch(`${API_BASE}/api/admin/analytics${queryParams}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Failed to load analytics.');
        }

        if (isMounted) {
          setAnalyticsData(json.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminAnalytics] Fetch error:', err.message);
          setError('Unable to load analytics data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [API_BASE, getAuthHeaders, reloadKey, selectedEventId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  // Loading State
  if (loading) {
    return (
      <div className="admin-analytics-page">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h2 className="dashboard-heading">Analytics</h2>
            <p className="dashboard-subheading">
              Registration trends and attendee insights.
            </p>
          </div>
        </div>
        <div className="admin-card">
          <div className="loading-spinner-container">
            <Loader2 size={32} className="spin-animation" />
            <span style={{ marginLeft: '0.85rem', fontWeight: 600, color: '#123B6D' }}>
              Loading analytics data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <div className="admin-analytics-page">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h2 className="dashboard-heading">Analytics</h2>
            <p className="dashboard-subheading">
              Registration trends and attendee insights.
            </p>
          </div>
        </div>
        <div className="admin-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <AlertCircle size={44} color="#DC2626" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#0B1F3A', marginBottom: '0.5rem', fontWeight: 800 }}>
            Unable to load analytics data. Please try again.
          </h3>
          <p style={{ color: '#64748B', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
            We encountered an issue communicating with the analytics service.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="admin-btn admin-btn-primary"
          >
            <RotateCw size={15} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const summary = analyticsData?.summary || {};
  const timeline = analyticsData?.timeline || [];
  const institutions = analyticsData?.institutions || [];

  const total = summary.total || 0;
  const maxTimelineCount = Math.max(...timeline.map((t) => t.count), 1);
  const maxInstitutionCount = Math.max(...institutions.map((i) => i.count), 1);

  // Email Delivery stats
  const emailSent = summary.email_sent || 0;
  const emailFailed = summary.email_failed || 0;
  const emailDeliveryRate = total > 0 ? Math.round((emailSent / total) * 100) : 0;

  // Format date helper for timeline labels
  const formatTimelineDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-analytics-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h2 className="dashboard-heading">Analytics</h2>
          <p className="dashboard-subheading">
            {selectedEventObj
              ? `Registration trends and attendee insights for ${selectedEventObj.name}.`
              : 'Registration trends and attendee insights across all events.'}
          </p>
        </div>

        <div className="dashboard-quick-actions">
          <EventSelector
            selectedEventId={selectedEventId}
            onSelectEvent={(id, obj) => {
              setSelectedEventId(id);
              setSelectedEventObj(obj);
            }}
          />
          <button
            type="button"
            onClick={handleRetry}
            className="admin-btn admin-btn-secondary"
            title="Refresh analytics data"
          >
            <RotateCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="stat-cards-grid">
        <StatCard
          title="Total Registrations"
          value={total}
          subtext="All-time summit attendees"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Today"
          value={summary.today || 0}
          subtext="Registered today"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="This Week"
          value={summary.this_week || 0}
          subtext="Current week registrations"
          icon={TrendingUp}
          color="sky"
        />
        <StatCard
          title="This Month"
          value={summary.this_month || 0}
          subtext="Current month registrations"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="analytics-grid" style={{ marginBottom: '1.75rem' }}>
        {/* Registration Timeline Chart Card */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 className="chart-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#123B6D" />
              <span>Registration Trend Over Time</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Daily Signups
            </span>
          </div>

          {timeline.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <BarChart2 size={36} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No analytics data available yet.</p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              {/* Visual SVG Timeline Bar Chart */}
              <div
                style={{
                  minWidth: timeline.length > 8 ? `${timeline.length * 52}px` : '100%',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '1.5rem 0.5rem 0.5rem 0.5rem',
                  borderBottom: '2px solid #E2E8F0',
                  position: 'relative',
                }}
              >
                {/* Background guideline */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    left: 0,
                    right: 0,
                    borderTop: '1px dashed #E2E8F0',
                    pointerEvents: 'none',
                  }}
                />

                {timeline.map((item) => {
                  const barHeightPercent = Math.max(12, Math.round((item.count / maxTimelineCount) * 170));
                  return (
                    <div
                      key={item.date}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                      title={`${item.date}: ${item.count} attendee${item.count === 1 ? '' : 's'}`}
                    >
                      {/* Count Badge on Top of Bar */}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#0B1F3A',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {item.count}
                      </span>

                      {/* Bar Fill */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '38px',
                          height: `${barHeightPercent}px`,
                          background: 'linear-gradient(180deg, #38BDF8 0%, #123B6D 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.4s ease, opacity 0.15s ease',
                          cursor: 'pointer',
                        }}
                      />

                      {/* Date Label */}
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: '#64748B',
                          marginTop: '0.5rem',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                        }}
                      >
                        {formatTimelineDate(item.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Institution Breakdown Card */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 className="chart-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#123B6D" />
              <span>Attendee Institutions</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Top Organizations
            </span>
          </div>

          {institutions.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <Building2 size={36} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No analytics data available yet.</p>
            </div>
          ) : (
            <div className="bar-chart-container">
              {institutions.map((inst, index) => {
                const displayName =
                  inst.institution && inst.institution.trim()
                    ? inst.institution
                    : 'Not Specified';
                const percent = Math.round((inst.count / total) * 100) || 0;
                const barWidth = Math.round((inst.count / maxInstitutionCount) * 100) || 5;

                return (
                  <div key={`${displayName}-${index}`} className="bar-chart-row">
                    <div className="bar-label-group">
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#0B1F3A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '70%',
                        }}
                        title={displayName}
                      >
                        {displayName}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
                        {inst.count} ({percent}%)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${barWidth}%`,
                          background:
                            index === 0
                              ? 'linear-gradient(90deg, #123B6D, #0284C7)'
                              : 'linear-gradient(90deg, #1E40AF, #38BDF8)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Email Delivery Statistics Card */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <MailCheck size={20} color="#123B6D" />
          <h3 className="chart-title" style={{ margin: 0 }}>
            Confirmation Email Delivery
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Delivery Success Rate
            </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: emailDeliveryRate > 0 ? '#059669' : '#0B1F3A' }}>
              {emailDeliveryRate}%
            </span>
            <div className="bar-track" style={{ height: '8px', marginTop: '0.35rem' }}>
              <div
                className="bar-fill"
                style={{
                  width: `${emailDeliveryRate}%`,
                  background: '#059669',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                flex: 1,
                minWidth: '130px',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>
                Delivered
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065F46', marginTop: '0.2rem' }}>
                {emailSent}
              </div>
            </div>

            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                flex: 1,
                minWidth: '130px',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>
                Failed / Pending
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400E', marginTop: '0.2rem' }}>
                {emailFailed}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
