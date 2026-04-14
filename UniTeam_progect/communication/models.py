from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def _default_notification_expiry():
	return timezone.now() + timedelta(days=60)


class Channel(models.Model):
	class Type(models.TextChoices):
		ANNOUNCEMENT = 'ANNOUNCEMENT', 'Announcement'
		DISCUSSION = 'DISCUSSION', 'Discussion'

	project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='communication_channels')
	name = models.CharField(max_length=80)
	slug = models.SlugField(max_length=90)
	channel_type = models.CharField(max_length=20, choices=Type.choices, default=Type.DISCUSSION)
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_channels')
	created_at = models.DateTimeField(auto_now_add=True)
	is_default = models.BooleanField(default=False)
	is_deleted = models.BooleanField(default=False)
	deleted_at = models.DateTimeField(null=True, blank=True)
	archived_until = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['channel_type', 'name']
		constraints = [
			models.UniqueConstraint(fields=['project', 'slug'], name='uniq_channel_slug_per_project'),
			models.UniqueConstraint(
				fields=['project'],
				condition=models.Q(channel_type='ANNOUNCEMENT', is_deleted=False),
				name='uniq_active_announcement_channel_per_project',
			),
		]

	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = slugify(self.name)[:90] or 'channel'
		super().save(*args, **kwargs)

	def __str__(self):
		return f'{self.project.title} - #{self.slug}'


class Announcement(models.Model):
	project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='announcements')
	author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcements')
	content = models.TextField()
	attached_file = models.FileField(upload_to='communication/announcements/%Y/%m/', null=True, blank=True)
	linked_project_file = models.ForeignKey(
		'projects.ProjectFile',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='announcements',
	)
	created_at = models.DateTimeField(auto_now_add=True)
	is_pinned = models.BooleanField(default=False)

	class Meta:
		ordering = ['-is_pinned', '-created_at']

	def __str__(self):
		return f'Announcement in {self.project.title} by {self.author.username}'


class AnnouncementReaction(models.Model):
	announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='reactions')
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcement_reactions')
	emoji = models.CharField(max_length=16)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']
		unique_together = ('announcement', 'user', 'emoji')


class Message(models.Model):
	channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
	sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channel_messages')
	content = models.TextField()
	parent_message = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='thread_replies')
	created_at = models.DateTimeField(auto_now_add=True)
	edited_at = models.DateTimeField(null=True, blank=True)
	is_deleted = models.BooleanField(default=False)
	deleted_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['created_at']

	def can_edit(self, user):
		if user.id != self.sender_id:
			return False
		return timezone.now() <= self.created_at + timedelta(minutes=15)


class MessageAttachment(models.Model):
	message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
	file = models.FileField(upload_to='communication/messages/%Y/%m/')
	file_name = models.CharField(max_length=255)
	file_size = models.PositiveIntegerField(default=0)
	mirrored_project_file = models.ForeignKey(
		'projects.ProjectFile',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='message_attachments',
	)
	created_at = models.DateTimeField(auto_now_add=True)


class MessageReaction(models.Model):
	message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_reactions')
	emoji = models.CharField(max_length=16)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']
		unique_together = ('message', 'user', 'emoji')


class MessageTaskReference(models.Model):
	message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='task_references')
	task = models.ForeignKey('projects.Task', on_delete=models.CASCADE, related_name='message_references')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('message', 'task')


class TaskCommentReaction(models.Model):
	task_comment = models.ForeignKey('projects.TaskComment', on_delete=models.CASCADE, related_name='reactions')
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_comment_reactions')
	emoji = models.CharField(max_length=16)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('task_comment', 'user', 'emoji')


class TaskCommentThreadState(models.Model):
	task_comment = models.OneToOneField('projects.TaskComment', on_delete=models.CASCADE, related_name='thread_state')
	is_resolved = models.BooleanField(default=False)
	resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_task_comment_threads')
	resolved_at = models.DateTimeField(null=True, blank=True)
	is_collapsed = models.BooleanField(default=False)
	linked_message = models.ForeignKey(Message, on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_task_comments')


class DirectMessage(models.Model):
	sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_direct_messages')
	recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_direct_messages')
	project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='direct_messages')
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	edited_at = models.DateTimeField(null=True, blank=True)
	is_read = models.BooleanField(default=False)
	is_deleted = models.BooleanField(default=False)

	class Meta:
		ordering = ['created_at']


class MeetingPoll(models.Model):
	class Format(models.TextChoices):
		IN_PERSON = 'IN_PERSON', 'In person'
		ONLINE = 'ONLINE', 'Online'

	project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='meeting_polls')
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_meeting_polls')
	title = models.CharField(max_length=200)
	description = models.TextField(blank=True)
	meeting_format = models.CharField(max_length=20, choices=Format.choices, default=Format.IN_PERSON)
	meeting_link = models.URLField(blank=True)
	response_deadline = models.DateTimeField()
	confirmed_slot = models.ForeignKey('MeetingSlot', on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_for_polls')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']


class MeetingSlot(models.Model):
	poll = models.ForeignKey(MeetingPoll, on_delete=models.CASCADE, related_name='slots')
	start_datetime = models.DateTimeField()
	end_datetime = models.DateTimeField()
	confirmed = models.BooleanField(default=False)
	reminder_sent_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['start_datetime']


class MeetingResponse(models.Model):
	class Availability(models.TextChoices):
		AVAILABLE = 'AVAILABLE', 'Available'
		IF_NEEDED = 'IF_NEEDED', 'If needed'
		UNAVAILABLE = 'UNAVAILABLE', 'Unavailable'

	poll = models.ForeignKey(MeetingPoll, on_delete=models.CASCADE, related_name='responses')
	slot = models.ForeignKey(MeetingSlot, on_delete=models.CASCADE, related_name='responses')
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meeting_responses')
	availability = models.CharField(max_length=20, choices=Availability.choices)

	class Meta:
		unique_together = ('slot', 'user')


class MeetingNotes(models.Model):
	poll = models.ForeignKey(MeetingPoll, on_delete=models.CASCADE, related_name='notes')
	author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meeting_notes')
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']


class Notification(models.Model):
	class Type(models.TextChoices):
		ANNOUNCEMENT = 'ANNOUNCEMENT', 'Announcement'
		CHANNEL_MENTION = 'CHANNEL_MENTION', 'Channel mention'
		CHANNEL_REPLY = 'CHANNEL_REPLY', 'Channel reply'
		DIRECT_MESSAGE = 'DIRECT_MESSAGE', 'Direct message'
		MESSAGE_REACTION = 'MESSAGE_REACTION', 'Message reaction'
		MEETING_POLL = 'MEETING_POLL', 'Meeting poll'
		MEETING_CONFIRMED = 'MEETING_CONFIRMED', 'Meeting confirmed'
		MEETING_REMINDER = 'MEETING_REMINDER', 'Meeting reminder'

	recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='communication_notifications')
	type = models.CharField(max_length=40, choices=Type.choices)
	title = models.CharField(max_length=200)
	message_body = models.TextField()
	related_object_type = models.CharField(max_length=60, blank=True)
	related_object_id = models.PositiveBigIntegerField(null=True, blank=True)
	project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True, related_name='communication_notifications')
	is_read = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	expiry_timestamp = models.DateTimeField(default=_default_notification_expiry)
	digest_sent_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['-created_at']


class NotificationPreference(models.Model):
	class EmailFrequency(models.TextChoices):
		IMMEDIATE = 'IMMEDIATE', 'Immediate'
		DIGEST = 'DIGEST', 'Digest'
		NONE = 'NONE', 'None'

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='communication_notification_preferences')
	notification_type = models.CharField(max_length=40, choices=Notification.Type.choices)
	in_app_enabled = models.BooleanField(default=True)
	email_enabled = models.BooleanField(default=True)
	email_frequency = models.CharField(max_length=20, choices=EmailFrequency.choices, default=EmailFrequency.DIGEST)

	class Meta:
		unique_together = ('user', 'notification_type')


class ChannelNotificationPreference(models.Model):
	class Mode(models.TextChoices):
		ALL = 'ALL', 'All messages'
		MENTIONS = 'MENTIONS', 'Only mentions'
		MUTED = 'MUTED', 'Muted'

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channel_notification_preferences')
	channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='notification_preferences')
	mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.MENTIONS)

	class Meta:
		unique_together = ('user', 'channel')
