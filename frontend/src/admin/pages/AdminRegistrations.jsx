import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import RegistrationDetailsModal from '../components/RegistrationDetailsModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EventSelector from '../components/EventSelector';

const AdminRegistrations = () => {
  const { API_BASE, getAuthHeaders } = useAdminAuth();

  // Selected event filter state
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventObj, setSelectedEventObj] = useState(null);

  // Data & Pagination state
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [emailStatus, setEmailStatus] = useState('all');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [selectedReg, setSelectedReg] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Notification / Toast
  const [notification, setNotification] = useState(null);

  // Exporting state
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
  };

  // Fetch registrations from backend
  const fetchRegistrations = async (pageToFetch = pagination.page) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', pageToFetch.toString());
      params.append('limit', pagination.limit.toString());

      if (selectedEventId && selectedEventId !== 'all') {
        params.append('event_id', selectedEventId.toString());
      }
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (emailStatus !== 'all') {
        params.append('email_status', emailStatus);
      }
      if (institutionFilter.trim()) {
        params.append('institution', institutionFilter.trim());
      }
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      const res = await fetch(`${API_BASE}/api/admin/registrations?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch registrations');
      }

      setRegistrations(data.data || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error('[AdminRegistrations] Fetch error:', err.message);
      setFetchError('Unable to load registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters or page change
  useEffect(() => {
    fetchRegistrations(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, emailStatus, institutionFilter, startDate, endDate, pagination.page, selectedEventId]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setEmailStatus('all');
    setInstitutionFilter('');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const isFilterActive =
    Boolean(debouncedSearch.trim()) ||
    emailStatus !== 'all' ||
    Boolean(institutionFilter.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate);

  // CSV Export
  const handleExport = async () => {
    setIsExporting(true);
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

      setNotification({
        type: 'success',
        message: 'Registrations export downloaded successfully.',
      });
    } catch (err) {
      console.error('[AdminRegistrations] Export error:', err.message);
      setNotification({
        type: 'error',
        message: 'Failed to download registrations CSV. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // View Details Modal Handlers
  const handleOpenDetails = (reg) => {
    setSelectedReg(reg);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedReg(null);
  };

  // Delete Modal Handlers
  const handleOpenDelete = (reg) => {
    setSelectedReg(reg);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
    setSelectedReg(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReg) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/registrations/${selectedReg.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete registration.');
      }

      setNotification({
        type: 'success',
        message: `Registration #${selectedReg.id} for "${selectedReg.full_name}" deleted successfully.`,
      });

      handleCloseDelete();
      fetchRegistrations(pagination.page);
    } catch (err) {
      console.error('[AdminRegistrations] Delete error:', err.message);
      setDeleteError(err.message || 'Unable to delete registration. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Date formatter
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

  // Compute pagination range display
  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="admin-registrations-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 className="dashboard-heading">Registrations</h2>
            <span
              style={{
                backgroundColor: '#EBF2FA',
                color: '#123B6D',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '1px solid rgba(18, 59, 109, 0.15)',
              }}
            >
              {pagination.total} {pagination.total === 1 ? 'Attendee' : 'Attendees'}
            </span>
          </div>
          <p className="dashboard-subheading">
            {selectedEventObj
              ? `Manage and review ${selectedEventObj.name} attendees.`
              : 'Manage and review summit attendees across all events.'}
          </p>
        </div>

        <div className="dashboard-quick-actions">
          <EventSelector
            selectedEventId={selectedEventId}
            onSelectEvent={(id, obj) => {
              setSelectedEventId(id);
              setSelectedEventObj(obj);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
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
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            backgroundColor: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${notification.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
            color: notification.type === 'success' ? '#065F46' : '#991B1B',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notification.type === 'success' ? (
              <CheckCircle size={18} color="#059669" />
            ) : (
              <AlertCircle size={18} color="#DC2626" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              color: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Search and Filters Bar */}
        <div className="filter-bar">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by name, email, phone, or institution..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Email Status Filter */}
          <select
            className="admin-select"
            value={emailStatus}
            onChange={(e) => {
              setEmailStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            aria-label="Filter by email delivery status"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="sent">Confirmed (Email Sent)</option>
            <option value="failed">Delivery Failed</option>
          </select>

          {/* Reset Filters */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              title="Reset all search and filter conditions"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-spinner-container">
            <Loader2 size={32} className="spin-animation" />
            <span style={{ marginLeft: '0.85rem', fontWeight: 600, color: '#123B6D' }}>
              Loading registrations...
            </span>
          </div>
        ) : fetchError ? (
          /* Error State */
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
            <h4 style={{ fontSize: '1.1rem', color: '#0B1F3A', marginBottom: '0.5rem', fontWeight: 700 }}>
              {fetchError}
            </h4>
            <button
              type="button"
              onClick={() => fetchRegistrations(pagination.page)}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ marginTop: '0.5rem' }}
            >
              Retry
            </button>
          </div>
        ) : registrations.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <Inbox size={42} className="empty-state-icon" />
            <h4 style={{ fontSize: '1.05rem', color: '#0B1F3A', marginBottom: '0.4rem', fontWeight: 700 }}>
              {isFilterActive
                ? 'No registrations match your current search or filters.'
                : 'No registrations found.'}
            </h4>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="admin-btn admin-btn-secondary admin-btn-sm"
                style={{ marginTop: '0.75rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Registrations Table */
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Registration ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Institution</th>
                  <th>Registered At</th>
                  <th>Email Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <span className="admin-id-badge">#{reg.id}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0B1F3A' }}>{reg.full_name}</td>
                    <td style={{ color: '#475569' }}>{reg.email}</td>
                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{reg.phone || '—'}</td>
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(reg)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="View Registration Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(reg)}
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          title="Delete Registration"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !fetchError && pagination.total > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
              <strong>{pagination.total}</strong> registrations
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <RegistrationDetailsModal
        isOpen={isDetailsOpen}
        registration={selectedReg}
        onClose={handleCloseDetails}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        registration={selectedReg}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />
    </div>
  );
};

export default AdminRegistrations;
