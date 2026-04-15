import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import { communicationAPI, projectsAPI, taskAPI } from '../../services/api';
import './CommunicationWorkspace.css';

const tabs = ['announcements', 'channels', 'dm', 'meetings', 'notifications'];
const reactionChoices = [':thumbsup:', ':check:', ':eyes:', ':question:', ':party:'];
const channelModeOptions = [
  { value: 'ALL', label: 'All messages' },
  { value: 'MENTIONS', label: 'Only mentions' },
  { value: 'MUTED', label: 'Muted' },
];
const availabilityOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IF_NEEDED', label: 'If needed' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
];

const asList = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);
const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const displayName = (user) => {
  if (!user) return 'Unknown';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return full || user.username || 'Unknown';
};

const getMembership = (memberships, userId) => memberships.find((item) => item?.user?.id === userId || item?.user_id === userId);

const isLeadershipRole = (role) => ['LEADER', 'CO_LEADER'].includes(role);

const defaultNotificationPref = (type) => ({
  notification_type: type,
  in_app_enabled: true,
  email_enabled: true,
  email_frequency: 'DIGEST',
});

const CommunicationWorkspace = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('announcements');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [memberships, setMemberships] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [announcements, setAnnouncements] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [messageTaskIds, setMessageTaskIds] = useState([]);
  const [messageFile, setMessageFile] = useState(null);
  const [replyParentId, setReplyParentId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');

  const [channelDraft, setChannelDraft] = useState('');
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [announcementFile, setAnnouncementFile] = useState(null);
  const [announcementTaskTitle, setAnnouncementTaskTitle] = useState('');
  const [announcementTaskDeadline, setAnnouncementTaskDeadline] = useState('');
  const [announcementTaskAssigneeId, setAnnouncementTaskAssigneeId] = useState('');

  const [directMessages, setDirectMessages] = useState([]);
  const [dmRecipientId, setDmRecipientId] = useState('');
  const [dmDraft, setDmDraft] = useState('');

  const [meetingPolls, setMeetingPolls] = useState([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingFormat, setMeetingFormat] = useState('IN_PERSON');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDeadline, setMeetingDeadline] = useState('');
  const [newSlotByPoll, setNewSlotByPoll] = useState({});
  const [newMeetingNoteByPoll, setNewMeetingNoteByPoll] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState([]);
  const [channelPrefs, setChannelPrefs] = useState([]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const selectedChannel = useMemo(
    () => channels.find((item) => String(item.id) === String(selectedChannelId)),
    [channels, selectedChannelId]
  );

  const currentMembership = useMemo(
    () => getMembership(memberships, user?.id),
    [memberships, user?.id]
  );

  const currentRole = currentMembership?.role || selectedProject?.current_membership?.role || null;
  const isLeadership = isLeadershipRole(currentRole);
  const isLecturerReadOnly = user?.role === 'LECTURER';
  const canPostAnnouncements = isLeadership && !isLecturerReadOnly;
  const canPostMessages = !isLecturerReadOnly;

  const memberOptions = useMemo(
    () => memberships.map((membership) => membership.user).filter(Boolean),
    [memberships]
  );

  const dmMemberOptions = useMemo(
    () => memberOptions.filter((member) => member.id !== user?.id),
    [memberOptions, user?.id]
  );

  const currentChannelPref = useMemo(
    () => channelPrefs.find((pref) => String(pref.channel) === String(selectedChannelId)) || null,
    [channelPrefs, selectedChannelId]
  );

  const messageTree = useMemo(() => {
    const roots = messages.filter((item) => !item.parent_message);
    const repliesByParent = new Map();
    messages.forEach((item) => {
      if (!item.parent_message) return;
      const bucket = repliesByParent.get(item.parent_message) || [];
      bucket.push(item);
      repliesByParent.set(item.parent_message, bucket);
    });

    return roots.map((root) => ({
      root,
      replies: (repliesByParent.get(root.id) || []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));
  }, [messages]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsAPI.list();
        const list = asList(data);
        setProjects(list);
        if (!selectedProjectId && list.length) {
          setSelectedProjectId(String(list[0].id));
        }
      } catch (error) {
        showToast('error', 'Communication', 'Unable to load projects.');
      }
    };

    loadProjects();
  }, [selectedProjectId, showToast]);

  useEffect(() => {
    setSelectedChannelId('');
    setMessages([]);
    setMessageDraft('');
    setReplyParentId(null);
    setEditingMessageId(null);
  }, [selectedProjectId]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProjectId) return;

      try {
        const [announcementData, channelData, meetingData, taskData, teamData, channelPrefData] = await Promise.all([
          communicationAPI.listAnnouncements({ project: selectedProjectId }),
          communicationAPI.listChannels({ project: selectedProjectId }),
          communicationAPI.listMeetingPolls({ project: selectedProjectId }),
          taskAPI.listTasks({ project: selectedProjectId }),
          projectsAPI.getTeam(selectedProjectId),
          communicationAPI.listChannelNotificationPreferences(),
        ]);

        const channelList = asList(channelData);
        const membershipList = asList(teamData?.members || []);

        setAnnouncements(asList(announcementData));
        setChannels(channelList);
        setMeetingPolls(asList(meetingData));
        setTasks(asList(taskData));
        setMemberships(membershipList);
        setChannelPrefs(asList(channelPrefData));

        if (channelList.length) {
          const currentExists = channelList.some((item) => String(item.id) === String(selectedChannelId));
          if (!currentExists) {
            const defaultChannel = channelList.find((item) => item.slug === 'general') || channelList[0];
            setSelectedChannelId(String(defaultChannel.id));
          }
        }
      } catch (error) {
        showToast('error', 'Communication', 'Unable to load communication data for this project.');
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
        const data = await communicationAPI.listMessages({
          channel: selectedChannelId,
          project: selectedProjectId,
        });
        setMessages(asList(data));
      } catch (error) {
        setMessages([]);
        showToast('error', 'Channel', 'Unable to load channel messages.');
      }
    };

    loadMessages();
  }, [selectedChannelId, selectedProjectId, showToast]);

  useEffect(() => {
    const loadDMs = async () => {
      if (!selectedProjectId) {
        setDirectMessages([]);
        return;
      }

      try {
        const params = { project: selectedProjectId };
        if (dmRecipientId) params.with_user = dmRecipientId;
        const data = await communicationAPI.listDirectMessages(params);
        setDirectMessages(asList(data));
      } catch (error) {
        setDirectMessages([]);
      }
    };

    loadDMs();
  }, [selectedProjectId, dmRecipientId]);

  useEffect(() => {
    const loadNotificationsData = async () => {
      try {
        const [notificationData, prefData] = await Promise.all([
          communicationAPI.listNotifications(),
          communicationAPI.listNotificationPreferences(),
        ]);
        setNotifications(asList(notificationData));
        setNotificationPrefs(asList(prefData));
      } catch (error) {
        if (activeTab === 'notifications') {
          showToast('error', 'Notifications', 'Unable to load notifications right now.');
        }
      }
    };

    loadNotificationsData();
  }, [activeTab, showToast]);

  const refreshAnnouncements = async () => {
    if (!selectedProjectId) return;
    const data = await communicationAPI.listAnnouncements({ project: selectedProjectId });
    setAnnouncements(asList(data));
  };

  const refreshChannels = async () => {
    if (!selectedProjectId) return;
    const data = await communicationAPI.listChannels({ project: selectedProjectId });
    setChannels(asList(data));
  };

  const refreshMessages = async () => {
    if (!selectedProjectId || !selectedChannelId) return;
    const data = await communicationAPI.listMessages({ channel: selectedChannelId, project: selectedProjectId });
    setMessages(asList(data));
  };

  const refreshMeetings = async () => {
    if (!selectedProjectId) return;
    const data = await communicationAPI.listMeetingPolls({ project: selectedProjectId });
    setMeetingPolls(asList(data));
  };

  const refreshNotifications = async () => {
    const data = await communicationAPI.listNotifications();
    setNotifications(asList(data));
  };

  const refreshNotificationPrefs = async () => {
    const data = await communicationAPI.listNotificationPreferences();
    setNotificationPrefs(asList(data));
  };

  const refreshChannelPrefs = async () => {
    const data = await communicationAPI.listChannelNotificationPreferences();
    setChannelPrefs(asList(data));
  };

  const handleCreateAnnouncement = async () => {
    if (!selectedProjectId || !announcementDraft.trim() || !canPostAnnouncements) return;

    try {
      let payload = { project: selectedProjectId, content: announcementDraft.trim() };
      if (announcementFile) {
        const formData = new FormData();
        formData.append('project', selectedProjectId);
        formData.append('content', announcementDraft.trim());
        formData.append('attached_file', announcementFile);
        payload = formData;
      }
      await communicationAPI.createAnnouncement(payload);
      setAnnouncementDraft('');
      setAnnouncementFile(null);
      await refreshAnnouncements();
      showToast('success', 'Announcements', 'Announcement posted.');
    } catch (error) {
      showToast('error', 'Announcements', error.response?.data?.detail || 'Could not post announcement.');
    }
  };

  const handleReactAnnouncement = async (announcementId, emoji) => {
    if (isLecturerReadOnly) return;
    try {
      await communicationAPI.reactAnnouncement(announcementId, emoji);
      await refreshAnnouncements();
    } catch (error) {
      showToast('error', 'Announcements', 'Could not react to announcement.');
    }
  };

  const handleConvertAnnouncementToTask = async (announcementId) => {
    if (!announcementTaskDeadline || !canPostAnnouncements) {
      showToast('error', 'Announcements', 'Please set a deadline to convert this announcement to a task.');
      return;
    }

    try {
      await communicationAPI.convertAnnouncementToTask(announcementId, {
        title: announcementTaskTitle || 'Task from announcement',
        deadline: announcementTaskDeadline,
        assigned_to_id: announcementTaskAssigneeId || undefined,
      });
      setAnnouncementTaskTitle('');
      setAnnouncementTaskDeadline('');
      setAnnouncementTaskAssigneeId('');
      showToast('success', 'Announcements', 'Announcement converted to task.');
    } catch (error) {
      showToast('error', 'Announcements', error.response?.data?.error || 'Could not convert announcement to task.');
    }
  };

  const handleCreateChannel = async () => {
    if (!selectedProjectId || !channelDraft.trim() || !isLeadership || isLecturerReadOnly) return;

    try {
      await communicationAPI.createChannel({
        project: selectedProjectId,
        name: channelDraft.trim(),
        channel_type: 'DISCUSSION',
      });
      setChannelDraft('');
      await refreshChannels();
      showToast('success', 'Channels', 'Custom channel created.');
    } catch (error) {
      showToast('error', 'Channels', error.response?.data?.detail || 'Could not create channel.');
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (!channel || channel.is_default || currentRole !== 'LEADER' || isLecturerReadOnly) return;

    try {
      await communicationAPI.deleteChannel(channel.id);
      await refreshChannels();
      showToast('success', 'Channels', 'Channel archived.');
    } catch (error) {
      showToast('error', 'Channels', error.response?.data?.detail || 'Could not delete this channel.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChannelId || !canPostMessages || !messageDraft.trim()) return;

    try {
      const formData = new FormData();
      formData.append('channel', selectedChannelId);
      formData.append('content', messageDraft.trim());
      if (replyParentId) {
        formData.append('parent_message', String(replyParentId));
      }
      if (messageFile) {
        formData.append('file', messageFile);
      }
      messageTaskIds.forEach((taskId) => formData.append('task_ids', String(taskId)));

      await communicationAPI.createMessage(formData);
      setMessageDraft('');
      setMessageFile(null);
      setMessageTaskIds([]);
      setReplyParentId(null);
      await refreshMessages();
    } catch (error) {
      showToast('error', 'Channels', error.response?.data?.detail || 'Could not send message.');
    }
  };

  const beginEditMessage = (message) => {
    setEditingMessageId(message.id);
    setEditingMessageContent(message.content || '');
  };

  const handleSaveMessageEdit = async () => {
    if (!editingMessageId || !editingMessageContent.trim()) return;

    try {
      await communicationAPI.updateMessage(editingMessageId, { content: editingMessageContent.trim() });
      setEditingMessageId(null);
      setEditingMessageContent('');
      await refreshMessages();
    } catch (error) {
      showToast('error', 'Channels', error.response?.data?.detail || 'Could not edit this message.');
    }
  };

  const handleDeleteMessage = async (message) => {
    const canDeleteAny = isLeadership;
    const canDeleteOwn = message?.sender?.id === user?.id;
    if (!canDeleteOwn && !canDeleteAny) return;

    try {
      await communicationAPI.deleteMessage(message.id);
      await refreshMessages();
    } catch (error) {
      showToast('error', 'Channels', error.response?.data?.detail || 'Could not delete this message.');
    }
  };

  const handleReactMessage = async (messageId, emoji) => {
    if (isLecturerReadOnly) return;
    try {
      await communicationAPI.reactMessage(messageId, emoji);
      await refreshMessages();
    } catch (error) {
      showToast('error', 'Channels', 'Could not react to message.');
    }
  };

  const handleChannelModeChange = async (mode) => {
    if (!selectedChannelId) return;

    try {
      if (currentChannelPref) {
        await communicationAPI.updateChannelNotificationPreference(currentChannelPref.id, {
          channel: selectedChannelId,
          mode,
        });
      } else {
        await communicationAPI.createChannelNotificationPreference({ channel: selectedChannelId, mode });
      }
      await refreshChannelPrefs();
      showToast('success', 'Notifications', 'Channel notification mode updated.');
    } catch (error) {
      showToast('error', 'Notifications', 'Could not update channel notification mode.');
    }
  };

  const handleSendDM = async () => {
    if (!selectedProjectId || !dmRecipientId || !dmDraft.trim() || isLecturerReadOnly) return;

    try {
      await communicationAPI.createDirectMessage({
        project: selectedProjectId,
        recipient_id: dmRecipientId,
        content: dmDraft.trim(),
      });
      setDmDraft('');
      const params = { project: selectedProjectId, with_user: dmRecipientId };
      const data = await communicationAPI.listDirectMessages(params);
      setDirectMessages(asList(data));
    } catch (error) {
      showToast('error', 'Direct Messages', error.response?.data?.detail || 'Could not send direct message.');
    }
  };

  const handleCreateMeetingPoll = async () => {
    if (!selectedProjectId || !meetingTitle.trim() || !meetingDeadline || isLecturerReadOnly) return;

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
      showToast('success', 'Meetings', 'Meeting poll created. Add proposed slots now.');
    } catch (error) {
      showToast('error', 'Meetings', error.response?.data?.detail || 'Could not create meeting poll.');
    }
  };

  const handleAddMeetingSlot = async (pollId) => {
    const slotDraft = newSlotByPoll[pollId] || {};
    if (!slotDraft.start || !slotDraft.end) return;

    try {
      await communicationAPI.addMeetingSlot(pollId, {
        poll: pollId,
        start_datetime: slotDraft.start,
        end_datetime: slotDraft.end,
      });
      setNewSlotByPoll((prev) => ({ ...prev, [pollId]: { start: '', end: '' } }));
      await refreshMeetings();
    } catch (error) {
      showToast('error', 'Meetings', error.response?.data?.detail || 'Could not add a meeting slot.');
    }
  };

  const handleVoteSlot = async (pollId, slotId, availability) => {
    if (isLecturerReadOnly) return;

    try {
      await communicationAPI.respondMeetingSlot(pollId, {
        poll: pollId,
        slot: slotId,
        slot_id: slotId,
        availability,
      });
      await refreshMeetings();
    } catch (error) {
      showToast('error', 'Meetings', error.response?.data?.detail || 'Could not submit vote.');
    }
  };

  const handleConfirmSlot = async (pollId, slotId) => {
    if (isLecturerReadOnly) return;

    try {
      await communicationAPI.confirmMeetingSlot(pollId, { slot_id: slotId });
      await refreshMeetings();
      showToast('success', 'Meetings', 'Meeting slot confirmed.');
    } catch (error) {
      showToast('error', 'Meetings', error.response?.data?.detail || 'Could not confirm this slot.');
    }
  };

  const handleAddMeetingNote = async (pollId) => {
    const note = (newMeetingNoteByPoll[pollId] || '').trim();
    if (!note) return;

    try {
      await communicationAPI.addMeetingNotes(pollId, { content: note });
      setNewMeetingNoteByPoll((prev) => ({ ...prev, [pollId]: '' }));
      await refreshMeetings();
    } catch (error) {
      showToast('error', 'Meetings', error.response?.data?.detail || 'Could not add meeting notes.');
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await communicationAPI.markNotificationRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      showToast('error', 'Notifications', 'Could not mark notification as read.');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await communicationAPI.markAllNotificationsRead();
      await refreshNotifications();
    } catch (error) {
      showToast('error', 'Notifications', 'Could not mark all notifications as read.');
    }
  };

  const upsertNotificationPreference = async (nextPref) => {
    const existing = notificationPrefs.find((item) => item.notification_type === nextPref.notification_type);
    if (existing) {
      await communicationAPI.updateNotificationPreference(existing.id, {
        notification_type: nextPref.notification_type,
        in_app_enabled: nextPref.in_app_enabled,
        email_enabled: nextPref.email_enabled,
        email_frequency: nextPref.email_frequency,
      });
    } else {
      await communicationAPI.createNotificationPreference(nextPref);
    }
    await refreshNotificationPrefs();
  };

  const handleTogglePreference = async (type, key, value) => {
    const current = notificationPrefs.find((item) => item.notification_type === type) || defaultNotificationPref(type);
    try {
      await upsertNotificationPreference({ ...current, [key]: value });
    } catch (error) {
      showToast('error', 'Notifications', 'Could not update this notification preference.');
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

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
            {tab === 'notifications' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'announcements' && (
        <section className="communication-panel">
          <div className="compose-box">
            <textarea
              rows={4}
              value={announcementDraft}
              onChange={(event) => setAnnouncementDraft(event.target.value)}
              placeholder="Post a project-wide announcement..."
              disabled={!canPostAnnouncements}
            />
            <input
              type="file"
              onChange={(event) => setAnnouncementFile(event.target.files?.[0] || null)}
              disabled={!canPostAnnouncements}
            />
            <button type="button" onClick={handleCreateAnnouncement} disabled={!canPostAnnouncements}>Post Announcement</button>
            {!canPostAnnouncements && (
              <p className="communication-hint">
                {isLecturerReadOnly ? 'Lecturers can read announcements only.' : 'Only project leaders and co-leaders can post announcements.'}
              </p>
            )}
          </div>

          <div className="stream-list">
            {announcements.map((item) => (
              <article key={item.id} className="stream-card announcement">
                <header>
                  <strong>{displayName(item.author)}</strong>
                  <small>{formatDate(item.created_at)}</small>
                </header>
                <p>{item.content}</p>
                {item.attached_file && (
                  <p>
                    <a href={item.attached_file} target="_blank" rel="noreferrer">Open attachment</a>
                  </p>
                )}

                <div className="compose-inline">
                  <div className="reaction-row">
                    {reactionChoices.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReactAnnouncement(item.id, emoji)}
                        disabled={isLecturerReadOnly}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p>
                    {(item.reactions || []).map((reaction) => reaction.emoji).join(' ') || 'No reactions yet'}
                  </p>
                </div>

                {canPostAnnouncements && (
                  <div className="compose-row">
                    <input
                      value={announcementTaskTitle}
                      onChange={(event) => setAnnouncementTaskTitle(event.target.value)}
                      placeholder="Task title from announcement"
                    />
                    <input
                      type="datetime-local"
                      value={announcementTaskDeadline}
                      onChange={(event) => setAnnouncementTaskDeadline(event.target.value)}
                    />
                    <select
                      value={announcementTaskAssigneeId}
                      onChange={(event) => setAnnouncementTaskAssigneeId(event.target.value)}
                    >
                      <option value="">Assignee (optional)</option>
                      {dmMemberOptions.map((member) => (
                        <option key={member.id} value={member.id}>{displayName(member)}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => handleConvertAnnouncementToTask(item.id)}>Convert to Task</button>
                  </div>
                )}
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
                value={channelDraft}
                onChange={(event) => setChannelDraft(event.target.value)}
                placeholder="New custom channel"
                disabled={!isLeadership || isLecturerReadOnly}
              />
              <button type="button" onClick={handleCreateChannel} disabled={!isLeadership || isLecturerReadOnly}>Create</button>
            </div>

            {channels.map((channel) => (
              <div key={channel.id} className="channel-list-item">
                <button
                  type="button"
                  className={String(channel.id) === String(selectedChannelId) ? 'active' : ''}
                  onClick={() => setSelectedChannelId(String(channel.id))}
                >
                  #{channel.slug}
                </button>
                {!channel.is_default && currentRole === 'LEADER' && !isLecturerReadOnly && (
                  <button type="button" onClick={() => handleDeleteChannel(channel)}>Archive</button>
                )}
              </div>
            ))}
          </aside>

          <div className="channel-main">
            <header>
              <h3>#{selectedChannel?.slug || 'channel'}</h3>
              <p>
                Use @username or @&#123;First Last&#125; to mention teammates, and choose your channel notification mode below.
              </p>
              {!!selectedChannelId && (
                <div className="compose-row">
                  <label htmlFor="channel-mode">Channel notifications</label>
                  <select
                    id="channel-mode"
                    value={currentChannelPref?.mode || (selectedChannel?.slug === 'general' ? 'ALL' : 'MENTIONS')}
                    onChange={(event) => handleChannelModeChange(event.target.value)}
                  >
                    {channelModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </header>

            <div className="stream-list">
              {messageTree.map(({ root, replies }) => {
                const canEditRoot = root.sender?.id === user?.id && !root.is_deleted;
                const canDeleteRoot = canEditRoot || isLeadership;

                return (
                  <article key={root.id} className="stream-card">
                    <header>
                      <strong>{displayName(root.sender)}</strong>
                      <small>{formatDate(root.created_at)}{root.edited_at ? ' (edited)' : ''}</small>
                    </header>

                    {editingMessageId === root.id ? (
                      <div className="compose-inline">
                        <textarea
                          rows={2}
                          value={editingMessageContent}
                          onChange={(event) => setEditingMessageContent(event.target.value)}
                        />
                        <button type="button" onClick={handleSaveMessageEdit}>Save</button>
                        <button type="button" onClick={() => setEditingMessageId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <p>{root.content}</p>
                    )}

                    {(root.task_references || []).length > 0 && (
                      <p>Linked tasks: {(root.task_references || []).map((ref) => `#${ref.task}`).join(', ')}</p>
                    )}

                    {(root.attachments || []).map((attachment) => (
                      <p key={attachment.id}>
                        <a href={attachment.file} target="_blank" rel="noreferrer">{attachment.file_name}</a>
                      </p>
                    ))}

                    <div className="reaction-row">
                      {reactionChoices.map((emoji) => (
                        <button key={emoji} type="button" onClick={() => handleReactMessage(root.id, emoji)} disabled={isLecturerReadOnly}>{emoji}</button>
                      ))}
                      <span>{(root.reactions || []).map((reaction) => reaction.emoji).join(' ')}</span>
                    </div>

                    <div className="message-actions">
                      <button type="button" onClick={() => setReplyParentId(root.id)} disabled={isLecturerReadOnly}>Reply</button>
                      {canEditRoot && <button type="button" onClick={() => beginEditMessage(root)}>Edit</button>}
                      {canDeleteRoot && <button type="button" onClick={() => handleDeleteMessage(root)}>Delete</button>}
                    </div>

                    {replies.length > 0 && (
                      <div className="thread-replies">
                        {replies.map((reply) => {
                          const canEditReply = reply.sender?.id === user?.id && !reply.is_deleted;
                          const canDeleteReply = canEditReply || isLeadership;
                          return (
                            <div key={reply.id} className="thread-reply-item">
                              <header>
                                <strong>{displayName(reply.sender)}</strong>
                                <small>{formatDate(reply.created_at)}{reply.edited_at ? ' (edited)' : ''}</small>
                              </header>
                              <p>{reply.content}</p>
                              <div className="reaction-row">
                                {reactionChoices.map((emoji) => (
                                  <button key={emoji} type="button" onClick={() => handleReactMessage(reply.id, emoji)} disabled={isLecturerReadOnly}>{emoji}</button>
                                ))}
                                <span>{(reply.reactions || []).map((reaction) => reaction.emoji).join(' ')}</span>
                              </div>
                              <div className="message-actions">
                                {canEditReply && <button type="button" onClick={() => beginEditMessage(reply)}>Edit</button>}
                                {canDeleteReply && <button type="button" onClick={() => handleDeleteMessage(reply)}>Delete</button>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="compose-box">
              {replyParentId && <p>Replying in thread for message #{replyParentId}</p>}
              <textarea
                rows={3}
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Type a message..."
                disabled={!canPostMessages}
              />

              <select
                multiple
                value={messageTaskIds.map(String)}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setMessageTaskIds(values);
                }}
                disabled={!canPostMessages}
              >
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>

              <input
                type="file"
                onChange={(event) => setMessageFile(event.target.files?.[0] || null)}
                disabled={!canPostMessages}
              />

              <div className="message-actions">
                <button type="button" onClick={handleSendMessage} disabled={!canPostMessages}>Send</button>
                {replyParentId && <button type="button" onClick={() => setReplyParentId(null)}>Clear Reply</button>}
              </div>

              {!canPostMessages && <p className="communication-hint">Lecturers can read channels but cannot post or interact.</p>}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'dm' && (
        <section className="communication-panel">
          <p className="communication-hint">
            Keep project decisions in your team channels so everyone stays informed.
          </p>
          <div className="compose-row">
            <select value={dmRecipientId} onChange={(event) => setDmRecipientId(event.target.value)} disabled={isLecturerReadOnly}>
              <option value="">Select teammate</option>
              {dmMemberOptions.map((member) => (
                <option key={member.id} value={member.id}>{displayName(member)}</option>
              ))}
            </select>
            <input
              value={dmDraft}
              onChange={(event) => setDmDraft(event.target.value)}
              placeholder="Type a private message"
              disabled={isLecturerReadOnly}
            />
            <button type="button" onClick={handleSendDM} disabled={isLecturerReadOnly}>Send</button>
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

          {isLecturerReadOnly && <p className="communication-hint">Lecturers do not have access to direct messages.</p>}
        </section>
      )}

      {activeTab === 'meetings' && (
        <section className="communication-panel">
          <div className="compose-box">
            <input
              value={meetingTitle}
              onChange={(event) => setMeetingTitle(event.target.value)}
              placeholder="Meeting title"
              disabled={isLecturerReadOnly}
            />
            <textarea
              rows={3}
              value={meetingDescription}
              onChange={(event) => setMeetingDescription(event.target.value)}
              placeholder="Description and preparation notes"
              disabled={isLecturerReadOnly}
            />
            <div className="compose-row">
              <select value={meetingFormat} onChange={(event) => setMeetingFormat(event.target.value)} disabled={isLecturerReadOnly}>
                <option value="IN_PERSON">In person</option>
                <option value="ONLINE">Online</option>
              </select>
              <input
                type="datetime-local"
                value={meetingDeadline}
                onChange={(event) => setMeetingDeadline(event.target.value)}
                disabled={isLecturerReadOnly}
              />
            </div>
            {meetingFormat === 'ONLINE' && (
              <input
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                placeholder="Meeting link"
                disabled={isLecturerReadOnly}
              />
            )}
            <button type="button" onClick={handleCreateMeetingPoll} disabled={isLecturerReadOnly}>Create Poll</button>
          </div>

          <div className="stream-list">
            {meetingPolls.map((poll) => {
              const canManagePoll = !isLecturerReadOnly && (poll.created_by?.id === user?.id || isLeadership);
              const slotDraft = newSlotByPoll[poll.id] || { start: '', end: '' };
              const notesDraft = newMeetingNoteByPoll[poll.id] || '';

              return (
                <article key={poll.id} className="stream-card meeting">
                  <header>
                    <strong>{poll.title}</strong>
                    <small>{formatDate(poll.created_at)}</small>
                  </header>
                  <p>{poll.description || 'No description provided.'}</p>
                  <p>Format: {poll.meeting_format === 'ONLINE' ? 'Online' : 'In person'}</p>
                  <p>Response deadline: {formatDate(poll.response_deadline)}</p>
                  {poll.meeting_link && (
                    <p>
                      Meeting link: <a href={poll.meeting_link} target="_blank" rel="noreferrer">Open link</a>
                    </p>
                  )}

                  <div className="stream-list">
                    {(poll.slots || []).map((slot) => (
                      <div key={slot.id} className="stream-card">
                        <p>
                          {formatDate(slot.start_datetime)} - {formatDate(slot.end_datetime)}
                          {slot.confirmed ? ' (Confirmed)' : ''}
                        </p>
                        <div className="compose-row">
                          <select defaultValue="AVAILABLE" onChange={(event) => handleVoteSlot(poll.id, slot.id, event.target.value)} disabled={isLecturerReadOnly}>
                            {availabilityOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => handleConfirmSlot(poll.id, slot.id)} disabled={!canManagePoll}>Confirm Slot</button>
                        </div>
                        <p>
                          Responses: {(poll.responses || []).filter((response) => response.slot === slot.id).length}
                        </p>
                      </div>
                    ))}
                  </div>

                  {canManagePoll && (
                    <div className="compose-row">
                      <input
                        type="datetime-local"
                        value={slotDraft.start || ''}
                        onChange={(event) => setNewSlotByPoll((prev) => ({
                          ...prev,
                          [poll.id]: { ...slotDraft, start: event.target.value },
                        }))}
                      />
                      <input
                        type="datetime-local"
                        value={slotDraft.end || ''}
                        onChange={(event) => setNewSlotByPoll((prev) => ({
                          ...prev,
                          [poll.id]: { ...slotDraft, end: event.target.value },
                        }))}
                      />
                      <button type="button" onClick={() => handleAddMeetingSlot(poll.id)}>Add Slot</button>
                    </div>
                  )}

                  <div className="compose-inline">
                    <textarea
                      rows={2}
                      value={notesDraft}
                      onChange={(event) => setNewMeetingNoteByPoll((prev) => ({ ...prev, [poll.id]: event.target.value }))}
                      placeholder="Post meeting notes"
                      disabled={isLecturerReadOnly}
                    />
                    <button type="button" onClick={() => handleAddMeetingNote(poll.id)} disabled={isLecturerReadOnly}>Save Notes</button>
                  </div>

                  {(poll.notes || []).length > 0 && (
                    <div className="stream-list">
                      {poll.notes.map((note) => (
                        <div key={note.id} className="stream-card">
                          <header>
                            <strong>{displayName(note.author)}</strong>
                            <small>{formatDate(note.created_at)}</small>
                          </header>
                          <p>{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'notifications' && (
        <section className="communication-panel">
          <div className="compose-row">
            <button type="button" onClick={handleMarkAllNotificationsRead}>Mark all as read</button>
          </div>

          <div className="stream-list">
            {notifications.map((notification) => (
              <article key={notification.id} className="stream-card">
                <header>
                  <strong>{notification.title}</strong>
                  <small>{formatDate(notification.created_at)}</small>
                </header>
                <p>{notification.message_body}</p>
                <p>Project: {notification.project || 'General'}</p>
                <div className="message-actions">
                  {!notification.is_read && (
                    <button type="button" onClick={() => handleMarkNotificationRead(notification.id)}>Mark read</button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="stream-list">
            {Array.from(new Set(notificationPrefs.map((item) => item.notification_type))).concat(
              ['ANNOUNCEMENT', 'CHANNEL_MENTION', 'CHANNEL_REPLY', 'DIRECT_MESSAGE', 'MESSAGE_REACTION', 'MEETING_POLL', 'MEETING_CONFIRMED', 'MEETING_REMINDER']
                .filter((type) => !notificationPrefs.some((item) => item.notification_type === type))
            ).map((type) => {
              const pref = notificationPrefs.find((item) => item.notification_type === type) || defaultNotificationPref(type);
              return (
                <article key={type} className="stream-card">
                  <header>
                    <strong>{type.replaceAll('_', ' ')}</strong>
                  </header>
                  <div className="compose-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={!!pref.in_app_enabled}
                        onChange={(event) => handleTogglePreference(type, 'in_app_enabled', event.target.checked)}
                      />
                      In-app
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!pref.email_enabled}
                        onChange={(event) => handleTogglePreference(type, 'email_enabled', event.target.checked)}
                        disabled={type === 'ANNOUNCEMENT'}
                      />
                      Email
                    </label>
                    <select
                      value={pref.email_frequency || 'DIGEST'}
                      onChange={(event) => handleTogglePreference(type, 'email_frequency', event.target.value)}
                      disabled={!pref.email_enabled || type === 'ANNOUNCEMENT'}
                    >
                      <option value="IMMEDIATE">Immediate</option>
                      <option value="DIGEST">Digest</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!selectedProjectId && <p className="communication-hint">Select a project to start collaboration.</p>}
      {selectedProject && (
        <p className="communication-hint">
          Project context active: {selectedProject.title}. Task links, channels, and meetings are scoped to this project only.
        </p>
      )}
    </div>
  );
};

export default CommunicationWorkspace;
