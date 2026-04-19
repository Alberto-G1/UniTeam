import SeoMeta from '../../components/SeoMeta';

const roles = [
  'Frontend Engineer (React)',
  'Backend Engineer (Django)',
  'QA Engineer',
  'Academic Product Analyst',
];

const CareersPage = () => {
  return (
    <section className="public-page">
      <SeoMeta
        title="Careers"
        description="Explore open roles and careers at UniTeam."
        path="/careers"
      />
      <h1>Careers</h1>
      <p>Join the team building student collaboration infrastructure.</p>
      <div className="public-list">
        {roles.map((role) => (
          <article key={role} className="public-card">
            <h3>{role}</h3>
            <p>Remote-friendly. Education-focused impact. Contact us via the Contact page.</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CareersPage;
