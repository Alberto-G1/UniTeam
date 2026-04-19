import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SeoMeta from '../../components/SeoMeta';
import { publicAPI } from '../../services/api';

const NewsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await publicAPI.listNews();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Unable to load announcements right now.');
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  return (
    <section className="public-page">
      <SeoMeta
        title="News"
        description="Read the latest UniTeam announcements, releases, and updates."
        path="/news"
      />
      <h1>Blog & News</h1>
      <p>Latest platform announcements, release notes, and academic collaboration updates.</p>

      {loading && <p>Loading latest updates...</p>}
      {error && <p className="public-error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p>No announcements have been published yet.</p>
      )}

      <div className="public-list">
        {items.map((item) => (
          <article key={item.id} className="public-card public-news-card">
            <p className="public-news-date">{new Date(item.published_at).toLocaleDateString()}</p>
            <h3>{item.title}</h3>
            <p>{item.excerpt || 'Read the full announcement for details.'}</p>
            <Link to={`/news/${item.slug}`} className="public-btn ghost">Read More</Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default NewsPage;
