from django.contrib import admin

from .models import (
	Announcement,
	AnnouncementReaction,
	Channel,
	ChannelNotificationPreference,
	DirectMessage,
	MeetingNotes,
	MeetingPoll,
	MeetingResponse,
	MeetingSlot,
	Message,
	MessageAttachment,
	MessageReaction,
	MessageTaskReference,
	Notification,
	NotificationPreference,
	TaskCommentReaction,
	TaskCommentThreadState,
)

admin.site.register(Channel)
admin.site.register(Announcement)
admin.site.register(AnnouncementReaction)
admin.site.register(Message)
admin.site.register(MessageAttachment)
admin.site.register(MessageReaction)
admin.site.register(MessageTaskReference)
admin.site.register(DirectMessage)
admin.site.register(MeetingPoll)
admin.site.register(MeetingSlot)
admin.site.register(MeetingResponse)
admin.site.register(MeetingNotes)
admin.site.register(Notification)
admin.site.register(NotificationPreference)
admin.site.register(ChannelNotificationPreference)
admin.site.register(TaskCommentReaction)
admin.site.register(TaskCommentThreadState)
