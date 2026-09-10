import React from 'react';
import { Lightbulb, Users, Cpu, Rocket, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { useActiveEvent } from '../hooks/useActiveEvent';

const About = () => {
  const { event } = useActiveEvent();
  const displayName = event?.name || 'IT Innovation Summit 2026';
  const displayYear = event?.year || 2026;

  const features = [
    {
      icon: <Lightbulb className="feature-icon" size={28} />,
      title: 'Innovation',
      description: 'Explore breakthrough paradigms, emerging digital solutions, and creative problem-solving driving modern industry shifts.',
      highlight: 'Emerging Trends & AI',
      colorTheme: 'cyan',
    },
    {
      icon: <Users className="feature-icon" size={28} />,
      title: 'Networking',
      description: 'Engage in dedicated mixer sessions to connect with engineering leads, mentors, fellow developers, and fellow students.',
      highlight: 'Direct Connections',
      colorTheme: 'blue',
    },
    {
      icon: <Cpu className="feature-icon" size={28} />,
      title: 'Technology',
      description: 'Gain hands-on knowledge of next-gen cloud architectures, intelligent systems, cyber defense, and modern development stacks.',
      highlight: 'Deep Tech Insights',
      colorTheme: 'purple',
    },
    {
      icon: <Rocket className="feature-icon" size={28} />,
      title: 'Entrepreneurship',
      description: 'Learn how to transform technical prototypes into viable, scalable digital ventures with guidance from startup founders.',
      highlight: 'From Idea to Scale',
      colorTheme: 'emerald',
    },
  ];

  const highlights = [
    'Interactive keynote addresses from leading industry veterans',
    'Curated exhibition arena showcasing innovative software and hardware projects',
    'Open collaborative roundtables addressing modern digital transformation',
    'Exclusive certificate of participation for registered attendees'
  ];

  return (
    <section id="about" className="section-padding about-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-pill">
            <Sparkles size={14} />
            <span>ABOUT THE SUMMIT</span>
          </div>
          <h2 className="section-title">
            Fostering Tomorrow’s <span className="text-gradient">Tech Frontiers</span>
          </h2>
          <p className="section-subtitle">
            A dynamic convergence of curious minds, groundbreaking research, and transformative engineering.
          </p>
        </div>

        {/* Narrative & Value Proposition Grid */}
        <div className="about-overview-grid">
          <div className="about-story-card">
            <h3 className="story-title">What is {displayName}?</h3>
            <p className="story-text">
              <strong>{displayName}</strong> is a premier half-day technology conference designed 
              to ignite innovation and accelerate digital transformation. Whether you are an aspiring software engineer, 
              an experienced tech professional, a researcher, or a startup founder, this summit serves as your launchpad 
              for actionable insights and high-impact partnerships.
            </p>
            <p className="story-text">
              We bridge the gap between academic theory and real-world industrial practice, giving every participant 
              direct exposure to the tools and mental models defining the future.
            </p>
            
            <div className="about-takeaways">
              <h4 className="takeaways-title">Why You Should Attend:</h4>
              <ul className="takeaways-list">
                {highlights.map((item, index) => (
                  <li key={index} className="takeaway-item">
                    <CheckCircle2 className="takeaway-check" size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="about-interactive-card">
            <div className="interactive-card-inner">
              <div className="interactive-badge">
                <Globe size={18} />
                <span>Theme {displayYear}</span>
              </div>
              <h3 className="theme-quote">
                "Technology, Innovation, Digital Transformation & Collaborative Networking"
              </h3>
              <p className="theme-description">
                Join over 500 tech leaders and pioneers under one roof to exchange perspectives on the next 
                decade of technological breakthroughs.
              </p>

              <div className="audience-tags">
                <span className="audience-tag">Students & Grads</span>
                <span className="audience-tag">Software Engineers</span>
                <span className="audience-tag">Founders & Tech CEOs</span>
                <span className="audience-tag">Data Scientists</span>
                <span className="audience-tag">Innovators</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards */}
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className={`feature-card feature-theme-${feature.colorTheme}`}>
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <div className="feature-content">
                <span className="feature-highlight-pill">{feature.highlight}</span>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
