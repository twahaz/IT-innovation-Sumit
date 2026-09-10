import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import image1 from '../assets/hero/image1.jpeg';
import image2 from '../assets/hero/image2.jpg';
import image3 from '../assets/hero/image3.jpg';

const backgroundSlides = [
  {
    image: image1,
    title: 'Keynote & Main Stage',
    alt: 'IT Innovation Summit Keynote Stage'
  },
  {
    image: image2,
    title: 'Networking & Developer Circles',
    alt: 'Interactive Networking and Workshops'
  },
  {
    image: image3,
    title: 'Innovation Showcase',
    alt: 'Tech Innovation Showcase and Demos'
  }
];

const HeroSlider = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % backgroundSlides.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + backgroundSlides.length) % backgroundSlides.length);
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // 4.5 seconds autoplay interval, paused on hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  return (
    <div
      className="hero-bg-slider-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="IT Innovation Summit Background Showcase"
    >
      {/* Full-width Background Image Slides */}
      <div className="hero-bg-slides-container">
        {backgroundSlides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={index}
              className={`hero-bg-slide ${isActive ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
              role="img"
              aria-label={slide.alt}
              aria-hidden={!isActive}
            />
          );
        })}
      </div>

      {/* Subtle Dark Blue Overlay */}
      <div className="hero-darkblue-overlay" />

      {/* Foreground Hero Content */}
      <div className="hero-foreground-content">
        {children}
      </div>

      {/* Navigation Arrows on Left and Right of Hero */}
      <button
        type="button"
        onClick={goToPrev}
        className="hero-nav-arrow hero-nav-prev"
        aria-label="Previous background image"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        onClick={goToNext}
        className="hero-nav-arrow hero-nav-next"
        aria-label="Next background image"
      >
        <ChevronRight size={22} />
      </button>

      {/* Bottom Pagination Dots */}
      <div className="hero-pagination-dots" role="tablist">
        {backgroundSlides.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Switch to image ${index + 1}`}
            onClick={() => goToSlide(index)}
            className={`hero-dot ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
