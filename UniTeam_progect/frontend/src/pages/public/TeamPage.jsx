import SeoMeta from '../../components/SeoMeta';

const teamMembers = [
  { name: 'Product Team', role: 'Roadmap & Research', description: 'Defines academic workflows and user requirements.' },
  { name: 'Engineering Team', role: 'Platform Development', description: 'Builds backend APIs, dashboard analytics, and frontend UX.' },
  { name: 'Academic Advisors', role: 'Education Domain Experts', description: 'Ensure project features map to real classroom and capstone needs.' },
];

const TeamPage = () => {
  return (
    <section className="public-page">
      <SeoMeta
        title="Team"
        description="Meet the UniTeam team building collaboration tools for academic projects."
        path="/team"
      />
      <h1>The Team</h1>
      <p>UniTeam is built by a cross-functional team blending software engineering and education operations.</p>
      <div className="public-grid">
        {teamMembers.map((member) => (
          <article key={member.name} className="public-card">
            <h3>{member.name}</h3>
            <p><strong>{member.role}</strong></p>
            <p>{member.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TeamPage;
