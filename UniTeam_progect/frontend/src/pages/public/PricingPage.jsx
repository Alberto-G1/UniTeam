import SeoMeta from '../../components/SeoMeta';

const PricingPage = () => {
  return (
    <section className="public-page">
      <SeoMeta
        title="Pricing"
        description="Review UniTeam pricing options for community, department, and institution use."
        path="/pricing"
      />
      <h1>Pricing</h1>
      <p>Use these starter tiers as placeholders until your final commercial plan is defined.</p>
      <div className="public-grid">
        <article className="public-card">
          <h3>Community</h3>
          <p><strong>Free</strong></p>
          <p>Small teams, limited projects, essential collaboration features.</p>
        </article>
        <article className="public-card">
          <h3>Department</h3>
          <p><strong>Contact Sales</strong></p>
          <p>Full dashboards, governance controls, and multi-course visibility.</p>
        </article>
        <article className="public-card">
          <h3>Institution</h3>
          <p><strong>Enterprise</strong></p>
          <p>Custom onboarding, SSO integration, and reporting support.</p>
        </article>
      </div>
    </section>
  );
};

export default PricingPage;
