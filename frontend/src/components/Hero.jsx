import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight, ShieldCheck, Users, Zap, Award } from 'lucide-react';
import HeroSlider from './HeroSlider';
import { useActiveEvent } from '../hooks/useActiveEvent';

const Hero = () => {
  const { event, formattedDateShort, formattedTime, isRegistrationOpen } = useActiveEvent();

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayName = event?.name || 'IT Innovation Summit 2026';
  const displayBadge = displayName.toUpperCase();
  const displayVenue = event?.venue || 'Arusha International Conference Centre';
  const displayDescription =
    event?.description ||
    'The flagship summit bringing together students, developers, entrepreneurs, technology enthusiasts, and innovators to exchange game-changing ideas and shape the future of digital transformation.';

  return (
    <section id="home" className="hero-section">
      <HeroSlider>
        <div className="container hero-container">
          <div className="hero-content">
            {/* Badge */}
            <div className="hero-badge-wrapper">
              <div className="hero-badge">
                <span className="badge-pulse-dot" />
                <span className="badge-text">{displayBadge}</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="hero-title">
              Innovate. <span className="hero-title-accent">Connect.</span> Transform.
            </h1>

            {/* Subtitle */}
            <p className="hero-description">{displayDescription}</p>

            {/* Event Quick Info Pills */}
            <div className="hero-meta-grid">
              <div className="meta-pill">
                <div className="meta-icon-wrapper">
                  <Calendar className="meta-icon" size={18} />
                </div>
                <div className="meta-info">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">{formattedDateShort}</span>
                </div>
              </div>

              <div className="meta-pill">
                <div className="meta-icon-wrapper">
                  <Clock className="meta-icon" size={18} />
                </div>
                <div className="meta-info">
                  <span className="meta-label">Time</span>
                  <span className="meta-value">{formattedTime}</span>
                </div>
              </div>

              <div className="meta-pill">
                <div className="meta-icon-wrapper">
                  <MapPin className="meta-icon" size={18} />
                </div>
                <div className="meta-info">
                  <span className="meta-label">Venue</span>
                  <span className="meta-value">{displayVenue}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="hero-actions">
              <a
                href="#register"
                onClick={(e) => handleScrollTo(e, 'register')}
                className="btn btn-primary btn-lg hero-btn-primary"
              >
                <span>{isRegistrationOpen ? 'Register Now' : 'Registration Closed'}</span>
                <ArrowRight size={18} />
              </a>

              <a
                href="#about"
                onClick={(e) => handleScrollTo(e, 'about')}
                className="btn btn-secondary btn-lg hero-btn-secondary"
              >
                <span>Learn More</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="hero-stats-bar">
              <div className="stat-item">
                <div className="stat-icon-box">
                  <Users size={20} />
                </div>
                <div className="stat-text-group">
                  <strong className="stat-number">500+</strong>
                  <span className="stat-caption">Attendees</span>
                </div>
              </div>

              <div className="stat-divider" />

              <div className="stat-item">
                <div className="stat-icon-box">
                  <Zap size={20} />
                </div>
                <div className="stat-text-group">
                  <strong className="stat-number">6</strong>
                  <span className="stat-caption">Power Sessions</span>
                </div>
              </div>

              <div className="stat-divider" />

              <div className="stat-item">
                <div className="stat-icon-box">
                  <Award size={20} />
                </div>
                <div className="stat-text-group">
                  <strong className="stat-number">20+</strong>
                  <span className="stat-caption">Tech Demos</span>
                </div>
              </div>

              <div className="stat-divider" />

              <div className="stat-item">
                <div className="stat-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <div className="stat-text-group">
                  <strong className="stat-number">100%</strong>
                  <span className="stat-caption">Free Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeroSlider>
    </section>
  );
};

export default Hero;
