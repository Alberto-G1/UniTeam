import { useState } from 'react';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="public-page">
      <h1>Contact Us</h1>
      <p>Need support or interested in onboarding your institution? Send us a message.</p>

      <form className="public-form" onSubmit={handleSubmit}>
        <input type="text" placeholder="Your name" required />
        <input type="email" placeholder="Email address" required />
        <select defaultValue="">
          <option value="" disabled>Select inquiry type</option>
          <option>General</option>
          <option>Institution onboarding</option>
          <option>Technical support</option>
          <option>Partnership</option>
        </select>
        <textarea rows={5} placeholder="Your message" required />
        <button type="submit" className="public-btn">Send Message</button>
      </form>

      {submitted && <p>Thanks. Your message has been captured locally for now. Connect it to backend email/ticketing when ready.</p>}
    </section>
  );
};

export default ContactPage;
