import SeoMeta from '../../components/SeoMeta';

const AboutPage = () => {
  return (
    <section className="public-page">
      <SeoMeta
        title="About"
        description="Learn about UniTeam's mission and how it supports university project collaboration."
        path="/about"
      />
      <h1>About UniTeam</h1>
      <p>UniTeam is designed for academic project delivery. It brings structure, visibility, and accountability to student team work.</p>
      <div className="public-grid">
        <article className="public-card">
          <h3>Our Mission</h3>
          <p>Make university collaboration transparent, fair, and manageable for everyone involved.</p>
        </article>
        <article className="public-card">
          <h3>Who It Serves</h3>
          <p>Students, team leaders, lecturers, supervisors, and university administrators.</p>
        </article>
        <article className="public-card">
          <h3>Core Values</h3>
          <p>Clarity, reliability, accountability, and student-centered collaboration.</p>
        </article>
      </div>
    </section>
  );
};

export default AboutPage;
