import re
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.models import FileFolder, Project, ProjectFile, ProjectFileVersion, Task, TaskComment, Team, TeamMembership
from users.models import CustomUser

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
from .serializers import (
    AnnouncementSerializer,
    ChannelNotificationPreferenceSerializer,
    ChannelSerializer,
    DirectMessageSerializer,
    MeetingNotesSerializer,
    MeetingPollSerializer,
    MeetingResponseSerializer,
    MeetingSlotSerializer,
    MessageSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
    TaskCommentReactionSerializer,
    TaskCommentThreadStateSerializer,
)


def _membership(project, user):
    return TeamMembership.objects.filter(team=project.team, user=user).first()


def _is_leadership(project, user):
    if user.role == CustomUser.Role.ADMIN:
        return True
    membership = _membership(project, user)
    return bool(membership and membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER])


def _is_project_owner(project, user):
    if user.role == CustomUser.Role.ADMIN:
        return True
    membership = _membership(project, user)
    return bool(membership and membership.role == Team.Role.LEADER)


def _can_read_project(project, user):
    if user.role == CustomUser.Role.ADMIN:
        return True
    if user.role == CustomUser.Role.LECTURER:
        return project.supervisor_id == user.id
    return TeamMembership.objects.filter(team=project.team, user=user).exists()


def _can_post_project_messages(project, user):
    if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.LECTURER]:
        return False
    return TeamMembership.objects.filter(team=project.team, user=user).exists()


def _project_members(project):
    return CustomUser.objects.filter(teammembership__team=project.team).distinct()


def _send_email_if_enabled(*, subject, message, recipient_list):
    if not getattr(settings, 'ENABLE_EMAIL_NOTIFICATIONS', False):
        return
    if not recipient_list:
        return
    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@uniteam.local'),
        recipient_list=recipient_list,
        fail_silently=True,
    )


def _notification_prefers(user, notification_type):
    pref = NotificationPreference.objects.filter(user=user, notification_type=notification_type).first()
    if not pref:
        return True, False, NotificationPreference.EmailFrequency.DIGEST
    return pref.in_app_enabled, pref.email_enabled, pref.email_frequency


def _create_notification(*, recipients, notification_type, title, message, project=None, related_type='', related_id=None):
    rows = []
    immediate_email_recipients = []
    for user in recipients:
        in_app_enabled, email_enabled, email_frequency = _notification_prefers(user, notification_type)
        if not in_app_enabled and notification_type != Notification.Type.ANNOUNCEMENT:
            continue
        rows.append(
            Notification(
                recipient=user,
                type=notification_type,
                title=title,
                message_body=message,
                project=project,
                related_object_type=related_type,
                related_object_id=related_id,
            )
        )
        if email_enabled and email_frequency == NotificationPreference.EmailFrequency.IMMEDIATE:
            immediate_email_recipients.append(user.email)
    Notification.objects.bulk_create(rows)
    _send_email_if_enabled(
        subject=title,
        message=message,
        recipient_list=[email for email in immediate_email_recipients if email],
    )


def _extract_mention_tokens(content):
    if not content:
        return set()
    tokens = set(match.strip() for match in re.findall(r'@\{([^}]+)\}', content) if match.strip())
    short_tokens = set(match.strip() for match in re.findall(r'@([A-Za-z0-9_.-]+)', content) if match.strip())
    return tokens | short_tokens


def _resolve_mentions(project, content):
    mention_tokens = _extract_mention_tokens(content)
    if not mention_tokens:
        return []

    members = list(_project_members(project))
    resolved = {}
    normalized_index = {}

    for member in members:
        aliases = {
            member.username or '',
            member.email or '',
            f'{member.first_name} {member.last_name}'.strip(),
            f'{member.first_name}.{member.last_name}'.strip('.'),
            f'{member.first_name}_{member.last_name}'.strip('_'),
            member.get_full_name().strip(),
        }
        for alias in aliases:
            key = alias.strip().lower()
            if key:
                normalized_index.setdefault(key, []).append(member)

    for token in mention_tokens:
        token_key = token.lower()
        matches = normalized_index.get(token_key, [])
        if len(matches) == 1:
            resolved[matches[0].id] = matches[0]
            continue

        prefixed_matches = []
        for alias_key, users in normalized_index.items():
            if alias_key.startswith(token_key):
                prefixed_matches.extend(users)

        unique_matches = {user.id: user for user in prefixed_matches}
        if len(unique_matches) == 1:
            user = list(unique_matches.values())[0]
            resolved[user.id] = user

    return list(resolved.values())


def _send_announcement_email(project, subject, body):
    recipients = [u.email for u in _project_members(project) if u.email]
    _send_email_if_enabled(
        subject=subject,
        message=body,
        recipient_list=recipients,
    )


def _chat_attachments_folder(project):
    folder, _ = FileFolder.objects.get_or_create(project=project, name='Chat Attachments', defaults={'order': 999})
    return folder


def _mirror_message_attachment(project, sender, attachment):
    folder = _chat_attachments_folder(project)
    with transaction.atomic():
        pf = ProjectFile.objects.create(
            project=project,
            folder=folder,
            display_name=attachment.file_name,
            stored_file_name=attachment.file_name,
            file_extension='.' + attachment.file_name.split('.')[-1].lower() if '.' in attachment.file_name else '',
            file_size=attachment.file_size,
            mime_type='application/octet-stream',
            tag=ProjectFile.Tag.REFERENCE,
            description='Shared via communication channel',
            uploaded_by=sender,
            current_version_number=1,
            current_version_note='Shared from channel message',
        )
        pv = ProjectFileVersion.objects.create(
            parent_file=pf,
            version_number=1,
            stored_file=attachment.file,
            file_size=attachment.file_size,
            uploader=sender,
            version_note='Shared from channel message',
            tag_at_time=ProjectFile.Tag.REFERENCE,
        )
        pf.current_version_file = pv
        pf.save(update_fields=['current_version_file'])
        attachment.mirrored_project_file = pf
        attachment.save(update_fields=['mirrored_project_file'])


def _channel_mentions_notification_mode(channel, user):
    pref = ChannelNotificationPreference.objects.filter(channel=channel, user=user).first()
    if pref:
        return pref.mode
    if channel.slug == 'general':
        return ChannelNotificationPreference.Mode.ALL
    return ChannelNotificationPreference.Mode.MENTIONS


class ChannelViewSet(viewsets.ModelViewSet):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Channel.objects.select_related('project', 'created_by').filter(is_deleted=False)
        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return qs
        if user.role == CustomUser.Role.LECTURER:
            return qs.filter(project__supervisor=user)
        return qs.filter(project__team__teammembership__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        if not _is_leadership(project, self.request.user):
            raise PermissionDenied('Only leaders and co-leaders can create channels')

        if serializer.validated_data.get('channel_type') != Channel.Type.DISCUSSION:
            raise ValidationError('Only discussion channels can be created manually')

        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        channel = self.get_object()
        if channel.is_default:
            raise PermissionDenied('Default channels cannot be renamed')
        if not _is_leadership(channel.project, self.request.user):
            raise PermissionDenied('Only leaders and co-leaders can edit channels')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        channel = self.get_object()
        if channel.is_default:
            raise PermissionDenied('Default channels cannot be deleted')
        if not _is_project_owner(channel.project, request.user):
            raise PermissionDenied('Only the project owner can delete custom channels')
        channel.is_deleted = True
        channel.deleted_at = timezone.now()
        channel.archived_until = timezone.now() + timedelta(days=30)
        channel.save(update_fields=['is_deleted', 'deleted_at', 'archived_until'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Announcement.objects.select_related('project', 'author').prefetch_related('reactions')
        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return qs
        if user.role == CustomUser.Role.LECTURER:
            return qs.filter(project__supervisor=user)
        return qs.filter(project__team__teammembership__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        if not _is_leadership(project, self.request.user):
            raise PermissionDenied('Only leaders and co-leaders can post announcements')

        announcement = serializer.save(author=self.request.user)
        recipients = list(_project_members(project))
        _create_notification(
            recipients=recipients,
            notification_type=Notification.Type.ANNOUNCEMENT,
            title='New announcement',
            message=f'{self.request.user.get_full_name() or self.request.user.username}: {announcement.content[:120]}',
            project=project,
            related_type='announcement',
            related_id=announcement.id,
        )
        _send_announcement_email(
            project,
            f'[{project.title}] New announcement',
            announcement.content,
        )

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        announcement = self.get_object()
        if not _can_read_project(announcement.project, request.user):
            raise PermissionDenied('You cannot react to this announcement')

        emoji = (request.data.get('emoji') or '').strip()
        if not emoji:
            return Response({'error': 'emoji is required'}, status=status.HTTP_400_BAD_REQUEST)

        reaction, created = AnnouncementReaction.objects.get_or_create(
            announcement=announcement,
            user=request.user,
            emoji=emoji,
        )
        if not created:
            reaction.delete()
            return Response({'removed': True})
        return Response({'created': True})

    @action(detail=True, methods=['post'])
    def convert_to_task(self, request, pk=None):
        announcement = self.get_object()
        project = announcement.project
        if not _is_leadership(project, request.user):
            raise PermissionDenied('Only leaders and co-leaders can convert announcements to tasks')

        title = (request.data.get('title') or announcement.content[:120]).strip() or 'Task from announcement'
        deadline = request.data.get('deadline')
        if not deadline:
            return Response({'error': 'deadline is required'}, status=status.HTTP_400_BAD_REQUEST)

        task = Task.objects.create(
            project=project,
            title=title,
            description=announcement.content,
            created_by=request.user,
            deadline=deadline,
            assigned_to_id=request.data.get('assigned_to_id') or None,
        )
        return Response({'task_id': task.id}, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Message.objects.select_related('channel', 'sender', 'parent_message').prefetch_related('attachments', 'reactions', 'task_references')
        channel_id = self.request.query_params.get('channel')
        parent_id = self.request.query_params.get('parent')

        if channel_id:
            qs = qs.filter(channel_id=channel_id)
        if parent_id == 'null':
            qs = qs.filter(parent_message__isnull=True)
        elif parent_id:
            qs = qs.filter(parent_message_id=parent_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return qs
        if user.role == CustomUser.Role.LECTURER:
            return qs.filter(channel__project__supervisor=user)
        return qs.filter(channel__project__team__teammembership__user=user).distinct()

    def perform_create(self, serializer):
        channel = serializer.validated_data['channel']
        project = channel.project
        if channel.channel_type != Channel.Type.DISCUSSION:
            raise PermissionDenied('Announcements are managed through the announcement endpoint')
        if not _can_post_project_messages(project, self.request.user):
            raise PermissionDenied('You do not have permission to post messages in this project')

        message = serializer.save(sender=self.request.user)

        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            attachment = MessageAttachment.objects.create(
                message=message,
                file=uploaded_file,
                file_name=uploaded_file.name,
                file_size=uploaded_file.size,
            )
            _mirror_message_attachment(project, self.request.user, attachment)

        task_ids = self.request.data.getlist('task_ids') if hasattr(self.request.data, 'getlist') else self.request.data.get('task_ids', [])
        if isinstance(task_ids, str):
            task_ids = [task_ids]
        for task_id in task_ids:
            task = Task.objects.filter(id=task_id, project=project).first()
            if task:
                MessageTaskReference.objects.get_or_create(message=message, task=task)

        mentioned_users = _resolve_mentions(project, message.content or '')
        for user in mentioned_users:
            if user.id == self.request.user.id:
                continue
            if not _can_read_project(project, user):
                continue
            _create_notification(
                recipients=[user],
                notification_type=Notification.Type.CHANNEL_MENTION,
                title='You were mentioned',
                message=f'{self.request.user.username} mentioned you in #{channel.slug}',
                project=project,
                related_type='message',
                related_id=message.id,
            )

        if message.parent_message_id:
            participants = CustomUser.objects.filter(
                channel_messages__channel=channel,
                channel_messages__parent_message=message.parent_message,
            ).distinct()
            participants = [u for u in participants if u.id != self.request.user.id]
            _create_notification(
                recipients=participants,
                notification_type=Notification.Type.CHANNEL_REPLY,
                title='New thread reply',
                message=f'{self.request.user.username} replied in a thread in #{channel.slug}',
                project=project,
                related_type='message',
                related_id=message.id,
            )

        recipients = []
        for member in _project_members(project):
            if member.id == self.request.user.id:
                continue
            mode = _channel_mentions_notification_mode(channel, member)
            if mode == ChannelNotificationPreference.Mode.ALL:
                recipients.append(member)
        _create_notification(
            recipients=recipients,
            notification_type=Notification.Type.CHANNEL_REPLY,
            title=f'New message in #{channel.slug}',
            message=(message.content or '')[:140],
            project=project,
            related_type='message',
            related_id=message.id,
        )

    def perform_update(self, serializer):
        message = self.get_object()
        if not message.can_edit(self.request.user):
            raise PermissionDenied('Messages can only be edited by sender within 15 minutes')
        serializer.save(edited_at=timezone.now())

    def destroy(self, request, *args, **kwargs):
        message = self.get_object()
        if message.sender_id != request.user.id and not _is_leadership(message.channel.project, request.user):
            raise PermissionDenied('You do not have permission to delete this message')
        message.is_deleted = True
        message.content = 'This message was deleted.'
        message.deleted_at = timezone.now()
        message.save(update_fields=['is_deleted', 'content', 'deleted_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        message = self.get_object()
        if not _can_read_project(message.channel.project, request.user):
            raise PermissionDenied('You cannot react to this message')
        emoji = (request.data.get('emoji') or '').strip()
        if not emoji:
            return Response({'error': 'emoji is required'}, status=status.HTTP_400_BAD_REQUEST)

        reaction, created = MessageReaction.objects.get_or_create(message=message, user=request.user, emoji=emoji)
        if not created:
            reaction.delete()
            return Response({'removed': True})

        _create_notification(
            recipients=[message.sender],
            notification_type=Notification.Type.MESSAGE_REACTION,
            title='Someone reacted to your message',
            message=f'{request.user.username} reacted with {emoji}',
            project=message.channel.project,
            related_type='message',
            related_id=message.id,
        )
        return Response({'created': True})


class DirectMessageViewSet(viewsets.ModelViewSet):
    serializer_class = DirectMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DirectMessage.objects.select_related('sender', 'recipient', 'project')
        project_id = self.request.query_params.get('project')
        with_user = self.request.query_params.get('with_user')

        user = self.request.user
        qs = qs.filter(project__team__teammembership__user=user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        if with_user:
            qs = qs.filter(sender_id__in=[user.id, with_user], recipient_id__in=[user.id, with_user])
        else:
            qs = qs.filter(sender=user) | qs.filter(recipient=user)
        return qs.order_by('created_at')

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        recipient = serializer.validated_data['recipient']

        if self.request.user.role == CustomUser.Role.LECTURER or recipient.role == CustomUser.Role.LECTURER:
            raise PermissionDenied('Direct messages are only available for student project members')

        if not TeamMembership.objects.filter(team=project.team, user=self.request.user).exists():
            raise PermissionDenied('You are not a member of this project')
        if not TeamMembership.objects.filter(team=project.team, user=recipient).exists():
            raise PermissionDenied('Recipient is not a member of this project')

        message = serializer.save(sender=self.request.user)
        _create_notification(
            recipients=[recipient],
            notification_type=Notification.Type.DIRECT_MESSAGE,
            title='New direct message',
            message=f'{self.request.user.username}: {(message.content or "")[:120]}',
            project=project,
            related_type='direct_message',
            related_id=message.id,
        )


class MeetingPollViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingPollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = MeetingPoll.objects.select_related('project', 'created_by', 'confirmed_slot').prefetch_related('slots', 'responses', 'notes')
        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return qs
        if user.role == CustomUser.Role.LECTURER:
            return qs.filter(project__supervisor=user)
        return qs.filter(project__team__teammembership__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        if not _can_post_project_messages(project, self.request.user):
            raise PermissionDenied('Only project members can create meeting polls')
        poll = serializer.save(created_by=self.request.user)
        _create_notification(
            recipients=[u for u in _project_members(project) if u.id != self.request.user.id],
            notification_type=Notification.Type.MEETING_POLL,
            title='New meeting poll',
            message=f'{self.request.user.username} created a new meeting poll: {poll.title}',
            project=project,
            related_type='meeting_poll',
            related_id=poll.id,
        )

    @action(detail=True, methods=['post'])
    def add_slot(self, request, pk=None):
        poll = self.get_object()
        if poll.created_by_id != request.user.id and not _is_leadership(poll.project, request.user):
            raise PermissionDenied('Only poll creator or leaders can add slots')

        serializer = MeetingSlotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(poll=poll)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        poll = self.get_object()
        if not _can_post_project_messages(poll.project, request.user):
            raise PermissionDenied('Only project members can vote on meeting slots')

        slot_id = request.data.get('slot_id')
        slot = get_object_or_404(MeetingSlot, id=slot_id, poll=poll)
        serializer = MeetingResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response, _ = MeetingResponse.objects.update_or_create(
            slot=slot,
            user=request.user,
            defaults={
                'poll': poll,
                'availability': serializer.validated_data['availability'],
            },
        )
        return Response(MeetingResponseSerializer(response).data)

    @action(detail=True, methods=['post'])
    def confirm_slot(self, request, pk=None):
        poll = self.get_object()
        if request.user.id != poll.created_by_id and not _is_leadership(poll.project, request.user):
            raise PermissionDenied('Only poll creator or leaders can confirm a slot')

        slot = get_object_or_404(MeetingSlot, id=request.data.get('slot_id'), poll=poll)
        poll.slots.update(confirmed=False)
        slot.confirmed = True
        slot.save(update_fields=['confirmed'])
        poll.confirmed_slot = slot
        poll.save(update_fields=['confirmed_slot'])

        _create_notification(
            recipients=[u for u in _project_members(poll.project) if u.id != request.user.id],
            notification_type=Notification.Type.MEETING_CONFIRMED,
            title='Meeting slot confirmed',
            message=f'{poll.title} is confirmed for {slot.start_datetime}.',
            project=poll.project,
            related_type='meeting_poll',
            related_id=poll.id,
        )
        return Response({'confirmed_slot': slot.id})

    @action(detail=True, methods=['post'])
    def add_notes(self, request, pk=None):
        poll = self.get_object()
        if not _can_post_project_messages(poll.project, request.user):
            raise PermissionDenied('Only project members can post meeting notes')

        serializer = MeetingNotesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(poll=poll, author=request.user)
        return Response(MeetingNotesSerializer(note).data, status=status.HTTP_201_CREATED)


class CommunicationNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChannelNotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = ChannelNotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChannelNotificationPreference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        channel = serializer.validated_data['channel']
        if not _can_read_project(channel.project, self.request.user):
            raise PermissionDenied('You are not a member of this channel project')
        serializer.save(user=self.request.user)


class TaskCommentReactionViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentReactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskCommentReaction.objects.filter(task_comment__task__project__team__teammembership__user=self.request.user).distinct()

    def perform_create(self, serializer):
        task_comment = serializer.validated_data['task_comment']
        if not _can_read_project(task_comment.task.project, self.request.user):
            raise PermissionDenied('You cannot react to this task comment')
        serializer.save(user=self.request.user)


class TaskCommentThreadStateViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentThreadStateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskCommentThreadState.objects.filter(task_comment__task__project__team__teammembership__user=self.request.user).distinct()

    def perform_create(self, serializer):
        task_comment = serializer.validated_data['task_comment']
        if not _is_leadership(task_comment.task.project, self.request.user):
            raise PermissionDenied('Only leaders and co-leaders can manage comment thread state')
        serializer.save()

    def perform_update(self, serializer):
        task_comment = serializer.instance.task_comment
        if not _is_leadership(task_comment.task.project, self.request.user):
            raise PermissionDenied('Only leaders and co-leaders can manage comment thread state')
        serializer.save()
