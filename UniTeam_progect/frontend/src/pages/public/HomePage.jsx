// src/pages/public/HomePage.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const slides = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1600&q=80',
];

const universities = [
  { name: 'Makerere University', abbr: 'MAK', color: '#0B6E72' },
  { name: 'University of Ghana', abbr: 'UG', color: '#D4621A' },
  { name: 'University of Lagos', abbr: 'UNILAG', color: '#085A5E' },
  { name: 'University of Nairobi', abbr: 'UoN', color: '#0F8F96' },
  { name: 'UCT Cape Town', abbr: 'UCT', color: '#364649' },
  { name: 'KNUST', abbr: 'KNUST', color: '#565449' },
  { name: 'University of Ibadan', abbr: 'UI', color: '#0B6E72' },
  { name: 'Kenyatta University', abbr: 'KU', color: '#D4621A' },
  { name: 'Addis Ababa Uni', abbr: 'AAU', color: '#085A5E' },
  { name: 'UDSM Tanzania', abbr: 'UDSM', color: '#0F8F96' },
];

const features = [
  { icon: '✓', title: 'Task Management', desc: 'Assign, track, and complete academic tasks with deadlines, priorities, and status tracking built for university workflows.', color: 'teal' },
  { icon: '📅', title: 'Milestone Tracking', desc: 'Break projects into phases. Set milestones, track progress, and visualise your project timeline clearly.', color: 'orange' },
  { icon: '📁', title: 'File Management', desc: 'Upload, organise, and version control all your project files. Never lose a document again with cloud-backed storage.', color: 'brown' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Bring students, lecturers, and supervisors together with roles, permissions, and real-time notifications.', color: 'teal' },
  { icon: '💬', title: 'Meetings & Chat', desc: 'Schedule meetings, share agendas, and keep project discussions organised in dedicated team channels.', color: 'orange' },
  { icon: '📊', title: 'Progress Analytics', desc: 'Visual dashboards, completion rates, and deadline analytics help everyone stay informed and proactive.', color: 'brown' },
];

const testimonials = [
  {
    name: 'Amara Mensah',
    role: 'BSc Computer Science, Year 4',
    quote: '"UniTeam transformed how our group handled the final-year dissertation. We finished two weeks ahead of schedule."',
    initials: 'AM',
    featured: false,
  },
  {
    name: 'Dr. Lydia Nakato',
    role: 'Senior Lecturer, Statistics',
    quote: '"As a lecturer supervising 12 groups, UniTeam gives me a bird\'s-eye view of every project. I can spot issues before they escalate."',
    initials: 'Dr',
    featured: true,
  },
  {
    name: 'Kofi Owusu',
    role: 'MSc Data Science, Year 1',
    quote: '"The file management and submission tracking saved me hours each week. I actually enjoy group projects now."',
    initials: 'KO',
    featured: false,
  },
];

const HomePage = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideInterval = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideInterval.current);
  }, []);

  const goToSlide = (index) => {
    setActiveSlide(index);
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-slides">
          {slides.map((src, idx) => (
            <div
              key={idx}
              className={`hero-slide ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-indicators">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`hero-dot ${idx === activeSlide ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
            />
          ))}
        </div>

        <div className="hero-inner">
          <div className="hero-text reveal">
            <div className="hero-badge">
              <div className="hero-badge-dot">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="hero-badge-text">Open Project Collaboration</span>
            </div>
            <h1 className="hero-headline">
              Where University <span className="hl-teal">Teams</span> Get <span className="hl-orange">Things Done</span>
            </h1>
            <p className="hero-sub">
              UniTeam helps students, lecturers, and admins coordinate tasks, milestones, files, meetings, and submissions — all in one unified system.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary">Create Free Account →</Link>
              <Link to="/services" className="btn btn-outline-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
                See How It Works
              </Link>
            </div>
            <div className="hero-stats">
              <div><div className="hero-stat-value">12,400+</div><div className="hero-stat-label">Active Students</div></div>
              <div><div className="hero-stat-value">340+</div><div className="hero-stat-label">Universities</div></div>
              <div><div className="hero-stat-value">98%</div><div className="hero-stat-label">Satisfaction Rate</div></div>
            </div>
          </div>

          <div className="hero-visual reveal reveal-delay-1" style={{ position: 'relative' }}>
            <div className="hero-mini-card card-a">
              <div className="mini-card-label">Tasks Complete</div>
              <div className="mini-card-value">86%</div>
              <div className="mini-card-sub">↑ 12% this week</div>
            </div>
            <div className="hero-card-main">
              <div className="hero-card-header">
                <div className="hero-card-avatar">UT</div>
                <div>
                  <div className="hero-card-title">Dissertation Project</div>
                  <div className="hero-card-sub">Computer Science · Year 3</div>
                </div>
                <span className="hero-card-badge">Active</span>
              </div>
              <div>
                <div className="hero-prog-top"><span className="hero-prog-name">Literature Review</span><span className="hero-prog-pct">92%</span></div>
                <div className="hero-prog-track"><div className="hero-prog-fill" style={{ width: '92%', background: 'linear-gradient(90deg,#0B6E72,#22C4CA)' }}></div></div>
              </div>
              <div>
                <div className="hero-prog-top"><span className="hero-prog-name">Methodology Chapter</span><span className="hero-prog-pct">68%</span></div>
                <div className="hero-prog-track"><div className="hero-prog-fill" style={{ width: '68%', background: 'linear-gradient(90deg,#D4621A,#E8782A)' }}></div></div>
              </div>
              <div>
                <div className="hero-prog-top"><span className="hero-prog-name">Data Collection</span><span className="hero-prog-pct">45%</span></div>
                <div className="hero-prog-track"><div className="hero-prog-fill" style={{ width: '45%', background: 'linear-gradient(90deg,#085A5E,#0B6E72)' }}></div></div>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex' }}>
                  <div className="team-avatar-mini" style={{ background: 'linear-gradient(135deg,#0B6E72,#0F8F96)' }}>JS</div>
                  <div className="team-avatar-mini" style={{ background: 'linear-gradient(135deg,#D4621A,#E8782A)', marginLeft: '-6px' }}>AM</div>
                  <div className="team-avatar-mini" style={{ background: 'linear-gradient(135deg,#364649,#0B6E72)', marginLeft: '-6px' }}>KO</div>
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(200,240,240,0.50)' }}>Due: Apr 1, 2026</span>
                <button className="hero-card-btn">Open →</button>
              </div>
            </div>
            <div className="hero-mini-card card-b">
              <div className="mini-card-label">Team Members</div>
              <div className="mini-card-value" style={{ color: '#F5A060' }}>7</div>
              <div className="mini-card-sub" style={{ color: '#F5A060' }}>3 online now</div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="marquee-section">
        <div className="marquee-label">Trusted by leading universities & institutions</div>
        <div className="marquee-track">
          {[...universities, ...universities].map((uni, i) => (
            <div key={i} className="marquee-item">
              <div className="marquee-logo-box" style={{ background: uni.color }}>{uni.abbr.charAt(0)}</div>
              <span className="marquee-name">{uni.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }} className="reveal">
            <div className="section-tag">Everything You Need</div>
            <h2 className="section-title">Built for <span className="accent">academic</span> collaboration</h2>
            <p className="section-body" style={{ margin: '0 auto' }}>From individual assignments to multi-team dissertations — UniTeam adapts to every academic workflow.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className={`feature-card fc${idx + 1} reveal reveal-delay-${(idx % 3) + 1}`}>
                <div className={`feature-icon fi-${feature.color}`}>
                  <span style={{ fontSize: '22px' }}>{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-bg">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }} className="reveal">
            <div className="section-tag">Simple Process</div>
            <h2 className="section-title">Up and running in <span style={{ color: 'var(--teal-light)' }}>minutes</span></h2>
            <p className="section-body">Four simple steps and your team is collaborating.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card reveal reveal-delay-1"><div className="step-number">01</div><h3 className="step-title">Create Your Account</h3><p className="step-desc">Sign up with your university email. Students, lecturers and admins each have tailored onboarding.</p></div>
            <div className="step-card reveal reveal-delay-2"><div className="step-number">02</div><h3 className="step-title">Set Up a Project</h3><p className="step-desc">Create a project, define milestones, and set submission deadlines in under two minutes.</p></div>
            <div className="step-card reveal reveal-delay-3"><div className="step-number">03</div><h3 className="step-title">Invite Your Team</h3><p className="step-desc">Add teammates by email or share an invite link. Assign roles and permissions instantly.</p></div>
            <div className="step-card reveal reveal-delay-4"><div className="step-number">04</div><h3 className="step-title">Collaborate & Submit</h3><p className="step-desc">Work together, track progress in real time, and submit deliverables directly through UniTeam.</p></div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }} className="reveal">
            <div className="section-tag">Student Stories</div>
            <h2 className="section-title">Loved by <span className="accent">thousands</span></h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className={`testimonial-card ${testimonial.featured ? 'featured' : ''} reveal reveal-delay-${idx + 1}`}>
                <div className="testi-stars">★★★★★</div>
                <p className="testi-quote">{testimonial.quote}</p>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ background: testimonial.featured ? 'rgba(255,255,255,0.20)' : 'linear-gradient(135deg,var(--teal),var(--teal-mid))' }}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="testi-name">{testimonial.name}</div>
                    <div className="testi-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <div className="cta-band">
        <div className="container">
          <h2 className="section-title">Ready to transform your<br />academic projects?</h2>
          <p className="section-body">Join over 12,000 students already collaborating smarter.</p>
          <div className="cta-band-actions">
            <Link to="/signup" className="btn btn-white">Create Free Account →</Link>
            <Link to="/services" className="btn btn-outline-white">Explore Features</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;