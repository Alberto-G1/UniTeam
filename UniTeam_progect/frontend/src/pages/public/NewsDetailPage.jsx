import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SeoMeta from '../../components/SeoMeta';
import { publicAPI } from '../../services/api';

const NewsDetailPage = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await publicAPI.getNewsBySlug(slug);
        setItem(data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Unable to load this announcement.');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [slug]);

  if (loading) {
    return (
      <section className="public-page">
        <p>Loading announcement...</p>
      </section>
    );
  }

  if (error || !item) {
    return (
      <section className="public-page">
        <h1>Announcement Not Found</h1>
        <p className="public-error">{error || 'This news article is not available.'}</p>
        <Link to="/news" className="public-btn ghost">Back to News</Link>
      </section>
    );
  }

  return (
    <section className="public-page">
      <SeoMeta
        title={item.title}
        description={item.excerpt || item.content.slice(0, 160)}
        path={`/news/${item.slug}`}
        image={item.cover_image_url || '/favicon.ico'}
        type="article"
      />

      <Link to="/news" className="public-btn ghost">Back to News</Link>
      <p className="public-news-date">{new Date(item.published_at).toLocaleDateString()}</p>
      <h1>{item.title}</h1>
      {item.excerpt && <p>{item.excerpt}</p>}
      <article className="public-news-content">
        {item.content.split('\n').map((paragraph, index) => (
          <p key={`${item.slug}-paragraph-${index}`}>{paragraph}</p>
        ))}
      </article>
    </section>
  );
};

export default NewsDetailPage;
