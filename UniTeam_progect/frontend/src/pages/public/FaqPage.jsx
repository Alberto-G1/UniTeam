const faqs = [
  { q: 'Can non-students use UniTeam?', a: 'Yes. UniTeam is now open as a public platform with role-based access.' },
  { q: 'Do lecturers need approval?', a: 'Yes, lecturer approval remains enforced by the backend authentication policy.' },
  { q: 'Can teams archive projects?', a: 'Yes. Leaders can submit and archive projects according to lifecycle rules.' },
  { q: 'Does UniTeam support communication tools?', a: 'Yes. It includes announcements, channels, direct messages, and meeting polls.' },
];

const FaqPage = () => {
  return (
    <section className="public-page">
      <h1>Frequently Asked Questions</h1>
      <div className="public-list">
        {faqs.map((item) => (
          <article key={item.q} className="public-card">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FaqPage;
