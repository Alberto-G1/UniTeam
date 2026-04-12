import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { notificationsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import ConfirmModal from '../../components/ConfirmModal';
import './Notifications.css';

export default function Notifications() {
  const { showToast } = useToast();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    action: null,
  });

  const openConfirm = ({ title, message, type = 'info', action }) => {
    setConfirmState({ isOpen: true, title, message, type, action });
  };

  const closeConfirm = () => {
    setConfirmState({ isOpen: false, title: '', message: '', type: 'info', action: null });
  };

  const handleConfirm = async () => {
    if (typeof confirmState.action === 'function') {
      await confirmState.action();
    }
    closeConfirm();
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.list();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
    } catch (error) {
      showToast('error', 'Error', 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notificationId) => {
    try {
      await notificationsAPI.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
      );
    } catch (error) {
      showToast('error', 'Error', 'Could not mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      showToast('success', 'Updated', 'All notifications marked as read');
    } catch (error) {
      showToast('error', 'Error', 'Could not mark all notifications as read');
    }
  };

  const filteredNotifications = useMemo(() => {
    const term = query.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesFilter =
        activeFilter === 'all'
        || (activeFilter === 'unread' && !item.is_read)
        || (activeFilter === 'invitation' && String(item.type).includes('INVITATION'))
        || (activeFilter === 'milestone' && item.type === 'MILESTONE')
        || (activeFilter === 'project' && item.type === 'PROJECT');

      const matchesQuery = !term || `${item.title} ${item.message}`.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [notifications, query, activeFilter]);

  const grouped = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const groups = {
      today: [],
      thisWeek: [],
      earlier: [],
    };

    filteredNotifications.forEach((item) => {
      const created = new Date(item.created_at);
      if (created.toDateString() === todayKey) {
        groups.today.push(item);
      } else if (created >= weekAgo) {
        groups.thisWeek.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const rolePrefix = location.pathname.startsWith('/admin/')
    ? '/admin'
    : location.pathname.startsWith('/lecturer/')
      ? '/lecturer'
      : '/student';

  const iconForType = (type) => {
    if (String(type).includes('INVITATION')) return 'fa-envelope';
    if (type === 'MILESTONE') return 'fa-flag-checkered';
    if (type === 'PROJECT') return 'fa-diagram-project';
    return 'fa-bell';
  };

  const renderGroup = (title, items) => {
    if (!items.length) return null;

    return (
      <div className="notifications-group" key={title}>
        <h2>{title}</h2>
        <div className="notifications-list">
          {items.map((item) => (
            <div key={item.id} className={`notification-item ${item.is_read ? 'read' : 'unread'}`}>
              <div className="notification-icon-wrap">
                <i className={`fa-solid ${iconForType(item.type)}`}></i>
              </div>
              <div className="notification-main">
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <div className="notification-meta">
                  <span className="type-pill">{item.type}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                {item.project && (
                  <div className="notification-links">
                    <Link to={`${rolePrefix}/projects/${item.project}`}>Open Project</Link>
                  </div>
                )}
              </div>
              {!item.is_read && (
                <button
                  className="btn-mark-read"
                  onClick={() => openConfirm({
                    title: 'Mark As Read',
                    message: 'Mark this notification as read?',
                    type: 'info',
                    action: () => markRead(item.id),
                  })}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="notifications-page">Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread notification(s)</p>
        </div>
        <button
          className="btn-mark-all"
          onClick={() => openConfirm({
            title: 'Mark All As Read',
            message: 'Mark all notifications as read?',
            type: 'info',
            action: markAllRead,
          })}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </button>
      </div>

      <div className="notifications-controls">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notifications"
          className="notifications-search"
        />
        <div className="notifications-filters">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'invitation', label: 'Invitations' },
            { id: 'milestone', label: 'Milestones' },
            { id: 'project', label: 'Projects' },
          ].map((filter) => (
            <button
              key={filter.id}
              className={activeFilter === filter.id ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="notifications-empty">No notifications yet.</div>
      ) : (
        <div className="notifications-groups">
          {renderGroup('Today', grouped.today)}
          {renderGroup('This Week', grouped.thisWeek)}
          {renderGroup('Earlier', grouped.earlier)}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}
