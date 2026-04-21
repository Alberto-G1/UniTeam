// src/pages/public/ServicesPage.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ServicesPage.css';

const ServicesPage = () => {
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

  const services = [
    { icon: '✓', title: 'Task & Project Management', desc: 'Create projects, assign tasks, set deadlines, and track progress with a visual dashboard built for academic timelines.', color: 'teal', features: ['Kanban & list views', 'Deadline reminders & alerts', 'Sub-tasks & dependencies', 'Priority tagging'] },
    { icon: '👥', title: 'Team Collaboration', desc: 'Invite students, lecturers, and supervisors to shared workspaces with granular role-based permissions.', color: 'orange', features: ['Role-based access control', 'Real-time comments & mentions', 'Activity feed & history', 'Team messaging channels'] },
    { icon: '📁', title: 'File & Submission Management', desc: 'A structured file system for every project. Upload drafts, receive feedback, and submit final work — all in one place.', color: 'teal', features: ['Versioned document history', 'In-line annotations & comments', 'Submission receipts & timestamps', 'Plagiarism check integration'] },
    { icon: '📊', title: 'Analytics & Reporting', desc: 'Lecturers and admins get powerful dashboards to track project health, participation, and compliance across all groups.', color: 'brown', features: ['Per-project completion metrics', 'Individual contribution reports', 'Deadline compliance overview', 'Exportable PDF/CSV reports'] },
  ];

  return (
    <>
      <div className="page-hero section-sm">
        <div className="container-narrow">
          <div className="section-tag">What We Offer</div>
          <h1 className="section-title">Every tool your <span className="accent">team needs</span></h1>
          <p className="section-body">UniTeam bundles everything academic teams need into one clean, connected platform.</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--page-bg)', paddingTop: '24px' }}>
        <div className="container">
          <div className="services-grid">
            {services.map((service, idx) => (
              <div key={idx} className={`service-card sc${idx + 1} reveal reveal-delay-${(idx % 3) + 1}`}>
                <div className={`service-icon fi-${service.color}`}>
                  <span style={{ fontSize: '26px' }}>{service.icon}</span>
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-desc">{service.desc}</p>
                <div className="service-features">
                  {service.features.map((feature, fIdx) => (
                    <div key={fIdx} className="service-feat">{feature}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section" style={{ background: 'var(--section-alt)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }} className="reveal">
            <div className="section-tag">Pricing Plans</div>
            <h2 className="section-title">Simple, <span className="accent">transparent</span> pricing</h2>
            <p className="section-body" style={{ margin: '0 auto' }}>Start free and scale as your team grows. No hidden fees, ever.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card reveal reveal-delay-1">
              <div className="pricing-plan">Starter</div>
              <div className="pricing-price">Free</div>
              <div className="pricing-period">Forever, no credit card needed</div>
              <div className="pricing-divider"></div>
              <ul className="pricing-features">
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Up to 3 projects</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>5 team members</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>500MB file storage</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Basic analytics</li>
              </ul>
              <Link to="/signup" className="btn btn-secondary btn-plan">Get Started Free</Link>
            </div>
            <div className="pricing-card featured reveal reveal-delay-2">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-plan">Pro</div>
              <div className="pricing-price">$9</div>
              <div className="pricing-period">per user / month, billed annually</div>
              <div className="pricing-divider"></div>
              <ul className="pricing-features">
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Unlimited projects</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Unlimited team members</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>20GB file storage</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Advanced analytics</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Priority support</li>
              </ul>
              <Link to="/signup" className="btn btn-plan-white btn-plan">Start Pro Trial</Link>
            </div>
            <div className="pricing-card reveal reveal-delay-3">
              <div className="pricing-plan">Institution</div>
              <div className="pricing-price">$49</div>
              <div className="pricing-period">per department / month</div>
              <div className="pricing-divider"></div>
              <ul className="pricing-features">
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Everything in Pro</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>SSO / LMS integration</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Dedicated account manager</li>
                <li><div className="pf-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Custom reporting</li>
              </ul>
              <Link to="/contact" className="btn btn-primary btn-plan">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <div className="cta-band">
        <div className="container">
          <h2 className="section-title">Ready to get <br />your team started?</h2>
          <p className="section-body">Set up your first project in minutes. No credit card required.</p>
          <div className="cta-band-actions">
            <Link to="/signup" className="btn btn-white">Create Free Account →</Link>
            <Link to="/contact" className="btn btn-outline-white">Contact Sales</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicesPage;