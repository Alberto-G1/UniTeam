from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (
    AnnouncementViewSet,
    ChannelNotificationPreferenceViewSet,
    ChannelViewSet,
    CommunicationNotificationViewSet,
    DirectMessageViewSet,
    MeetingPollViewSet,
    MessageViewSet,
    NotificationPreferenceViewSet,
    TaskCommentReactionViewSet,
    TaskCommentThreadStateViewSet,
)

router = DefaultRouter()
router.register(r'channels', ChannelViewSet, basename='communication-channel')
router.register(r'announcements', AnnouncementViewSet, basename='communication-announcement')
router.register(r'channel-messages', MessageViewSet, basename='communication-message')
router.register(r'direct-messages', DirectMessageViewSet, basename='communication-direct-message')
router.register(r'meeting-polls', MeetingPollViewSet, basename='communication-meeting-poll')
router.register(r'notifications', CommunicationNotificationViewSet, basename='communication-notification')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='communication-notification-preference')
router.register(r'channel-notification-preferences', ChannelNotificationPreferenceViewSet, basename='communication-channel-notification-preference')
router.register(r'task-comment-reactions', TaskCommentReactionViewSet, basename='communication-task-comment-reaction')
router.register(r'task-comment-thread-states', TaskCommentThreadStateViewSet, basename='communication-task-comment-thread-state')

urlpatterns = [
    path('', include(router.urls)),
]
