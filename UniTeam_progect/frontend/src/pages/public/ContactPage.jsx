// src/pages/public/ContactPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketRef, setTicketRef] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiry_type: 'GENERAL',
    subject: '',
    message: '',
  });

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      setTicketRef('TICKET-' + Math.floor(Math.random() * 10000));
      setFormData({
        name: '',
        email: '',
        inquiry_type: 'GENERAL',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError('Unable to submit your message at the moment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-hero section-sm">
        <div className="container-narrow">
          <div className="section-tag">Get In Touch</div>
          <h1 className="section-title">We'd love to <span className="accent">hear from you</span></h1>
          <p className="section-body">Whether you're a student, lecturer, or university admin — we're ready to help you get started.</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--page-bg)', paddingTop: '24px' }}>
        <div className="container">
          <div className="contact-grid">
            <div className="reveal-left">
              <div className="section-tag">Contact Info</div>
              <h2 className="section-title" style={{ fontSize: '32px' }}>Let's start a <span className="accent">conversation</span></h2>
              <p className="section-body">Fill in the form or reach out directly. We typically respond within 2 business hours.</p>
              <div style={{ marginTop: '32px' }}>
                <div className="contact-detail">
                  <div className="contact-detail-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <div className="contact-detail-label">Email</div>
                    <div className="contact-detail-val">hello@uniteam.app</div>
                  </div>
                </div>
                <div className="contact-detail">
                  <div className="contact-detail-icon" style={{ background: 'var(--orange-tint)', color: 'var(--orange)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <div className="contact-detail-label">Phone</div>
                    <div className="contact-detail-val">+256 700 123 456</div>
                  </div>
                </div>
                <div className="contact-detail">
                  <div className="contact-detail-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <div className="contact-detail-label">Office</div>
                    <div className="contact-detail-val">Kampala Innovation Hub, Uganda</div>
                  </div>
                </div>
                <div className="contact-detail">
                  <div className="contact-detail-icon" style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <div className="contact-detail-label">Response Time</div>
                    <div className="contact-detail-val">Within 2 business hours</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-card reveal-right">
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px', letterSpacing: '-0.4px' }}>Send Us a Message</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>We'll get back to you faster than your group chat.</p>
              
              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h4>Message Sent Successfully!</h4>
                  <p>Thanks for reaching out. {ticketRef && `Your reference number is ${ticketRef}.`} We'll get back to you within 2 business hours.</p>
                  <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Send Another Message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input className="form-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input className="form-input" type="text" name="last_name" placeholder="Smith" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input className="form-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@university.edu" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">I am a...</label>
                    <select className="form-input" name="inquiry_type" value={formData.inquiry_type} onChange={handleChange}>
                      <option value="GENERAL">General Inquiry</option>
                      <option value="STUDENT">Student</option>
                      <option value="LECTURER">Lecturer / Supervisor</option>
                      <option value="ADMIN">University Administrator</option>
                      <option value="PARTNERSHIP">Partnership</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input className="form-input" type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="What is this regarding?" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message *</label>
                    <textarea className="form-input form-textarea" name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Tell us how we can help..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: '14px', padding: '14px' }} disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Message'} 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </form>
              )}
              {error && <p className="public-error">{error}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <div className="cta-band">
        <div className="container">
          <h2 className="section-title">We'll get back to <br />you in no time</h2>
          <p className="section-body">Our team is based in Kampala and responds within 2 business hours on weekdays.</p>
          <div className="cta-band-actions">
            <Link to="/services" className="btn btn-white">Explore Features →</Link>
            <Link to="/about" className="btn btn-outline-white">About UniTeam</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;