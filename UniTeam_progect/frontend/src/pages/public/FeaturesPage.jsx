const features = [
  'Role-based dashboards with personal and project insights',
  'Task board with sections, priorities, and progress tracking',
  'File library with versioning, restore, and quota warnings',
  'Integrated communication with channels and meeting workflows',
  'Submission checklist and project lifecycle controls',
  'Lecturer monitoring with risk alerts and readiness comparison',
];

const FeaturesPage = () => {
  return (
    <section className="public-page">
      <h1>Platform Features</h1>
      <div className="public-list">
        {features.map((feature) => (
          <article key={feature} className="public-card">
            <p>{feature}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturesPage;
