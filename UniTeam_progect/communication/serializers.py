from django.utils import timezone
from rest_framework import serializers

from users.models import CustomUser
from users.serializers import UserSerializer

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


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Channel
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'created_at', 'is_default', 'deleted_at', 'archived_until')


class AnnouncementReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AnnouncementReaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class AnnouncementSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    reactions = AnnouncementReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ('author', 'created_at')


class MessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAttachment
        fields = '__all__'
        read_only_fields = ('message', 'file_name', 'file_size', 'mirrored_project_file', 'created_at')


class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MessageReaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class MessageTaskReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTaskReference
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    task_references = MessageTaskReferenceSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'created_at', 'edited_at', 'deleted_at')


class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    recipient_id = serializers.PrimaryKeyRelatedField(
        source='recipient',
        queryset=CustomUser.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = DirectMessage
        fields = (
            'id',
            'sender',
            'recipient',
            'recipient_id',
            'project',
            'content',
            'created_at',
            'edited_at',
            'is_read',
            'is_deleted',
        )
        read_only_fields = ('sender', 'created_at', 'edited_at', 'is_read')


class MeetingSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingSlot
        fields = '__all__'


class MeetingResponseSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MeetingResponse
        fields = '__all__'
        read_only_fields = ('user',)


class MeetingNotesSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = MeetingNotes
        fields = '__all__'
        read_only_fields = ('author', 'created_at')


class MeetingPollSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    slots = MeetingSlotSerializer(many=True, read_only=True)
    responses = MeetingResponseSerializer(many=True, read_only=True)
    notes = MeetingNotesSerializer(many=True, read_only=True)

    class Meta:
        model = MeetingPoll
        fields = '__all__'
        read_only_fields = ('created_by', 'confirmed_slot', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at',)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = '__all__'


class ChannelNotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelNotificationPreference
        fields = '__all__'


class TaskCommentReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TaskCommentReaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class TaskCommentThreadStateSerializer(serializers.ModelSerializer):
    resolved_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskCommentThreadState
        fields = '__all__'
        read_only_fields = ('resolved_by', 'resolved_at')

    def update(self, instance, validated_data):
        if validated_data.get('is_resolved') and not instance.is_resolved:
            instance.resolved_at = timezone.now()
            instance.resolved_by = self.context['request'].user
        return super().update(instance, validated_data)
