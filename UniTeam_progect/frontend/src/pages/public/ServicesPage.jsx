const ServicesPage = () => {
  return (
    <section className="public-page">
      <h1>Services</h1>
      <div className="public-grid">
        <article className="public-card">
          <h3>Student Workspaces</h3>
          <p>Task board, personal dashboard, file library, and communication tools.</p>
        </article>
        <article className="public-card">
          <h3>Lecturer Oversight</h3>
          <p>Risk detection, contribution visibility, and submission readiness monitoring.</p>
        </article>
        <article className="public-card">
          <h3>Template Management</h3>
          <p>Reusable project templates with milestone blueprints for faster project setup.</p>
        </article>
        <article className="public-card">
          <h3>Notifications & Alerts</h3>
          <p>Real-time updates and digest support for deadlines and project progress.</p>
        </article>
      </div>
    </section>
  );
};

export default ServicesPage;
