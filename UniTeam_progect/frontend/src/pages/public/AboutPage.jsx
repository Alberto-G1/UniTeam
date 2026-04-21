// src/pages/public/AboutPage.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
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

  return (
    <>
      <div className="page-hero section-sm">
        <div className="container-narrow">
          <div className="section-tag">Our Story</div>
          <h1 className="section-title">Built by students, <span className="accent">for students</span></h1>
          <p className="section-body">UniTeam started as a frustrated group project in a university computer lab. Today, it powers academic collaboration across hundreds of universities.</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--page-bg)', paddingTop: '24px' }}>
        <div className="container">
          <div className="about-grid">
            <div className="reveal-left">
              <div className="section-tag">Who We Are</div>
              <h2 className="section-title" style={{ fontSize: '36px' }}>A platform that <span className="accent">understands</span> academic life</h2>
              <p className="section-body">We know what it's like to juggle five subjects, group assignments, submission portals, and supervisor feedback all at once. UniTeam was designed to eliminate the chaos — not add to it.</p>
              <div className="values-grid" style={{ marginTop: '32px' }}>
                <div className="value-item">
                  <div className="value-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <div className="value-title">Trust & Privacy</div>
                    <div className="value-desc">Student data is encrypted and never shared with third parties.</div>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon" style={{ background: 'var(--orange-tint)', color: 'var(--orange)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <div className="value-title">Speed & Simplicity</div>
                    <div className="value-desc">Onboarding takes minutes. No training required.</div>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <div className="value-title">Inclusive Access</div>
                    <div className="value-desc">Works on every device, even with limited bandwidth.</div>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div>
                    <div className="value-title">Continuous Growth</div>
                    <div className="value-desc">New features shipped every month, driven by user feedback.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal-right">
              <div className="about-visual-card">
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px' }}>UniTeam by the numbers</div>
                <div className="about-stat-row">
                  <div className="about-stat"><div className="about-stat-val">12,400+</div><div className="about-stat-lbl">Active Users</div></div>
                  <div className="about-stat"><div className="about-stat-val" style={{ color: 'var(--orange)' }}>340+</div><div className="about-stat-lbl">Universities</div></div>
                  <div className="about-stat"><div className="about-stat-val">98%</div><div className="about-stat-lbl">Satisfaction</div></div>
                  <div className="about-stat"><div className="about-stat-val" style={{ color: 'var(--orange)' }}>2M+</div><div className="about-stat-lbl">Tasks Created</div></div>
                </div>
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '14px' }}>Monthly User Growth</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '60px' }}>
                    <div style={{ flex: 1, background: 'var(--teal-tint)', borderRadius: '4px 4px 0 0', height: '40%' }}></div>
                    <div style={{ flex: 1, background: 'var(--teal-tint)', borderRadius: '4px 4px 0 0', height: '55%' }}></div>
                    <div style={{ flex: 1, background: 'var(--teal-tint)', borderRadius: '4px 4px 0 0', height: '50%' }}></div>
                    <div style={{ flex: 1, background: 'var(--teal-tint)', borderRadius: '4px 4px 0 0', height: '72%' }}></div>
                    <div style={{ flex: 1, background: 'var(--teal-tint)', borderRadius: '4px 4px 0 0', height: '65%' }}></div>
                    <div style={{ flex: 1, background: 'linear-gradient(180deg,#0B6E72,#0F8F96)', borderRadius: '4px 4px 0 0', height: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission/Vision/Goal Section */}
      <section className="section" style={{ background: 'var(--section-alt)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }} className="reveal">
            <div className="section-tag">Our Foundation</div>
            <h2 className="section-title">Mission, Vision &amp; <span className="accent">Goal</span></h2>
            <p className="section-body" style={{ margin: '0 auto' }}>The beliefs and ambitions that drive every decision we make at UniTeam.</p>
          </div>
          <div className="mvg-grid">
            <div className="mvg-card mission reveal reveal-delay-1">
              <div className="mvg-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="mvg-tag">Mission</div>
              <h3 className="mvg-title">To democratise academic collaboration</h3>
              <p className="mvg-body">We exist to give every university student — regardless of location, device, or connectivity — access to professional-grade project management tools that make academic teamwork seamless, transparent, and effective.</p>
            </div>
            <div className="mvg-card vision reveal reveal-delay-2">
              <div className="mvg-icon" style={{ background: 'var(--orange-tint)', color: 'var(--orange)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div className="mvg-tag">Vision</div>
              <h3 className="mvg-title">A future where no student is left behind</h3>
              <p className="mvg-body">We envision a global academic ecosystem where every student and educator operates with full visibility, meaningful accountability, and the confidence that their collaborative work is supported by intelligent, intuitive technology.</p>
            </div>
            <div className="mvg-card goal reveal reveal-delay-3">
              <div className="mvg-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <div className="mvg-tag">Main Goal</div>
              <h3 className="mvg-title">Serve 1 million students by 2028</h3>
              <p className="mvg-body">Our primary goal is to be the default collaboration platform for universities across Africa and the diaspora — reaching 1 million active users, partnering with 1,000 institutions, and reducing missed submission rates by 40%.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <div className="cta-band">
        <div className="container">
          <h2 className="section-title">Ready to start your <br />academic journey?</h2>
          <p className="section-body">Join over 12,000 students already collaborating smarter with UniTeam.</p>
          <div className="cta-band-actions">
            <Link to="/signup" className="btn btn-white">Create Free Account →</Link>
            <Link to="/services" className="btn btn-outline-white">Explore Features</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;