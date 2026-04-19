import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <section className="public-page">
      <div className="public-hero">
        <h1>Open Project Collaboration for University Teams</h1>
        <p>UniTeam helps students, lecturers, and admins coordinate tasks, milestones, files, meetings, and submissions in one system.</p>
        <div>
          <Link to="/signup" className="public-btn">Create Account</Link>
        </div>
      </div>

      <div className="public-grid">
        <article className="public-card">
          <h3>Plan Better</h3>
          <p>Build project boards, sections, deadlines, and milestones with smart tracking.</p>
        </article>
        <article className="public-card">
          <h3>Collaborate Faster</h3>
          <p>Use channels, announcements, direct messages, and meeting polls to stay synced.</p>
        </article>
        <article className="public-card">
          <h3>Submit Confidently</h3>
          <p>Use submission checklists and lecturer dashboards to reduce last-minute surprises.</p>
        </article>
      </div>
    </section>
  );
};

export default HomePage;
