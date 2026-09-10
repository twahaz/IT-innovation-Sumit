import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, ArrowRight } from 'lucide-react';
import { useActiveEvent } from '../hooks/useActiveEvent';

const Navbar = () => {
  const { event, isRegistrationOpen } = useActiveEvent();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ['home', 'about', 'schedule', 'register'];
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Schedule', id: 'schedule' },
    { name: 'Register', id: 'register' },
  ];

  const displayYear = event?.year || 2026;

  return (
    <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Brand Logo */}
        <a 
          href="#home" 
          onClick={(e) => handleNavClick(e, 'home')}
          className="brand-logo"
        >
          <div className="logo-icon-glow">
            <Sparkles className="logo-icon" size={20} />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">IT INNOVATION</span>
            <span className="brand-badge">SUMMIT {displayYear}</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-list">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => handleNavClick(e, link.id)}
                  className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
                >
                  {link.name}
                  {activeSection === link.id && <span className="nav-link-indicator" />}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#register"
            onClick={(e) => handleNavClick(e, 'register')}
            className="btn btn-primary btn-sm"
          >
            <span>{isRegistrationOpen ? 'Register Now' : 'Registration Closed'}</span>
            <ArrowRight size={15} />
          </a>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-nav-overlay ${isOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-content">
          <ul className="mobile-nav-list">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => handleNavClick(e, link.id)}
                  className={`mobile-nav-link ${activeSection === link.id ? 'active' : ''}`}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="mobile-nav-cta">
            <a
              href="#register"
              onClick={(e) => handleNavClick(e, 'register')}
              className="btn btn-primary btn-full"
            >
              <span>{isRegistrationOpen ? 'Register Now' : 'Registration Closed'}</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
