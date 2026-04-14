import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import { communicationAPI, projectsAPI, taskAPI } from '../../services/api';
import './CommunicationWorkspace.css';

const tabs = ['announcements', 'channels', 'dm', 'meetings'];

const asList = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const displayName = (user) => {
  if (!user) return 'Unknown';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return full || user.username || 'Unknown';
};

const CommunicationWorkspace = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('announcements');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [announcements, setAnnouncements] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messages, setMessages] = useState([]);
  const [meetingPolls, setMeetingPolls] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);

  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [announcementForm, setAnnouncementForm] = useState('');
  const [channelForm, setChannelForm] = useState('');
  const [messageForm, setMessageForm] = useState('');
  const [dmRecipientId, setDmRecipientId] = useState('');
  const [dmForm, setDmForm] = useState('');

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingFormat, setMeetingFormat] = useState('IN_PERSON');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDeadline, setMeetingDeadline] = useState('');

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const selectedChannel = useMemo(
    () => channels.find((channel) => String(channel.id) === String(selectedChannelId)),
    [channels, selectedChannelId]
  );

  const canPostAnnouncements = useMemo(() => {
    if (!selectedProject || !user) return false;
    const membership = selectedProject?.team_members?.find((item) => item.user?.id === user.id || item.user_id === user.id);
    return Boolean(membership && ['LEADER', 'CO_LEADER'].includes(membership.role));
  }, [selectedProject, user]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsAPI.list();
        const list = asList(data);
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      } catch (error) {
        showToast('error', 'Communication', 'Unable to load projects.');
      }
    };

    loadProjects();
  }, [selectedProjectId, showToast]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProjectId) return;

      try {
        const [announcementData, channelData, pollData, taskData, teamData] = await Promise.all([
          communicationAPI.listAnnouncements({ project: selectedProjectId }),
          communicationAPI.listChannels({ project: selectedProjectId }),
          communicationAPI.listMeetingPolls({ project: selectedProjectId }),
          taskAPI.listTasks({ project: selectedProjectId }),
          projectsAPI.getTeam(selectedProjectId),
        ]);

        const nextChannels = asList(channelData);
        setAnnouncements(asList(announcementData));
        setChannels(nextChannels);
        setMeetingPolls(asList(pollData));
        setTasks(asList(taskData));

        const nextMembers = teamData?.members || [];
        setMembers(nextMembers);

        if (nextChannels.length && !selectedChannelId) {
          const general = nextChannels.find((item) => item.slug === 'general') || nextChannels[0];
          setSelectedChannelId(String(general.id));
        }
      } catch (error) {
        showToast('error', 'Communication', 'Unable to load communication data.');
      }
    };

    loadProjectData();
  }, [selectedProjectId, selectedChannelId, showToast]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChannelId) {
        setMessages([]);
        return;
      }
      try {
        const data = await communicationAPI.listMessages({ channel: selectedChannelId });
        setMessages(asList(data));
      } catch (error) {
        showToast('error', 'Channel', 'Unable to load messages.');
      }
    };

    loadMessages();
  }, [selectedChannelId, showToast]);

  useEffect(() => {
    const loadDMs = async () => {
      if (!selectedProjectId) {
        setDirectMessages([]);
        return;
      }
      try {
        const data = await communicationAPI.listDirectMessages({ project: selectedProjectId });
        setDirectMessages(asList(data));
      } catch (error) {
        setDirectMessages([]);
      }
    };

    loadDMs();
  }, [selectedProjectId]);

  const refreshAnnouncements = async () => {
    if (!selectedProjectId) return;
    const data = await communicationAPI.listAnnouncements({ project: selectedProjectId });
    setAnnouncements(asList(data));
  };

  const refreshChannels = async () => {
    if (!selectedProjectId) return;
    const data = await communicationAPI.listChannels({ project: selectedProjectId });
    const list = asList(data);
    setChannels(list);
  };

  const refreshMessages = async () => {
    if (!selectedChannelId) return;
    const data = await communicationAPI.listMessages({ channel: selectedChannelId });
    setMessages(asList(data));
  };

  const refreshMeetings = async () => {
    if (!selectedProjectId) return;
    const data = await communicationAPI.listMeetingPolls({ project: selectedProjectId });
    setMeetingPolls(asList(data));
  };

  const handleCreateAnnouncement = async () => {
    if (!selectedProjectId || !announcementForm.trim()) return;
    try {
      await communicationAPI.createAnnouncement({ project: selectedProjectId, content: announcementForm.trim() });
      setAnnouncementForm('');
      await refreshAnnouncements();
      showToast('success', 'Announcement', 'Announcement posted successfully.');
    } catch (error) {
      showToast('error', 'Announcement', error.response?.data?.detail || 'Could not post announcement.');
    }
  };

  const handleCreateChannel = async () => {
    if (!selectedProjectId || !channelForm.trim()) return;
    try {
      await communicationAPI.createChannel({ project: selectedProjectId, name: channelForm.trim(), channel_type: 'DISCUSSION' });
      setChannelForm('');
      await refreshChannels();
      showToast('success', 'Channel', 'Custom channel created.');
    } catch (error) {
      showToast('error', 'Channel', error.response?.data?.detail || 'Could not create channel.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChannelId || !messageForm.trim()) return;
    try {
      await communicationAPI.createMessage({ channel: selectedChannelId, content: messageForm.trim() });
      setMessageForm('');
      await refreshMessages();
    } catch (error) {
      showToast('error', 'Message', 'Could not send message.');
    }
  };

  const handleSendDM = async () => {
    if (!selectedProjectId || !dmRecipientId || !dmForm.trim()) return;
    try {
      await communicationAPI.createDirectMessage({
        project: selectedProjectId,
        recipient_id: dmRecipientId,
        content: dmForm.trim(),
      });
      setDmForm('');
      const data = await communicationAPI.listDirectMessages({ project: selectedProjectId });
      setDirectMessages(asList(data));
    } catch (error) {
      showToast('error', 'Direct Message', error.response?.data?.detail || 'Could not send direct message.');
    }
  };

  const handleCreateMeetingPoll = async () => {
    if (!selectedProjectId || !meetingTitle.trim() || !meetingDeadline) return;
    try {
      await communicationAPI.createMeetingPoll({
        project: selectedProjectId,
        title: meetingTitle.trim(),
        description: meetingDescription.trim(),
        meeting_format: meetingFormat,
        meeting_link: meetingFormat === 'ONLINE' ? meetingLink : '',
        response_deadline: meetingDeadline,
      });
      setMeetingTitle('');
      setMeetingDescription('');
      setMeetingLink('');
      setMeetingDeadline('');
      await refreshMeetings();
      showToast('success', 'Meetings', 'Meeting poll created. Add slots from backend actions for now.');
    } catch (error) {
      showToast('error', 'Meetings', error.response?.data?.detail || 'Could not create meeting poll.');
    }
  };

  const memberOptions = members
    .map((item) => item.user)
    .filter(Boolean)
    .filter((member) => member.id !== user?.id);

  return (
    <div className="communication-shell">
      <div className="communication-topbar">
        <h1>Communication Hub</h1>
        <div className="project-picker">
          <label htmlFor="communication-project">Project</label>
          <select
            id="communication-project"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="communication-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dm' ? 'Direct Messages' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'announcements' && (
        <section className="communication-panel">
          <div className="compose-box">
            <textarea
              rows={4}
              value={announcementForm}
              onChange={(event) => setAnnouncementForm(event.target.value)}
              placeholder="Post a project announcement..."
              disabled={!canPostAnnouncements}
            />
            <button type="button" onClick={handleCreateAnnouncement} disabled={!canPostAnnouncements}>Post Announcement</button>
          </div>
          <div className="stream-list">
            {announcements.map((item) => (
              <article key={item.id} className="stream-card announcement">
                <header>
                  <strong>{displayName(item.author)}</strong>
                  <small>{formatDate(item.created_at)}</small>
                </header>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'channels' && (
        <section className="communication-grid">
          <aside className="channels-sidebar">
            <div className="compose-inline">
              <input
                value={channelForm}
                onChange={(event) => setChannelForm(event.target.value)}
                placeholder="New custom channel"
              />
              <button type="button" onClick={handleCreateChannel}>Create</button>
            </div>
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className={String(channel.id) === String(selectedChannelId) ? 'active' : ''}
                onClick={() => setSelectedChannelId(String(channel.id))}
              >
                #{channel.slug}
              </button>
            ))}
          </aside>

          <div className="channel-main">
            <header>
              <h3>#{selectedChannel?.slug || 'channel'}</h3>
              <p>Use @username or @&#123;First Last&#125; to mention members.</p>
            </header>
            <div className="stream-list">
              {messages.map((message) => (
                <article key={message.id} className="stream-card">
                  <header>
                    <strong>{displayName(message.sender)}</strong>
                    <small>{formatDate(message.created_at)}{message.edited_at ? ' (edited)' : ''}</small>
                  </header>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
            <div className="compose-box">
              <textarea
                rows={3}
                value={messageForm}
                onChange={(event) => setMessageForm(event.target.value)}
                placeholder="Type a message..."
              />
              <button type="button" onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'dm' && (
        <section className="communication-panel">
          <div className="compose-row">
            <select value={dmRecipientId} onChange={(event) => setDmRecipientId(event.target.value)}>
              <option value="">Select teammate</option>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>{displayName(member)}</option>
              ))}
            </select>
            <input
              value={dmForm}
              onChange={(event) => setDmForm(event.target.value)}
              placeholder="Type private message"
            />
            <button type="button" onClick={handleSendDM}>Send</button>
          </div>

          <div className="stream-list">
            {directMessages.map((dm) => (
              <article key={dm.id} className="stream-card dm">
                <header>
                  <strong>{displayName(dm.sender)} to {displayName(dm.recipient)}</strong>
                  <small>{formatDate(dm.created_at)}</small>
                </header>
                <p>{dm.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'meetings' && (
        <section className="communication-panel">
          <div className="compose-box">
            <input
              value={meetingTitle}
              onChange={(event) => setMeetingTitle(event.target.value)}
              placeholder="Meeting title"
            />
            <textarea
              rows={3}
              value={meetingDescription}
              onChange={(event) => setMeetingDescription(event.target.value)}
              placeholder="Meeting description"
            />
            <div className="compose-row">
              <select value={meetingFormat} onChange={(event) => setMeetingFormat(event.target.value)}>
                <option value="IN_PERSON">In person</option>
                <option value="ONLINE">Online</option>
              </select>
              <input
                type="datetime-local"
                value={meetingDeadline}
                onChange={(event) => setMeetingDeadline(event.target.value)}
              />
            </div>
            {meetingFormat === 'ONLINE' && (
              <input
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                placeholder="Meeting link"
              />
            )}
            <button type="button" onClick={handleCreateMeetingPoll}>Create Poll</button>
          </div>

          <div className="stream-list">
            {meetingPolls.map((poll) => (
              <article key={poll.id} className="stream-card meeting">
                <header>
                  <strong>{poll.title}</strong>
                  <small>{formatDate(poll.created_at)}</small>
                </header>
                <p>{poll.description || 'No description provided.'}</p>
                <p>Format: {poll.meeting_format === 'ONLINE' ? 'Online' : 'In person'}</p>
                <p>Deadline: {formatDate(poll.response_deadline)}</p>
                <p>Slots: {(poll.slots || []).length}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!selectedProjectId && <p className="communication-hint">Select a project to start collaboration.</p>}
      {selectedProject && (
        <p className="communication-hint">
          Connected tasks in this project: {tasks.length}. Mention with @username and reference task IDs directly for now.
        </p>
      )}
    </div>
  );
};

export default CommunicationWorkspace;
