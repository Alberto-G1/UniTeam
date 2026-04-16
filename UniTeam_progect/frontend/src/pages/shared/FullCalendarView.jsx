import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { calendarEventsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import './FullCalendarView.css';

const asList = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

const eventDate = (value) => new Date(value);

const formatDateTime = (value) => {
  const date = new Date(value);
  return date.toLocaleString();
};

const buildBucketKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const colorByType = {
  TASK_DEADLINE: 'phase6-cal-task',
  PROJECT_DEADLINE: 'phase6-cal-project',
  MEETING: 'phase6-cal-meeting',
  MILESTONE: 'phase6-cal-milestone',
  CUSTOM: 'phase6-cal-custom',
};

const FullCalendarView = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month');

  const project = searchParams.get('project');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await calendarEventsAPI.list(project ? { scope: 'project', project } : { scope: 'personal' });
        setEvents(asList(data));
      } catch (error) {
        showToast('error', 'Calendar', 'Unable to load calendar data.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [project, showToast]);

  const groupedByDay = useMemo(() => {
    const buckets = {};
    events.forEach((item) => {
      const key = buildBucketKey(eventDate(item.start_datetime));
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(item);
    });
    return buckets;
  }, [events]);

  if (loading) return <div className="phase6-loading">Loading calendar...</div>;

  return (
    <div className="phase6-calendar-shell">
      <header className="phase6-calendar-head">
        <h1>{project ? 'Project Calendar' : 'Personal Calendar'}</h1>
        <div className="phase6-toggle-group">
          <button type="button" className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week</button>
          <button type="button" className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Month</button>
        </div>
      </header>

      <section className="phase6-panel">
        <div className="phase6-calendar-grid">
          {Object.entries(groupedByDay)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(0, viewMode === 'week' ? 7 : 31)
            .map(([day, items]) => (
              <article key={day} className="phase6-calendar-day">
                <h3>{new Date(day).toDateString()}</h3>
                {items.map((item) => (
                  <div key={`${item.id}-${item.event_type}`} className={`phase6-calendar-chip ${colorByType[item.event_type] || ''}`}>
                    <strong>{item.title}</strong>
                    <small>{formatDateTime(item.start_datetime)}</small>
                  </div>
                ))}
              </article>
            ))}
        </div>
      </section>
    </div>
  );
};

export default FullCalendarView;
