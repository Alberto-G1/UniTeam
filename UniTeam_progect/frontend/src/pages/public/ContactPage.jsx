import { useState } from 'react';
import SeoMeta from '../../components/SeoMeta';
import { publicAPI } from '../../services/api';

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await publicAPI.submitContact(formData);
      setSubmitted(true);
      setTicketRef(response?.ticket?.reference || '');
      setFormData({
        name: '',
        email: '',
        inquiry_type: 'GENERAL',
        subject: '',
        message: '',
      });
    } catch (err) {
      const apiError = err?.response?.data;
      if (typeof apiError === 'string') {
        setError(apiError);
      } else if (apiError?.detail) {
        setError(apiError.detail);
      } else {
        setError('Unable to submit your message at the moment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="public-page">
      <SeoMeta
        title="Contact"
        description="Contact UniTeam for support, onboarding, or partnerships."
        path="/contact"
      />
      <h1>Contact Us</h1>
      <p>Need support or interested in onboarding your institution? Send us a message.</p>

      <form className="public-form" onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange} required />
        <select name="inquiry_type" value={formData.inquiry_type} onChange={handleChange}>
          <option value="GENERAL">General</option>
          <option value="ONBOARDING">Institution onboarding</option>
          <option value="SUPPORT">Technical support</option>
          <option value="PARTNERSHIP">Partnership</option>
        </select>
        <input type="text" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
        <textarea rows={5} name="message" placeholder="Your message" value={formData.message} onChange={handleChange} required />
        <button type="submit" className="public-btn" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {submitted && <p className="public-success">Thanks. Your request was submitted{ticketRef ? ` (Ticket ${ticketRef})` : ''}.</p>}
      {error && <p className="public-error">{error}</p>}
    </section>
  );
};

export default ContactPage;
