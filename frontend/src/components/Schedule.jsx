import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Coffee, Mic, Lightbulb, Users, MonitorPlay, Award } from 'lucide-react';
import { useActiveEvent } from '../hooks/useActiveEvent';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

const format12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const calculateDuration = (start, end) => {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const diff = endMins - startMins;
  if (diff <= 0) return '';
  if (diff < 60) return `${diff} mins`;
  const hrs = Math.floor(diff / 60);
  const remMins = diff % 60;
  return remMins === 0 ? `${hrs} hr${hrs > 1 ? 's' : ''}` : `${hrs} hr${hrs > 1 ? 's' : ''} ${remMins} mins`;
};

const getSessionIcon = (title = '', sessionType = '') => {
  const combined = `${title} ${sessionType}`.toLowerCase();
  if (combined.includes('welcome') || combined.includes('registration') || combined.includes('check-in') || combined.includes('coffee')) {
    return <Coffee size={20} />;
  }
  if (combined.includes('keynote') || combined.includes('opening') || combined.includes('speech')) {
    return <Mic size={20} />;
  }
  if (combined.includes('tech') || combined.includes('talk') || combined.includes('innovation') || combined.includes('deep dive')) {
    return <Lightbulb size={20} />;
  }
  if (combined.includes('network') || combined.includes('collaboration') || combined.includes('panel') || combined.includes('interactive')) {
    return <Users size={20} />;
  }
  if (combined.includes('showcase') || combined.includes('demo') || combined.includes('pitch')) {
    return <MonitorPlay size={20} />;
  }
  if (combined.includes('closing') || combined.includes('award') || combined.includes('wrap')) {
    return <Award size={20} />;
  }
  return <Clock size={20} />;
};

const getTagType = (sessionType = '', index = 0) => {
  const t = sessionType.toLowerCase();
  if (t.includes('check-in') || t.includes('network') || t.includes('info')) return 'info';
  if (t.includes('keynote') || t.includes('opening') || t.includes('award')) return 'primary';
  if (t.includes('tech') || t.includes('deep')) return 'featured';
  if (t.includes('interactive') || t.includes('panel') || t.includes('workshop')) return 'success';
  if (t.includes('demo') || t.includes('showcase')) return 'warning';
  const tagTypes = ['primary', 'featured', 'info', 'success', 'warning'];
  return tagTypes[index % tagTypes.length];
};

const Schedule = () => {
  const { event: activeEvent, formattedDate, formattedTime, formattedDuration } = useActiveEvent();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSchedule() {
      try {
        setLoading(true);
        setError(null);

        const url = activeEvent?.id
          ? `${API_BASE}/api/events/${activeEvent.id}/schedule`
          : `${API_BASE}/api/events/active/schedule`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (isMounted) {
          if (data.success && Array.isArray(data.schedule)) {
            setSessions(data.schedule);
          } else {
            setSessions([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Schedule] Failed to fetch agenda schedule:', err.message);
          setError('Unable to load agenda at this time.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSchedule();

    return () => {
      isMounted = false;
    };
  }, [activeEvent?.id]);

  return (
    <section id="schedule" className="section-padding schedule-section">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="section-pill">
            <Calendar size={14} />
            <span>EVENT AGENDA</span>
          </div>
          <h2 className="section-title">
            Program <span className="text-gradient">Schedule</span>
          </h2>
          <p className="section-subtitle">
            A comprehensive, half-day agenda designed to maximize learning, networking, and creative inspiration.
          </p>
        </div>

        {/* Schedule Highlights Summary Card */}
        <div className="schedule-summary-card">
          <div className="summary-col">
            <span className="summary-label">Date:</span>
            <span className="summary-val">{formattedDate}</span>
          </div>
          <div className="summary-divider-v" />
          <div className="summary-col">
            <span className="summary-label">Total Duration:</span>
            <span className="summary-val">{formattedTime} ({formattedDuration})</span>
          </div>
          <div className="summary-divider-v" />
          <div className="summary-col">
            <span className="summary-label">Format:</span>
            <span className="summary-val">Keynotes, Panels & Demo Arena</span>
          </div>
        </div>

        {/* Timeline List */}
        <div className="timeline-container">
          {loading && sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted, #64748B)' }}>
              <Clock
                size={30}
                className="spin-animation"
                style={{ margin: '0 auto 0.75rem auto', display: 'block', color: 'var(--primary-dark-blue, #0B1F3A)' }}
              />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>Loading program schedule...</p>
            </div>
          ) : !loading && error && sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted, #64748B)' }}>
              <p style={{ margin: 0, fontSize: '0.92rem' }}>Program schedule will be available soon.</p>
            </div>
          ) : !loading && sessions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--bg-card, #FFFFFF)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px dashed var(--border-subtle, #CBD5E1)',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <Calendar
                size={36}
                style={{ color: 'var(--secondary-blue, #123B6D)', margin: '0 auto 0.75rem auto', display: 'block' }}
              />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--primary-dark-blue, #0B1F3A)',
                  marginBottom: '0.4rem',
                }}
              >
                Schedule Coming Soon
              </h3>
              <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
                The detailed agenda for {activeEvent?.name || 'the summit'} is currently being finalized and will be published shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="timeline-line" />

              {sessions.map((item, index) => {
                const startTimeFormatted = format12Hour(item.start_time);
                const duration = calculateDuration(item.start_time, item.end_time);
                const icon = getSessionIcon(item.title, item.session_type);
                const tagType = getTagType(item.session_type, index);
                const tagLabel = item.session_type || 'Summit Session';

                return (
                  <div key={item.id || index} className="timeline-item">
                    {/* Left Column: Time & Duration */}
                    <div className="timeline-time-col">
                      <div className="timeline-time-badge">
                        <Clock size={15} />
                        <span>{startTimeFormatted}</span>
                      </div>
                      {duration && <span className="timeline-duration">{duration}</span>}
                    </div>

                    {/* Center Dot Indicator */}
                    <div className="timeline-node">
                      <div className="timeline-dot">
                        {icon}
                      </div>
                    </div>

                    {/* Right Column: Card Content */}
                    <div className="timeline-content-col">
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <h3 className="timeline-title">{item.title}</h3>
                          <span className={`tag-badge tag-${tagType}`}>{tagLabel}</span>
                        </div>
                        {item.speaker_name && (
                          <div
                            style={{
                              fontSize: '0.84rem',
                              color: 'var(--secondary-blue, #123B6D)',
                              fontWeight: '600',
                              marginBottom: '0.4rem',
                            }}
                          >
                            Presenter: {item.speaker_name}
                          </div>
                        )}
                        {item.description && <p className="timeline-desc">{item.description}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Schedule;
