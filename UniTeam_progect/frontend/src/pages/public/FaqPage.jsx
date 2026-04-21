// src/pages/public/FaqPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './FaqPage.css';

const faqs = [
  { q: 'What is UniTeam and who is it for?', a: 'UniTeam is a collaborative project management platform built specifically for university environments. It\'s designed for students working on group assignments and dissertations, lecturers supervising multiple projects, and admins managing departmental submissions.' },
  { q: 'Is UniTeam free to use?', a: 'Yes! UniTeam offers a free Starter plan that includes up to 3 projects, 5 team members, and 500MB storage — no credit card required. Paid Pro and Institution plans unlock unlimited projects, advanced analytics, and more.' },
  { q: 'Can my lecturer or supervisor access my projects?', a: 'Absolutely. You can invite your lecturer or supervisor with a Supervisor role, giving them read-only or comment access to monitor progress and leave feedback without being able to edit your work.' },
  { q: 'Does UniTeam integrate with Moodle, Blackboard, or Turnitin?', a: 'Yes — our Institution plan includes LMS integrations with Moodle, Blackboard, and Canvas. Turnitin integration is available on all paid plans, allowing direct submission for plagiarism checks from within UniTeam.' },
  { q: 'How secure is my data on UniTeam?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are GDPR compliant and never sell or share student data with third parties.' },
  { q: 'Can I use UniTeam on my phone?', a: 'Yes. UniTeam has native iOS and Android apps. The web app is also fully responsive and works great on mobile browsers, optimised for low-bandwidth environments.' },
  { q: 'How do I get my university set up on UniTeam?', a: 'Contact our institutional sales team via the Contact page. We\'ll set up a demo, create a pilot programme for one department, and provide full onboarding support at no cost during the trial.' },
  { q: 'What happens if I miss a deadline?', a: 'UniTeam sends automated reminders 7 days, 3 days, and 1 day before deadlines. If a deadline is missed, project leaders and supervisors are notified, and the task is flagged in dashboards for review.' },
  { q: 'Can I export my project data?', a: 'Yes. Project leaders can export all project data including tasks, milestones, files, and activity logs as CSV or PDF reports at any time.' },
  { q: 'Does UniTeam support group messaging?', a: 'Yes. Every project has its own team channel for discussions, file sharing, and announcements. There\'s also direct messaging between team members.' },
];

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

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

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <div className="page-hero section-sm">
        <div className="container-narrow">
          <div className="section-tag">Common Questions</div>
          <h1 className="section-title">Frequently Asked <span className="accent">Questions</span></h1>
          <p className="section-body">
            Everything you need to know about UniTeam. Can't find it?{' '}
            <Link to="/contact" style={{ color: 'var(--teal)', fontWeight: 700 }}>Reach out.</Link>
          </p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--page-bg)', paddingTop: '24px' }}>
        <div className="container">
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item reveal reveal-delay-${Math.min(index % 5 + 1, 5)} ${openIndex === index ? 'open' : ''}`} onClick={() => toggleFaq(index)}>
                <div className="faq-question">
                  <span className="faq-q-text">{faq.q}</span>
                  <div className="faq-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div className="faq-answer">
                  <div className="faq-answer-inner">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="cta-band" style={{ padding: '72px 32px' }}>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '36px' }}>Still have questions?</h2>
          <p className="section-body">Our team is happy to help.</p>
          <div className="cta-band-actions">
            <Link to="/contact" className="btn btn-white">Contact Us →</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default FaqPage;