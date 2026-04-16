import os
import mimetypes
import re
from decimal import Decimal
from datetime import timedelta, date, datetime, time

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.apps import apps
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, F, Count
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    Project, Team, TeamMembership, Milestone, Invitation, Notification,
    ProjectTemplate, MilestoneTemplate, Section, Task, SubTask, TaskAttachment,
    TaskComment, TaskActivityLog, TaskNotification, FileFolder, ProjectFile, ProjectFileVersion,
    ProjectFileActivityLog, ProjectTrash, DashboardWidget, ProjectSnapshot,
    LecturerAlert, SubmissionChecklist, CalendarEvent
)
from .serializers import (
    ProjectSerializer, TeamSerializer, TeamMembershipSerializer,
    MilestoneSerializer, InvitationSerializer,
    ProjectTemplateSerializer, ProjectTemplateCreateSerializer, NotificationSerializer,
    MilestoneTemplateSerializer, SectionSerializer, TaskSerializer, SubTaskSerializer,
    TaskAttachmentSerializer, TaskCommentSerializer, TaskActivityLogSerializer, TaskNotificationSerializer,
    FileFolderSerializer, ProjectFileSerializer, ProjectFileVersionSerializer, ProjectFileActivityLogSerializer,
    ProjectTrashSerializer, CalendarEventSerializer, LecturerAlertSerializer,
    SubmissionChecklistSerializer
)
from users.models import CustomUser
from users.serializers import UserSerializer


def create_notification(*, recipients, notification_type, title, message, project=None, invitation=None, milestone=None):
    normalized_recipients = []
    for recipient in recipients:
        if not recipient:
            continue
        if isinstance(recipient, int):
            recipient = CustomUser.objects.filter(id=recipient).first()
        if recipient:
            normalized_recipients.append(recipient)

    unique_recipients = {user.id: user for user in normalized_recipients}.values()
    notifications = []
    for recipient in unique_recipients:
        notifications.append(
            Notification(
                recipient=recipient,
                type=notification_type,
                title=title,
                message=message,
                project=project,
                invitation=invitation,
                milestone=milestone,
            )
        )
    Notification.objects.bulk_create(notifications)


def maybe_send_email(subject, message, recipient_list):
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


def _project_members(project):
    return TeamMembership.objects.filter(team=project.team).select_related('user')


def _project_member_user_ids(project):
    return list(_project_members(project).values_list('user_id', flat=True))


def _project_membership(project, user):
    return TeamMembership.objects.filter(team=project.team, user=user).first()


def _member_is_leadership(project, user):
    membership = _project_membership(project, user)
    return bool(membership and membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER])


def _task_title(task):
    return f'{task.title} ({task.project.title})'


def _log_task_activity(task, actor=None, action_type=TaskActivityLog.ActionType.DETAILS_UPDATED, old_value='', new_value='', reason=''):
    return TaskActivityLog.objects.create(
        task=task,
        actor=actor,
        action_type=action_type,
        old_value=str(old_value),
        new_value=str(new_value),
        reason=reason,
    )


def _notify_task(*, task, recipients, notification_type, title, message):
    create_notification(
        recipients=recipients,
        notification_type=notification_type,
        title=title,
        message=message,
        project=task.project,
    )
    for recipient in {user.id: user for user in recipients if user}.values():
        TaskNotification.objects.create(
            recipient=recipient,
            task=task,
            notification_type=notification_type,
            message=message,
        )


def _task_progress_from_status(task):
    if task.status == Task.Status.DONE:
        return 100
    if task.status == Task.Status.UNDER_REVIEW:
        return max(task.progress_percentage or 80, 80)
    if task.status == Task.Status.IN_PROGRESS:
        return max(task.progress_percentage or 25, 25)
    if task.status == Task.Status.BLOCKED:
        return min(task.progress_percentage or 10, 10)
    return task.progress_percentage or 0


def _project_task_progress(project):
    tasks = Task.objects.filter(project=project, is_cancelled=False)
    total = tasks.count()
    if total == 0:
        return 0

    weighted_total = Decimal('0')
    for task in tasks:
        if task.status == Task.Status.DONE:
            weighted_total += Decimal('1')
        elif task.status == Task.Status.IN_PROGRESS:
            weighted_total += Decimal(str((task.progress_percentage or 0) / 100))
        elif task.status == Task.Status.UNDER_REVIEW:
            weighted_total += Decimal(str(max(task.progress_percentage or 75, 75) / 100))

    return int(round((weighted_total / Decimal(str(total))) * Decimal('100')))


def _project_days_remaining(project):
    return (project.deadline - timezone.localdate()).days


def _project_time_elapsed_percent(project):
    start_date = timezone.localtime(project.created_at).date() if project.created_at else timezone.localdate()
    total_days = max((project.deadline - start_date).days, 1)
    elapsed_days = max((timezone.localdate() - start_date).days, 0)
    return min(100, int(round((elapsed_days / total_days) * 100)))


def _project_task_status_counts(project):
    tasks = project.tasks.filter(is_cancelled=False)
    return {
        'TODO': tasks.filter(status=Task.Status.TODO).count(),
        'IN_PROGRESS': tasks.filter(status=Task.Status.IN_PROGRESS).count(),
        'UNDER_REVIEW': tasks.filter(status=Task.Status.UNDER_REVIEW).count(),
        'DONE': tasks.filter(status=Task.Status.DONE).count(),
        'BLOCKED': tasks.filter(status=Task.Status.BLOCKED).count(),
        'CANCELLED': project.tasks.filter(status=Task.Status.CANCELLED).count(),
    }


def _latest_project_activity_at(project):
    timestamps = [project.updated_at]
    latest_task_activity = TaskActivityLog.objects.filter(task__project=project).order_by('-created_at').values_list('created_at', flat=True).first()
    latest_file_activity = ProjectFileActivityLog.objects.filter(project=project).order_by('-created_at').values_list('created_at', flat=True).first()
    if latest_task_activity:
        timestamps.append(latest_task_activity)
    if latest_file_activity:
        timestamps.append(latest_file_activity)

    Message = apps.get_model('communication', 'Message')
    Announcement = apps.get_model('communication', 'Announcement')
    MeetingPoll = apps.get_model('communication', 'MeetingPoll')

    latest_message = Message.objects.filter(channel__project=project).order_by('-created_at').values_list('created_at', flat=True).first()
    latest_announcement = Announcement.objects.filter(project=project).order_by('-created_at').values_list('created_at', flat=True).first()
    latest_meeting = MeetingPoll.objects.filter(project=project).order_by('-created_at').values_list('created_at', flat=True).first()
    if latest_message:
        timestamps.append(latest_message)
    if latest_announcement:
        timestamps.append(latest_announcement)
    if latest_meeting:
        timestamps.append(latest_meeting)

    return max([ts for ts in timestamps if ts], default=project.updated_at)


def _project_section_breakdown(project):
    sections = []
    for section in project.sections.all().order_by('order', 'created_at'):
        section_tasks = section.tasks.filter(is_cancelled=False)
        total = section_tasks.count()
        done = section_tasks.filter(status=Task.Status.DONE).count()
        overdue = section_tasks.exclude(status=Task.Status.DONE).filter(deadline__lt=timezone.now()).count()
        completion = int(round((done / total) * 100)) if total else 0
        status_label = 'On Track'
        if overdue > 0:
            status_label = 'Overdue'
        elif completion < 50 and total > 0:
            status_label = 'At Risk'
        sections.append({
            'section_id': section.id,
            'section_name': section.name,
            'total_tasks': total,
            'completed_tasks': done,
            'completion_percentage': completion,
            'section_deadline': section_tasks.order_by('-deadline').values_list('deadline', flat=True).first(),
            'status': status_label,
        })
    return sections


def _member_last_activity(project, member):
    timestamps = [
        TaskActivityLog.objects.filter(task__project=project, actor=member).order_by('-created_at').values_list('created_at', flat=True).first(),
        ProjectFileActivityLog.objects.filter(project=project, actor=member).order_by('-created_at').values_list('created_at', flat=True).first(),
    ]

    Message = apps.get_model('communication', 'Message')
    Announcement = apps.get_model('communication', 'Announcement')
    timestamps.append(Message.objects.filter(channel__project=project, sender=member).order_by('-created_at').values_list('created_at', flat=True).first())
    timestamps.append(Announcement.objects.filter(project=project, author=member).order_by('-created_at').values_list('created_at', flat=True).first())
    return max([ts for ts in timestamps if ts], default=None)


def _team_contribution(project):
    contributions = []
    memberships = TeamMembership.objects.filter(team=project.team).select_related('user')
    for membership in memberships:
        user = membership.user
        assigned_tasks = project.tasks.filter(assigned_to=user, is_cancelled=False)
        completed_tasks = assigned_tasks.filter(status=Task.Status.DONE)
        overdue_tasks = assigned_tasks.exclude(status=Task.Status.DONE).filter(deadline__lt=timezone.now())
        on_time_completed = completed_tasks.filter(completed_at__isnull=False, completed_at__lte=F('deadline')).count()
        completed_count = completed_tasks.count()
        on_time_rate = int(round((on_time_completed / completed_count) * 100)) if completed_count else 0
        current_active = assigned_tasks.filter(status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]).count()
        last_activity = _member_last_activity(project, user)
        stale_days = None
        if last_activity:
            stale_days = (timezone.now() - last_activity).days

        badge = 'Active'
        if overdue_tasks.count() >= 2 or stale_days is None or stale_days >= 3:
            badge = 'At Risk'
        elif overdue_tasks.count() > 0 or stale_days == 2:
            badge = 'Slow'

        contributions.append({
            'membership_id': membership.id,
            'member': UserSerializer(user).data,
            'role': membership.role,
            'tasks_assigned': assigned_tasks.count(),
            'tasks_completed': completed_count,
            'tasks_overdue': overdue_tasks.count(),
            'on_time_completion_rate': on_time_rate,
            'active_tasks': current_active,
            'last_activity': last_activity,
            'health_badge': badge,
        })
    return contributions


def _submission_checklist_payload(project):
    all_tasks = project.tasks.filter(is_cancelled=False)
    active_members = TeamMembership.objects.filter(team=project.team).select_related('user')
    has_final_file = project.project_files.filter(is_deleted=False, tag=ProjectFile.Tag.FINAL).exists()
    only_closable_statuses = all_tasks.exclude(status__in=[Task.Status.DONE, Task.Status.CANCELLED, Task.Status.UNDER_REVIEW]).count() == 0
    description_filled = bool((project.description or '').strip())
    lecturer_assigned = bool(project.supervisor_id)

    now = timezone.now()
    all_members_active = True
    for membership in active_members:
        last_activity = _member_last_activity(project, membership.user)
        if not last_activity or (now - last_activity).days > 7:
            all_members_active = False
            break

    return [
        {
            'item_type': SubmissionChecklist.ItemType.FINAL_FILE,
            'label': 'At least one Final-tagged file exists in the file library',
            'is_passed': has_final_file,
            'is_hard_block': True,
        },
        {
            'item_type': SubmissionChecklist.ItemType.TASKS_COMPLETE,
            'label': 'All tasks are Done, Cancelled, or Under Review',
            'is_passed': only_closable_statuses,
            'is_hard_block': False,
        },
        {
            'item_type': SubmissionChecklist.ItemType.TEAM_ACTIVE,
            'label': 'All team members are active in the last 7 days',
            'is_passed': all_members_active,
            'is_hard_block': False,
        },
        {
            'item_type': SubmissionChecklist.ItemType.DESCRIPTION_FILLED,
            'label': 'Project description is filled in',
            'is_passed': description_filled,
            'is_hard_block': False,
        },
        {
            'item_type': SubmissionChecklist.ItemType.LECTURER_ASSIGNED,
            'label': 'Linked lecturer is assigned',
            'is_passed': lecturer_assigned,
            'is_hard_block': False,
        },
    ]


def _upsert_submission_checklist(project, checklist_items, override_item_types=None, override_by=None):
    override_item_types = set(override_item_types or [])
    for item in checklist_items:
        defaults = {
            'is_passed': item['is_passed'],
            'override_acknowledged': item['item_type'] in override_item_types,
            'override_by': override_by if item['item_type'] in override_item_types else None,
        }
        SubmissionChecklist.objects.update_or_create(
            project=project,
            item_type=item['item_type'],
            defaults=defaults,
        )


def _project_burndown_payload(project):
    snapshots = list(project.snapshots.order_by('snapshot_date'))
    total_tasks = project.tasks.filter(is_cancelled=False).count()
    start_date = timezone.localtime(project.created_at).date() if project.created_at else timezone.localdate()
    end_date = project.deadline
    total_days = max((end_date - start_date).days, 1)

    ideal_line = []
    for offset in range(total_days + 1):
        point_date = start_date + timedelta(days=offset)
        remaining = max(total_tasks - ((total_tasks / total_days) * offset), 0)
        ideal_line.append({'date': point_date, 'remaining': round(remaining, 2)})

    if snapshots:
        actual_line = [
            {
                'date': snap.snapshot_date,
                'remaining': snap.metrics.get('remaining_tasks', 0),
            }
            for snap in snapshots
        ]
    else:
        remaining = project.tasks.filter(is_cancelled=False).exclude(status=Task.Status.DONE).count()
        actual_line = [{'date': timezone.localdate(), 'remaining': remaining}]

    projection = []
    if len(actual_line) >= 2:
        first_point = actual_line[0]
        last_point = actual_line[-1]
        days_spent = max((last_point['date'] - first_point['date']).days, 1)
        burn_rate = (first_point['remaining'] - last_point['remaining']) / days_spent
        forecast_remaining = float(last_point['remaining'])
        for offset in range(1, max((end_date - last_point['date']).days, 0) + 1):
            day = last_point['date'] + timedelta(days=offset)
            forecast_remaining = max(forecast_remaining - burn_rate, 0)
            projection.append({'date': day, 'remaining': round(forecast_remaining, 2)})

    return {
        'ideal': ideal_line,
        'actual': actual_line,
        'projection': projection,
    }


def _project_activity_timeline(project, activity_type='ALL', start_date=None, end_date=None):
    entries = []

    if activity_type in ['ALL', 'TASKS']:
        for log in TaskActivityLog.objects.filter(task__project=project).select_related('task', 'actor').order_by('-created_at')[:80]:
            entries.append({
                'type': 'TASK',
                'timestamp': log.created_at,
                'label': f"{log.actor.get_full_name() or log.actor.username if log.actor else 'System'} {log.get_action_type_display().lower()} task \"{log.task.title}\"",
                'task_id': log.task_id,
            })

    if activity_type in ['ALL', 'FILES']:
        for log in ProjectFileActivityLog.objects.filter(project=project).select_related('file', 'actor').order_by('-created_at')[:80]:
            actor_name = log.actor.get_full_name() or log.actor.username if log.actor else 'System'
            entries.append({
                'type': 'FILE',
                'timestamp': log.created_at,
                'label': f"{actor_name} {log.get_action_type_display().lower()} \"{log.file.display_name}\"",
                'file_id': log.file_id,
            })

    if activity_type in ['ALL', 'COMMUNICATION']:
        Announcement = apps.get_model('communication', 'Announcement')
        Message = apps.get_model('communication', 'Message')
        MeetingPoll = apps.get_model('communication', 'MeetingPoll')

        for announcement in Announcement.objects.filter(project=project).select_related('author').order_by('-created_at')[:40]:
            entries.append({
                'type': 'COMMUNICATION',
                'timestamp': announcement.created_at,
                'label': f"{announcement.author.get_full_name() or announcement.author.username} posted an announcement",
                'announcement_id': announcement.id,
            })
        for message in Message.objects.filter(channel__project=project).select_related('sender').order_by('-created_at')[:60]:
            entries.append({
                'type': 'COMMUNICATION',
                'timestamp': message.created_at,
                'label': f"{message.sender.get_full_name() or message.sender.username} sent a channel message",
                'message_id': message.id,
            })
        for poll in MeetingPoll.objects.filter(project=project).select_related('created_by').order_by('-created_at')[:30]:
            entries.append({
                'type': 'COMMUNICATION',
                'timestamp': poll.created_at,
                'label': f"{poll.created_by.get_full_name() or poll.created_by.username} created meeting poll \"{poll.title}\"",
                'meeting_poll_id': poll.id,
            })

    if start_date:
        entries = [entry for entry in entries if entry['timestamp'].date() >= start_date]
    if end_date:
        entries = [entry for entry in entries if entry['timestamp'].date() <= end_date]

    entries.sort(key=lambda item: item['timestamp'], reverse=True)
    return entries[:120]


def _project_at_risk_conditions(project):
    now = timezone.now()
    progress = _project_task_progress(project)
    elapsed = _project_time_elapsed_percent(project)
    overdue_count = project.tasks.filter(is_cancelled=False).exclude(status=Task.Status.DONE).filter(deadline__lt=now).count()
    latest_activity = _latest_project_activity_at(project)
    inactive = latest_activity is None or (now - latest_activity) > timedelta(hours=48)
    stale_blocked = project.tasks.filter(status=Task.Status.BLOCKED, updated_at__lte=now - timedelta(hours=24)).exists()
    no_final_file_near_deadline = _project_days_remaining(project) < 3 and not project.project_files.filter(is_deleted=False, tag=ProjectFile.Tag.FINAL).exists()

    conditions = []
    if progress < 30 and elapsed > 50:
        conditions.append((LecturerAlert.AlertType.LOW_PROGRESS, 'Progress is below 30% with more than half of project time elapsed.'))
    if overdue_count >= 3:
        conditions.append((LecturerAlert.AlertType.MANY_OVERDUE, 'Project has three or more overdue tasks.'))
    if inactive:
        conditions.append((LecturerAlert.AlertType.INACTIVE, 'No activity has been recorded in the last 48 hours.'))
    if stale_blocked:
        conditions.append((LecturerAlert.AlertType.BLOCKED_STALE, 'A task has remained blocked for more than 24 hours.'))
    if no_final_file_near_deadline:
        conditions.append((LecturerAlert.AlertType.NO_FINAL_FILE, 'No final-tagged file exists with less than three days to deadline.'))

    return conditions


def _general_section(project):
    section, _ = Section.objects.get_or_create(project=project, name='General', defaults={'order': 0})
    return section


def _general_folder(project):
    folder, _ = FileFolder.objects.get_or_create(project=project, name='General', defaults={'order': 0})
    return folder


ALLOWED_FILE_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.txt', '.odt', '.xlsx', '.xls', '.csv', '.pptx', '.ppt', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip'
}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
PROJECT_STORAGE_QUOTA_BYTES = 500 * 1024 * 1024


def _normalise_file_name(file_name):
    base_name = os.path.basename(file_name)
    root, ext = os.path.splitext(base_name)
    safe_root = re.sub(r'[^A-Za-z0-9._-]+', '_', root).strip('_') or 'file'
    safe_ext = ext.lower()
    return f'{safe_root}{safe_ext}'


def _extract_file_extension(file_name):
    return os.path.splitext(file_name)[1].lower()


def _validate_project_file_upload(uploaded_file):
    if not uploaded_file:
        raise PermissionDenied('A file is required')

    if uploaded_file.size > MAX_FILE_SIZE_BYTES:
        raise PermissionDenied('Files must be 50MB or smaller')

    file_extension = _extract_file_extension(uploaded_file.name)
    if file_extension not in ALLOWED_FILE_EXTENSIONS:
        allowed = ', '.join(sorted(ALLOWED_FILE_EXTENSIONS))
        raise PermissionDenied(f'Unsupported file type. Allowed types: {allowed}')

    mime_type, _ = mimetypes.guess_type(uploaded_file.name)
    return file_extension, mime_type or uploaded_file.content_type or 'application/octet-stream'


def _project_file_storage_usage(project):
    return project.project_files.filter(is_deleted=False).aggregate(total=Sum('file_size')).get('total') or 0


def expire_stale_invitations_for_queryset(queryset):
    now = timezone.now()
    stale = queryset.filter(status=Invitation.Status.PENDING, expires_at__lte=now).select_related('project', 'sender', 'receiver')
    expired_count = 0

    for invitation in stale:
        invitation.status = Invitation.Status.EXPIRED
        invitation.save(update_fields=['status'])
        expired_count += 1
        recipients = [invitation.sender, invitation.receiver]
        create_notification(
            recipients=recipients,
            notification_type=Notification.Type.INVITATION_EXPIRED,
            title='Invitation expired',
            message=f'Invitation for project "{invitation.project.title}" has expired.',
            project=invitation.project,
            invitation=invitation,
        )

    return expired_count


class ProjectViewSet(viewsets.ModelViewSet):
    """API endpoint for projects"""
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Students see projects they're members of
        if user.role == CustomUser.Role.STUDENT:
            user_teams = user.teammembership_set.all()
            project_ids = [tm.team.project.id for tm in user_teams]
            return Project.objects.filter(id__in=project_ids).order_by('deadline', '-created_at')
        
        # Lecturers see projects they supervise
        elif user.role == CustomUser.Role.LECTURER:
            return Project.objects.filter(supervisor=user).order_by('deadline', '-created_at')
        
        # Admins see all
        return Project.objects.all().order_by('deadline', '-created_at')
    
    def perform_create(self, serializer):
        """Create project and assign creator as leader"""
        project = serializer.save()

        if project.supervisor is None and self.request.user.role == CustomUser.Role.LECTURER and self.request.user.is_approved:
            project.supervisor = self.request.user
            project.save(update_fields=['supervisor'])
        
        # Create team
        team = Team.objects.create(project=project)
        
        # Add creator as leader
        TeamMembership.objects.create(
            user=self.request.user,
            team=team,
            role=Team.Role.LEADER
        )
        
        # If template was used, create milestones
        if project.template_used:
            for mt in project.template_used.milestone_templates.all():
                Milestone.objects.create(
                    project=project,
                    title=mt.title,
                    description=mt.description,
                    due_date=project.deadline
                )

    def _requester_membership(self, project, user):
        return TeamMembership.objects.filter(team=project.team, user=user).first()

    def _assert_leader_or_coleader(self, project, user):
        membership = self._requester_membership(project, user)
        if not membership or membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return None
        return membership
    
    @action(detail=True, methods=['get'])
    def team(self, request, pk=None):
        """Get team members for a project"""
        project = self.get_object()
        team = project.team
        serializer = TeamSerializer(team)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def milestones(self, request, pk=None):
        """Get milestones for a project"""
        project = self.get_object()
        milestones = project.milestones.all()
        serializer = MilestoneSerializer(milestones, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def task_board(self, request, pk=None):
        """Return the project task board payload for the kanban/list views."""
        project = self.get_object()
        sections = project.sections.all().order_by('order', 'created_at')
        tasks = project.tasks.select_related('section', 'assigned_to', 'created_by').prefetch_related('subtasks', 'comments', 'attachments', 'activity_logs')

        if not sections.exists():
            default_section = {
                'id': None,
                'project': project.id,
                'name': 'General',
                'order': 0,
                'created_at': project.created_at,
                'task_count': tasks.filter(section__isnull=True, is_cancelled=False).count(),
            }
            section_data = [default_section]
        else:
            section_data = SectionSerializer(sections, many=True).data

        serializer = TaskSerializer(tasks, many=True, context={'request': request})
        members = TeamSerializer(project.team).data.get('members', [])

        workload = []
        for membership in project.team.teammembership_set.select_related('user').all():
            member_tasks = tasks.filter(assigned_to=membership.user, is_cancelled=False)
            workload.append({
                'membership_id': membership.id,
                'user': UserSerializer(membership.user).data,
                'role': membership.role,
                'active_tasks': member_tasks.exclude(status=Task.Status.DONE).count(),
                'due_this_week': member_tasks.filter(
                    deadline__gte=timezone.now(),
                    deadline__lte=timezone.now() + timedelta(days=7),
                ).count(),
            })

        return Response({
            'project': ProjectSerializer(project, context={'request': request}).data,
            'sections': section_data,
            'tasks': serializer.data,
            'members': members,
            'workload': workload,
            'progress_percentage': _project_task_progress(project),
        })

    @action(detail=True, methods=['get'])
    def recent_files(self, request, pk=None):
        project = self.get_object()
        files = project.project_files.filter(is_deleted=False).select_related(
            'uploaded_by', 'folder', 'current_version_file', 'linked_task'
        ).order_by('-current_version_file__upload_timestamp', '-upload_timestamp')[:5]
        serializer = ProjectFileSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='dashboard/personal')
    def personal_dashboard(self, request):
        user = request.user

        if user.role == CustomUser.Role.STUDENT:
            memberships = TeamMembership.objects.filter(user=user).select_related('team__project')
            projects = [membership.team.project for membership in memberships]
        elif user.role == CustomUser.Role.LECTURER:
            projects = list(Project.objects.filter(supervisor=user).select_related('supervisor'))
        else:
            projects = list(Project.objects.all().select_related('supervisor')[:20])

        now = timezone.now()
        end_due_soon = now + timedelta(days=3)
        project_ids = [project.id for project in projects]

        my_tasks_qs = Task.objects.filter(assigned_to=user, project_id__in=project_ids, is_cancelled=False).exclude(status=Task.Status.DONE)
        overdue_tasks = my_tasks_qs.filter(deadline__lt=now).order_by('deadline')
        due_soon_tasks = my_tasks_qs.filter(deadline__gte=now, deadline__lte=end_due_soon).order_by('deadline')
        upcoming_tasks = my_tasks_qs.filter(deadline__gt=end_due_soon).order_by('deadline')
        completed_tasks = Task.objects.filter(assigned_to=user, project_id__in=project_ids, status=Task.Status.DONE).order_by('-completed_at')[:20]

        project_cards = []
        for project in sorted(projects, key=lambda p: p.deadline):
            membership = TeamMembership.objects.filter(team=project.team, user=user).first() if hasattr(project, 'team') else None
            incomplete_assigned_count = Task.objects.filter(project=project, assigned_to=user, is_cancelled=False).exclude(status=Task.Status.DONE).count()
            project_cards.append({
                'id': project.id,
                'title': project.title,
                'course_code': project.course_code,
                'role': membership.role if membership else ('SUPERVISOR' if project.supervisor_id == user.id else 'VIEWER'),
                'progress_percentage': _project_task_progress(project),
                'days_remaining': _project_days_remaining(project),
                'deadline': project.deadline,
                'deadline_status': 'RED' if _project_days_remaining(project) < 3 else ('AMBER' if _project_days_remaining(project) <= 7 else 'GREEN'),
                'assigned_incomplete_count': incomplete_assigned_count,
                'last_activity': _latest_project_activity_at(project),
                'lifecycle_status': project.lifecycle_status,
            })

        activity_feed = []
        for project in projects:
            activity_feed.extend(_project_activity_timeline(project, activity_type='ALL')[:8])
        activity_feed.sort(key=lambda item: item['timestamp'], reverse=True)

        calendar_items = []
        event_queryset = CalendarEvent.objects.filter(project_id__in=project_ids)
        if user.role == CustomUser.Role.STUDENT:
            event_queryset = event_queryset.filter(is_visible_to_all_members=True)
        for event in event_queryset.order_by('start_datetime')[:120]:
            calendar_items.append({
                'id': event.id,
                'project_id': event.project_id,
                'title': event.title,
                'event_type': event.event_type,
                'start_datetime': event.start_datetime,
                'end_datetime': event.end_datetime,
            })

        unread_notifications = Notification.objects.filter(recipient=user, read_at__isnull=True).select_related('project')[:5]

        return Response({
            'greeting_name': user.first_name or user.username,
            'projects': project_cards,
            'tasks': {
                'overdue': TaskSerializer(overdue_tasks[:100], many=True, context={'request': request}).data,
                'due_soon': TaskSerializer(due_soon_tasks[:100], many=True, context={'request': request}).data,
                'upcoming': TaskSerializer(upcoming_tasks[:100], many=True, context={'request': request}).data,
                'completed': TaskSerializer(completed_tasks, many=True, context={'request': request}).data,
            },
            'activity_feed': activity_feed[:20],
            'calendar_items': calendar_items,
            'notifications_preview': NotificationSerializer(unread_notifications, many=True).data,
            'summary': {
                'due_today_count': my_tasks_qs.filter(deadline__date=timezone.localdate()).count(),
                'active_project_count': len(projects),
                'overdue_count': overdue_tasks.count(),
            },
        })

    @action(detail=False, methods=['get'], url_path='dashboard/lecturer')
    def lecturer_dashboard(self, request):
        if request.user.role != CustomUser.Role.LECTURER:
            return Response({'error': 'Only lecturers can access this dashboard'}, status=status.HTTP_403_FORBIDDEN)

        projects = Project.objects.filter(supervisor=request.user).prefetch_related('team__teammembership_set__user').order_by('course_code', 'deadline')
        grouped = {}
        comparison_rows = []
        active_alert_ids = []

        for project in projects:
            course_code = project.course_code or 'UNASSIGNED'
            grouped.setdefault(course_code, []).append(project.id)

            statuses = _project_task_status_counts(project)
            total_tasks = project.tasks.filter(is_cancelled=False).count()
            done_tasks = statuses['DONE']
            overdue_tasks = project.tasks.filter(is_cancelled=False).exclude(status=Task.Status.DONE).filter(deadline__lt=timezone.now()).count()
            final_files = project.project_files.filter(is_deleted=False, tag=ProjectFile.Tag.FINAL).count()
            latest_activity = _latest_project_activity_at(project)
            progress = _project_task_progress(project)
            member_count = TeamMembership.objects.filter(team=project.team).count()
            comparison_rows.append({
                'project_id': project.id,
                'project_name': project.title,
                'course_code': project.course_code,
                'members_count': member_count,
                'overall_progress_percentage': progress,
                'tasks': {
                    'total': total_tasks,
                    'done': done_tasks,
                    'overdue': overdue_tasks,
                },
                'files': {
                    'total': project.project_files.filter(is_deleted=False).count(),
                    'finals_uploaded': final_files,
                },
                'last_activity': latest_activity,
                'submission_deadline': project.deadline,
                'status': 'Submitted' if project.lifecycle_status == Project.LifecycleStatus.SUBMITTED else (
                    'At Risk' if _project_at_risk_conditions(project) else ('Not Started' if progress == 0 else 'On Track')
                ),
                'lifecycle_status': project.lifecycle_status,
            })

            conditions = _project_at_risk_conditions(project)
            for alert_type, message in conditions:
                alert, _ = LecturerAlert.objects.get_or_create(
                    lecturer=request.user,
                    project=project,
                    alert_type=alert_type,
                    is_resolved=False,
                    defaults={'alert_message': message},
                )
                if alert.alert_message != message:
                    alert.alert_message = message
                    alert.save(update_fields=['alert_message'])
                active_alert_ids.append(alert.id)

            LecturerAlert.objects.filter(
                lecturer=request.user,
                project=project,
                is_resolved=False,
            ).exclude(id__in=active_alert_ids).update(is_resolved=True, resolved_at=timezone.now())

        readiness = []
        for project in projects:
            checks = _submission_checklist_payload(project)
            readiness.append({
                'project_id': project.id,
                'project_name': project.title,
                'checks': checks,
                'is_submission_ready': all(item['is_passed'] for item in checks),
            })

        alerts = LecturerAlert.objects.filter(lecturer=request.user, is_resolved=False).select_related('project').order_by('-triggered_at')
        grouped_payload = []
        for course_code, project_ids in grouped.items():
            grouped_payload.append({
                'course_code': course_code,
                'project_ids': project_ids,
            })

        return Response({
            'courses': grouped_payload,
            'comparison_rows': comparison_rows,
            'alerts': LecturerAlertSerializer(alerts, many=True).data,
            'submission_readiness': readiness,
            'all_on_track': len(alerts) == 0,
        })

    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        project = self.get_object()
        statuses = _project_task_status_counts(project)
        total_tasks = project.tasks.filter(is_cancelled=False).count()
        days_remaining = _project_days_remaining(project)
        progress = _project_task_progress(project)
        time_elapsed = _project_time_elapsed_percent(project)
        overdue = project.tasks.filter(is_cancelled=False).exclude(status=Task.Status.DONE).filter(deadline__lt=timezone.now()).count()
        blocked = project.tasks.filter(status=Task.Status.BLOCKED).count()

        contribution = _team_contribution(project)
        team_health = 'All Active'
        if any(item['health_badge'] == 'At Risk' for item in contribution):
            team_health = 'Critical Issues'
        elif any(item['health_badge'] == 'Slow' for item in contribution):
            team_health = 'Some Behind'

        workload = []
        for item in contribution:
            member_id = item['member']['id']
            member_tasks = project.tasks.filter(assigned_to_id=member_id, is_cancelled=False)
            workload.append({
                'member': item['member'],
                'done': member_tasks.filter(status=Task.Status.DONE).count(),
                'in_progress': member_tasks.filter(status=Task.Status.IN_PROGRESS).count(),
                'todo': member_tasks.filter(status=Task.Status.TODO).count(),
                'overdue': member_tasks.exclude(status=Task.Status.DONE).filter(deadline__lt=timezone.now()).count(),
            })

        Message = apps.get_model('communication', 'Message')
        Announcement = apps.get_model('communication', 'Announcement')
        MeetingPoll = apps.get_model('communication', 'MeetingPoll')

        channel_message_count_7d = Message.objects.filter(
            channel__project=project,
            created_at__gte=timezone.now() - timedelta(days=7),
        ).count()
        most_active_channel = (
            Message.objects.filter(channel__project=project)
            .values('channel__id', 'channel__slug')
            .annotate(total=Count('id'))
            .order_by('-total')
            .first()
        )

        latest_announcement = Announcement.objects.filter(project=project).order_by('-created_at').first()
        unread_announcement_warning = False
        if latest_announcement:
            unread_announcement_warning = TeamMembership.objects.filter(team=project.team).exclude(user=latest_announcement.author).exists()

        communication_summary = {
            'messages_last_7_days': channel_message_count_7d,
            'most_active_channel': most_active_channel['channel__slug'] if most_active_channel else None,
            'unread_announcements_warning': unread_announcement_warning,
            'upcoming_confirmed_meetings': MeetingPoll.objects.filter(project=project, confirmed_slot__start_datetime__gte=timezone.now()).count(),
        }

        storage_used = _project_file_storage_usage(project)
        latest_file = project.project_files.filter(is_deleted=False).order_by('-upload_timestamp').first()
        file_summary = {
            'uploaded_last_7_days': project.project_files.filter(is_deleted=False, upload_timestamp__gte=timezone.now() - timedelta(days=7)).count(),
            'final_files_count': project.project_files.filter(is_deleted=False, tag=ProjectFile.Tag.FINAL).count(),
            'most_recent_file': ProjectFileSerializer(latest_file, context={'request': request}).data if latest_file else None,
            'storage_used_bytes': storage_used,
            'storage_quota_bytes': PROJECT_STORAGE_QUOTA_BYTES,
        }

        return Response({
            'project_id': project.id,
            'project_health': {
                'overall_progress_percentage': progress,
                'time_remaining_days': days_remaining,
                'time_elapsed_percentage': time_elapsed,
                'tasks_health': {
                    'done': statuses['DONE'],
                    'in_progress': statuses['IN_PROGRESS'],
                    'overdue': overdue,
                    'blocked': blocked,
                },
                'team_health': team_health,
                'interpretation': f'Project is {progress}% complete with {max(days_remaining, 0)} day(s) remaining. {overdue} task(s) are overdue and {blocked} task(s) are blocked.',
            },
            'overview_widgets': {
                'total_tasks': total_tasks,
                'completed_tasks': statuses['DONE'],
                'overdue_tasks': overdue,
                'blocked_tasks': blocked,
                'files_uploaded': project.project_files.filter(is_deleted=False).count(),
                'days_to_deadline': days_remaining,
            },
            'task_progress_breakdown': statuses,
            'burndown': _project_burndown_payload(project),
            'section_progress': _project_section_breakdown(project),
            'team_contribution': contribution,
            'workload_distribution': workload,
            'file_activity_summary': file_summary,
            'communication_summary': communication_summary,
        })

    @action(detail=True, methods=['get'])
    def activity_timeline(self, request, pk=None):
        project = self.get_object()
        activity_type = (request.query_params.get('type') or 'ALL').upper()
        start_date_raw = request.query_params.get('start_date')
        end_date_raw = request.query_params.get('end_date')

        start_date = None
        end_date = None
        if start_date_raw:
            try:
                start_date = date.fromisoformat(start_date_raw)
            except ValueError:
                return Response({'error': 'Invalid start_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        if end_date_raw:
            try:
                end_date = date.fromisoformat(end_date_raw)
            except ValueError:
                return Response({'error': 'Invalid end_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(_project_activity_timeline(project, activity_type=activity_type, start_date=start_date, end_date=end_date))

    @action(detail=True, methods=['get'])
    def submission_checklist(self, request, pk=None):
        project = self.get_object()
        checklist_items = _submission_checklist_payload(project)
        _upsert_submission_checklist(project, checklist_items)

        serialized = SubmissionChecklistSerializer(project.submission_checklist_items.all(), many=True).data
        return Response({
            'items': checklist_items,
            'records': serialized,
            'final_file_uploaded': next((item['is_passed'] for item in checklist_items if item['item_type'] == SubmissionChecklist.ItemType.FINAL_FILE), False),
            'all_required_items_complete': all(item['is_passed'] for item in checklist_items),
        })

    @action(detail=False, methods=['get'])
    def search_by_course_code(self, request):
        """Allow lecturers to find projects by course code and monitor them."""
        if request.user.role != CustomUser.Role.LECTURER:
            return Response({'error': 'Only lecturers can search by course code'}, status=status.HTTP_403_FORBIDDEN)

        course_code = (request.query_params.get('course_code') or '').strip()
        if not course_code:
            return Response([])

        projects = Project.objects.filter(course_code__iexact=course_code).select_related('supervisor').order_by('deadline', '-created_at')
        serializer = ProjectSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def link_lecturer(self, request, pk=None):
        """Attach the current lecturer to a project when the course code matches."""
        if request.user.role != CustomUser.Role.LECTURER:
            return Response({'error': 'Only lecturers can link to projects'}, status=status.HTTP_403_FORBIDDEN)

        project = get_object_or_404(Project.objects.select_related('supervisor'), pk=pk)
        if not project.course_code:
            return Response({'error': 'Project does not have a course code'}, status=status.HTTP_400_BAD_REQUEST)

        requested_code = (request.data.get('course_code') or '').strip()
        if requested_code and requested_code.lower() != project.course_code.lower():
            return Response({'error': 'Course code does not match this project'}, status=status.HTTP_400_BAD_REQUEST)

        if project.supervisor_id and project.supervisor_id != request.user.id:
            return Response({'error': 'This project is already linked to another lecturer'}, status=status.HTTP_409_CONFLICT)

        project.supervisor = request.user
        project.save(update_fields=['supervisor'])

        serializer = ProjectSerializer(project, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def pending_invitations(self, request, pk=None):
        """Get pending invitations for a project (leaders/co-leaders only)."""
        project = self.get_object()

        requester_membership = TeamMembership.objects.filter(
            team=project.team,
            user=request.user
        ).first()

        if not requester_membership or requester_membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return Response(
                {'error': 'Only leaders and co-leaders can view pending invitations'},
                status=status.HTTP_403_FORBIDDEN
            )

        invitations = Invitation.objects.filter(
            project=project,
            status=Invitation.Status.PENDING
        ).select_related('sender', 'receiver')

        serializer = InvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def invitations_overview(self, request, pk=None):
        """Get invitations for a project, with optional status filtering (leaders/co-leaders only)."""
        project = self.get_object()

        requester_membership = TeamMembership.objects.filter(
            team=project.team,
            user=request.user
        ).first()

        if not requester_membership or requester_membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return Response(
                {'error': 'Only leaders and co-leaders can view project invitations'},
                status=status.HTTP_403_FORBIDDEN
            )

        status_filter = (request.query_params.get('status') or '').strip().upper()

        invitations = Invitation.objects.filter(project=project).select_related('sender', 'receiver')
        if status_filter and status_filter in dict(Invitation.Status.choices):
            invitations = invitations.filter(status=status_filter)

        invitations = invitations.order_by('-sent_at')
        serializer = InvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def candidate_students(self, request, pk=None):
        """Search students that can be invited to a project."""
        project = self.get_object()

        requester_membership = TeamMembership.objects.filter(
            team=project.team,
            user=request.user
        ).first()

        if not requester_membership or requester_membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return Response(
                {'error': 'Only leaders and co-leaders can search candidates'},
                status=status.HTTP_403_FORBIDDEN
            )

        q = (request.query_params.get('q') or '').strip()

        team_user_ids = TeamMembership.objects.filter(team=project.team).values_list('user_id', flat=True)

        invited_user_ids = Invitation.objects.filter(
            project=project,
            status=Invitation.Status.PENDING
        ).values_list('receiver_id', flat=True)

        students = CustomUser.objects.filter(role=CustomUser.Role.STUDENT).exclude(
            id__in=list(team_user_ids) + list(invited_user_ids)
        )

        if q:
            students = students.filter(
                Q(username__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
                | Q(email__icontains=q)
            )

        serializer = UserSerializer(students[:50], many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        """Invite a student to the project (leaders/co-leaders only)."""
        project = self.get_object()

        requester_membership = TeamMembership.objects.filter(
            team=project.team,
            user=request.user
        ).first()

        if not requester_membership or requester_membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return Response(
                {'error': 'Only leaders and co-leaders can send invitations'},
                status=status.HTTP_403_FORBIDDEN
            )

        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response({'error': 'receiver_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        receiver = get_object_or_404(CustomUser, id=receiver_id, role=CustomUser.Role.STUDENT)

        already_member = TeamMembership.objects.filter(team=project.team, user=receiver).exists()
        if already_member:
            return Response({'error': 'User is already a team member'}, status=status.HTTP_400_BAD_REQUEST)

        if Invitation.objects.filter(project=project, receiver=receiver, status=Invitation.Status.PENDING).exists():
            return Response({'error': 'A pending invitation already exists for this user'}, status=status.HTTP_400_BAD_REQUEST)

        invitation = Invitation.objects.create(
            project=project,
            sender=request.user,
            receiver=receiver,
            status=Invitation.Status.PENDING,
            expires_at=timezone.now() + timedelta(days=7),
        )

        create_notification(
            recipients=[receiver],
            notification_type=Notification.Type.INVITATION,
            title='New project invitation',
            message=f'You have been invited to join "{project.title}".',
            project=project,
            invitation=invitation,
        )
        maybe_send_email(
            subject=f'Invitation to join {project.title}',
            message=f'You were invited to join the project "{project.title}". Please respond before {invitation.expires_at.date()}.',
            recipient_list=[receiver.email] if receiver.email else [],
        )

        serializer = InvitationSerializer(invitation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submit_project(self, request, pk=None):
        project = self.get_object()
        membership = self._assert_leader_or_coleader(project, request.user)
        if not membership:
            return Response({'error': 'Only leaders and co-leaders can submit a project'}, status=status.HTTP_403_FORBIDDEN)

        if project.lifecycle_status != Project.LifecycleStatus.ACTIVE:
            return Response({'error': 'Only active projects can be submitted'}, status=status.HTTP_400_BAD_REQUEST)

        checklist_items = _submission_checklist_payload(project)
        _upsert_submission_checklist(project, checklist_items)

        final_file_item = next(item for item in checklist_items if item['item_type'] == SubmissionChecklist.ItemType.FINAL_FILE)
        warning_items = [item for item in checklist_items if not item['is_hard_block'] and not item['is_passed']]
        hard_block_items = [item for item in checklist_items if item['is_hard_block'] and not item['is_passed']]

        if hard_block_items:
            return Response(
                {
                    'error': 'Project submission requires at least one file tagged as Final in the File Library',
                    'submission_checklist': checklist_items,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        acknowledged_overrides = set(request.data.get('acknowledged_overrides') or [])
        missing_acknowledgements = [item['item_type'] for item in warning_items if item['item_type'] not in acknowledged_overrides]
        if missing_acknowledgements:
            return Response(
                {
                    'error': 'Please acknowledge all checklist warnings before submitting',
                    'missing_acknowledgements': missing_acknowledgements,
                    'submission_checklist': checklist_items,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        _upsert_submission_checklist(
            project,
            checklist_items,
            override_item_types=acknowledged_overrides,
            override_by=request.user,
        )

        project.lifecycle_status = Project.LifecycleStatus.SUBMITTED
        project.save(update_fields=['lifecycle_status', 'updated_at'])

        recipients = list(project.team.members.all())
        if project.supervisor:
            recipients.append(project.supervisor)
        create_notification(
            recipients=recipients,
            notification_type=Notification.Type.PROJECT,
            title='Project submitted',
            message=f'Project "{project.title}" has been submitted.',
            project=project,
        )
        maybe_send_email(
            subject=f'Project submitted: {project.title}',
            message=f'The project "{project.title}" has been submitted.',
            recipient_list=[u.email for u in recipients if u and u.email],
        )

        return Response(
            {
                'message': 'Project submitted',
                'lifecycle_status': project.lifecycle_status,
                'submission_checklist': checklist_items,
                'final_file_uploaded': final_file_item['is_passed'],
                'all_required_items_complete': all(item['is_passed'] for item in checklist_items),
            }
        )

    @action(detail=True, methods=['post'])
    def archive_project(self, request, pk=None):
        project = self.get_object()
        membership = self._requester_membership(project, request.user)
        allowed = request.user.role == CustomUser.Role.ADMIN or (project.supervisor_id == request.user.id)
        if membership and membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            allowed = True

        if not allowed:
            return Response({'error': 'You do not have permission to archive this project'}, status=status.HTTP_403_FORBIDDEN)

        if project.lifecycle_status not in [Project.LifecycleStatus.ACTIVE, Project.LifecycleStatus.SUBMITTED]:
            return Response({'error': 'Only active or submitted projects can be archived'}, status=status.HTTP_400_BAD_REQUEST)

        project.lifecycle_status = Project.LifecycleStatus.ARCHIVED
        project.save(update_fields=['lifecycle_status', 'updated_at'])

        Task.objects.filter(project=project, is_cancelled=False).update(
            status=Task.Status.CANCELLED,
            is_cancelled=True,
            cancelled_at=timezone.now(),
            cancellation_reason='Project archived',
        )

        recipients = list(project.team.members.all())
        if project.supervisor:
            recipients.append(project.supervisor)
        create_notification(
            recipients=recipients,
            notification_type=Notification.Type.PROJECT,
            title='Project archived',
            message=f'Project "{project.title}" has been archived.',
            project=project,
        )

        return Response({'message': 'Project archived', 'lifecycle_status': project.lifecycle_status})

    @action(detail=True, methods=['post'])
    def transfer_ownership(self, request, pk=None):
        project = self.get_object()
        requester_membership = self._requester_membership(project, request.user)
        if not requester_membership or requester_membership.role != Team.Role.LEADER:
            return Response({'error': 'Only a leader can transfer ownership'}, status=status.HTTP_403_FORBIDDEN)

        new_leader_id = request.data.get('new_leader_id')
        if not new_leader_id:
            return Response({'error': 'new_leader_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        new_leader_membership = TeamMembership.objects.filter(team=project.team, user_id=new_leader_id).first()
        if not new_leader_membership:
            return Response({'error': 'Selected user is not a team member'}, status=status.HTTP_400_BAD_REQUEST)

        if new_leader_membership.user_id == request.user.id:
            return Response({'error': 'Cannot transfer ownership to yourself'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            requester_membership.role = Team.Role.CO_LEADER
            requester_membership.save(update_fields=['role'])
            new_leader_membership.role = Team.Role.LEADER
            new_leader_membership.save(update_fields=['role'])

        create_notification(
            recipients=[request.user, new_leader_membership.user],
            notification_type=Notification.Type.PROJECT,
            title='Project ownership transferred',
            message=f'Ownership for "{project.title}" was transferred to {new_leader_membership.user.get_full_name() or new_leader_membership.user.username}.',
            project=project,
        )

        return Response({'message': 'Ownership transferred successfully'})

    @action(detail=True, methods=['post'])
    def leave_team(self, request, pk=None):
        project = self.get_object()
        membership = self._requester_membership(project, request.user)
        if not membership:
            return Response({'error': 'You are not a member of this team'}, status=status.HTTP_400_BAD_REQUEST)

        if membership.role == Team.Role.LEADER:
            leaders_count = TeamMembership.objects.filter(team=project.team, role=Team.Role.LEADER).count()
            if leaders_count <= 1:
                return Response({'error': 'Leader cannot leave without transferring ownership first'}, status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        create_notification(
            recipients=list(project.team.members.all()),
            notification_type=Notification.Type.PROJECT,
            title='Team member left',
            message=f'{request.user.get_full_name() or request.user.username} left project "{project.title}".',
            project=project,
        )

        return Response({'message': 'You have left the team'})


class TeamMembershipViewSet(viewsets.ModelViewSet):
    """API endpoint for team memberships"""
    queryset = TeamMembership.objects.all()
    serializer_class = TeamMembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Students see memberships of projects they're in
        if user.role == CustomUser.Role.STUDENT:
            user_teams = user.teammembership_set.all()
            team_ids = [tm.team.id for tm in user_teams]
            return TeamMembership.objects.filter(team_id__in=team_ids)
        
        # Lecturers see memberships of projects they supervise
        elif user.role == CustomUser.Role.LECTURER:
            supervised_projects = Project.objects.filter(supervisor=user)
            team_ids = [p.team.id for p in supervised_projects]
            return TeamMembership.objects.filter(team_id__in=team_ids)
        
        # Admins see all
        return TeamMembership.objects.all()
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change a member's role (leader/co-leader only)"""
        membership = self.get_object()
        new_role = request.data.get('role')
        
        # Check if requester is leader or co-leader
        requester_membership = TeamMembership.objects.filter(
            team=membership.team,
            user=request.user
        ).first()
        
        if not requester_membership or requester_membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return Response(
                {'error': 'Only leaders and co-leaders can change roles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if new_role not in dict(Team.Role.choices):
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if removing last leader
        if membership.role == Team.Role.LEADER and new_role != Team.Role.LEADER:
            leaders_count = TeamMembership.objects.filter(
                team=membership.team,
                role=Team.Role.LEADER
            ).count()
            
            if leaders_count <= 1:
                return Response(
                    {'error': 'Cannot remove the last leader'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.role = new_role
        membership.save()
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        membership = self.get_object()
        requester_membership = TeamMembership.objects.filter(team=membership.team, user=request.user).first()

        requester_is_admin = request.user.role == CustomUser.Role.ADMIN
        requester_is_target = membership.user_id == request.user.id
        requester_is_leadership = requester_membership and requester_membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]

        if not (requester_is_admin or requester_is_target or requester_is_leadership):
            return Response({'error': 'You do not have permission to remove this member'}, status=status.HTTP_403_FORBIDDEN)

        if membership.role == Team.Role.LEADER:
            leaders_count = TeamMembership.objects.filter(team=membership.team, role=Team.Role.LEADER).count()
            if leaders_count <= 1:
                return Response({'error': 'Cannot remove the last leader'}, status=status.HTTP_400_BAD_REQUEST)

        member_name = membership.user.get_full_name() or membership.user.username
        project = membership.team.project
        membership.delete()

        create_notification(
            recipients=list(project.team.members.all()),
            notification_type=Notification.Type.PROJECT,
            title='Team updated',
            message=f'{member_name} was removed from "{project.title}".',
            project=project,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class MilestoneViewSet(viewsets.ModelViewSet):
    """API endpoint for milestones"""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Students see milestones of projects they're in
        if user.role == CustomUser.Role.STUDENT:
            user_teams = user.teammembership_set.all()
            project_ids = [tm.team.project.id for tm in user_teams]
            return Milestone.objects.filter(project_id__in=project_ids)
        
        # Lecturers see milestones of projects they supervise
        elif user.role == CustomUser.Role.LECTURER:
            supervised_projects = Project.objects.filter(supervisor=user)
            return Milestone.objects.filter(project__in=supervised_projects)
        
        # Admins see all
        return Milestone.objects.all()

    def perform_create(self, serializer):
        milestone = serializer.save()
        recipients = list(milestone.project.team.members.all())
        if milestone.project.supervisor:
            recipients.append(milestone.project.supervisor)
        create_notification(
            recipients=recipients,
            notification_type=Notification.Type.MILESTONE,
            title='New milestone created',
            message=f'"{milestone.title}" was added to project "{milestone.project.title}".',
            project=milestone.project,
            milestone=milestone,
        )

    def perform_update(self, serializer):
        previous = self.get_object()
        previous_status = previous.status
        milestone = serializer.save()

        if previous_status != milestone.status:
            recipients = list(milestone.project.team.members.all())
            if milestone.project.supervisor:
                recipients.append(milestone.project.supervisor)
            create_notification(
                recipients=recipients,
                notification_type=Notification.Type.MILESTONE,
                title='Milestone status updated',
                message=f'Milestone "{milestone.title}" is now {milestone.get_status_display()}.',
                project=milestone.project,
                milestone=milestone,
            )


class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Section.objects.select_related('project', 'project__supervisor')
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)

        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)

    def perform_create(self, serializer):
        project = serializer.validated_data.get('project')
        if not _member_is_leadership(project, self.request.user) and self.request.user.role != CustomUser.Role.ADMIN:
            raise PermissionDenied('Only leaders and co-leaders can create sections')
        serializer.save()


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.select_related('project', 'project__supervisor', 'section', 'assigned_to', 'created_by')\
            .prefetch_related('subtasks', 'comments', 'attachments', 'activity_logs')
        project_id = self.request.query_params.get('project')
        section_id = self.request.query_params.get('section')
        status_filter = self.request.query_params.get('status')
        assignee_id = self.request.query_params.get('assigned_to')
        tag = self.request.query_params.get('tag')
        my_tasks = self.request.query_params.get('my_tasks')

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if assignee_id:
            queryset = queryset.filter(assigned_to_id=assignee_id)
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        if my_tasks == '1':
            queryset = queryset.filter(assigned_to=self.request.user)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)

        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)

    def _assert_task_permission(self, task, allow_assigned=False):
        if self.request.user.role == CustomUser.Role.ADMIN:
            return
        if _member_is_leadership(task.project, self.request.user):
            return
        if allow_assigned and task.assigned_to_id == self.request.user.id:
            return
        raise PermissionDenied('You do not have permission for this task action')

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        if not _member_is_leadership(project, self.request.user) and self.request.user.role != CustomUser.Role.ADMIN:
            raise PermissionDenied('Only leaders and co-leaders can create tasks')

        task = serializer.save(
            created_by=self.request.user,
            status=Task.Status.TODO,
            progress_percentage=0,
            section=serializer.validated_data.get('section') or None,
        )

        if task.assigned_to:
            message = f'You have been assigned a new task: "{task.title}" in {task.project.title}. Deadline: {timezone.localtime(task.deadline).date()}.'
            _notify_task(
                task=task,
                recipients=[task.assigned_to],
                notification_type=Notification.Type.TASK_ASSIGNED,
                title='Task assigned',
                message=message,
            )

        _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.CREATED, new_value=task.status)

    def perform_update(self, serializer):
        task = self.get_object()
        self._assert_task_permission(task, allow_assigned=True)

        old_status = task.status
        old_assignee = task.assigned_to
        old_progress = task.progress_percentage
        old_section = task.section
        old_priority = task.priority
        old_deadline = task.deadline

        task = serializer.save()

        if old_assignee_id := getattr(old_assignee, 'id', None) != getattr(task.assigned_to, 'id', None):
            pass

        if old_assignee != task.assigned_to:
            _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.REASSIGNED, old_value=getattr(old_assignee, 'username', ''), new_value=getattr(task.assigned_to, 'username', ''))
            recipients = [task.assigned_to, old_assignee]
            _notify_task(
                task=task,
                recipients=recipients,
                notification_type=Notification.Type.TASK_REASSIGNED,
                title='Task reassigned',
                message=f'Task "{task.title}" has been reassigned in {task.project.title}.',
            )

        if old_status != task.status:
            if task.status == Task.Status.IN_PROGRESS and not task.in_progress_at:
                task.in_progress_at = timezone.now()
                task.save(update_fields=['in_progress_at'])
            if task.status == Task.Status.UNDER_REVIEW and not task.under_review_at:
                task.under_review_at = timezone.now()
                task.save(update_fields=['under_review_at'])
            if task.status == Task.Status.DONE and not task.completed_at:
                task.completed_at = timezone.now()
                task.save(update_fields=['completed_at'])
            if task.status == Task.Status.BLOCKED and not task.blocked_reason:
                task.blocked_reason = serializer.validated_data.get('blocked_reason', task.blocked_reason)
                task.save(update_fields=['blocked_reason'])

            _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.STATUS_CHANGED, old_value=old_status, new_value=task.status)

            notification_type = Notification.Type.TASK_STATUS_CHANGED
            if task.status == Task.Status.BLOCKED:
                notification_type = Notification.Type.TASK_BLOCKED
            recipients = []
            if task.assigned_to:
                recipients.append(task.assigned_to)
            recipients.extend(project_member.user for project_member in _project_members(task.project) if project_member.user_id != getattr(task.assigned_to, 'id', None))
            _notify_task(
                task=task,
                recipients=recipients,
                notification_type=notification_type,
                title='Task updated',
                message=f'Task "{task.title}" changed to {task.status}.',
            )

        if old_progress != task.progress_percentage:
            _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.DETAILS_UPDATED, old_value=old_progress, new_value=task.progress_percentage)

        if old_section != task.section:
            _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.DETAILS_UPDATED, old_value=getattr(old_section, 'name', ''), new_value=getattr(task.section, 'name', 'General'))

        if old_priority != task.priority:
            _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.DETAILS_UPDATED, old_value=old_priority, new_value=task.priority)

        if old_deadline != task.deadline:
            _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.DETAILS_UPDATED, old_value=old_deadline, new_value=task.deadline)

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        task = self.get_object()
        self._assert_task_permission(task, allow_assigned=True)
        next_status = request.data.get('status')
        blocked_reason = (request.data.get('blocked_reason') or '').strip()

        if next_status not in dict(Task.Status.choices):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        if next_status == Task.Status.DONE and not _member_is_leadership(task.project, request.user):
            return Response({'error': 'Only leaders can mark a task as done'}, status=status.HTTP_403_FORBIDDEN)

        if next_status == Task.Status.BLOCKED and not blocked_reason:
            return Response({'error': 'Blocked tasks require a reason'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = task.status
        task.status = next_status
        task.progress_percentage = _task_progress_from_status(task)
        if next_status == Task.Status.IN_PROGRESS and not task.in_progress_at:
            task.in_progress_at = timezone.now()
        if next_status == Task.Status.UNDER_REVIEW and not task.under_review_at:
            task.under_review_at = timezone.now()
        if next_status == Task.Status.DONE and not task.completed_at:
            task.completed_at = timezone.now()
        if next_status == Task.Status.BLOCKED:
            task.blocked_reason = blocked_reason
        task.save(update_fields=['status', 'progress_percentage', 'in_progress_at', 'under_review_at', 'completed_at', 'blocked_reason', 'updated_at'])

        _log_task_activity(task, actor=request.user, action_type=TaskActivityLog.ActionType.STATUS_CHANGED, old_value=old_status, new_value=next_status, reason=blocked_reason)

        recipients = []
        if task.assigned_to:
            recipients.append(task.assigned_to)
        if task.project.team:
            recipients.extend(member.user for member in _project_members(task.project) if member.user_id != getattr(task.assigned_to, 'id', None))
        _notify_task(
            task=task,
            recipients=recipients,
            notification_type=Notification.Type.TASK_STATUS_CHANGED if next_status != Task.Status.BLOCKED else Notification.Type.TASK_BLOCKED,
            title='Task status changed',
            message=f'Task "{task.title}" is now {task.get_status_display()}.',
        )

        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        task = self.get_object()
        self._assert_task_permission(task, allow_assigned=True)
        progress = request.data.get('progress_percentage')
        try:
            progress_value = max(0, min(100, int(progress)))
        except (TypeError, ValueError):
            return Response({'error': 'progress_percentage must be a number between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)

        old_progress = task.progress_percentage
        task.progress_percentage = progress_value
        task.save(update_fields=['progress_percentage', 'updated_at'])
        _log_task_activity(task, actor=request.user, action_type=TaskActivityLog.ActionType.DETAILS_UPDATED, old_value=old_progress, new_value=progress_value)
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        task = self.get_object()
        if not _member_is_leadership(task.project, request.user) and request.user.role != CustomUser.Role.ADMIN:
            return Response({'error': 'Only leaders can reassign tasks'}, status=status.HTTP_403_FORBIDDEN)

        new_assignee_id = request.data.get('assigned_to_id')
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'Reassignment reason is required'}, status=status.HTTP_400_BAD_REQUEST)

        new_assignee = get_object_or_404(CustomUser, id=new_assignee_id)
        if not TeamMembership.objects.filter(team=task.project.team, user=new_assignee).exists():
            return Response({'error': 'Selected user is not a member of the project'}, status=status.HTTP_400_BAD_REQUEST)

        old_assignee = task.assigned_to
        task.assigned_to = new_assignee
        if task.status == Task.Status.IN_PROGRESS:
            task.status = Task.Status.TODO
            task.progress_percentage = 0
        task.save(update_fields=['assigned_to', 'status', 'progress_percentage', 'updated_at'])

        _log_task_activity(task, actor=request.user, action_type=TaskActivityLog.ActionType.REASSIGNED, old_value=getattr(old_assignee, 'username', ''), new_value=new_assignee.username, reason=reason)
        _notify_task(
            task=task,
            recipients=[old_assignee, new_assignee],
            notification_type=Notification.Type.TASK_REASSIGNED,
            title='Task reassigned',
            message=f'Task "{task.title}" was reassigned in {task.project.title}.',
        )
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        task = self.get_object()
        if not _member_is_leadership(task.project, request.user) and request.user.role != CustomUser.Role.ADMIN:
            return Response({'error': 'Only the project owner can cancel a task'}, status=status.HTTP_403_FORBIDDEN)

        if task.is_cancelled:
            return Response({'error': 'Task is already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get('reason') or '').strip()
        task.is_cancelled = True
        task.status = Task.Status.CANCELLED
        task.cancellation_reason = reason
        task.cancelled_at = timezone.now()
        task.save(update_fields=['is_cancelled', 'status', 'cancellation_reason', 'cancelled_at', 'updated_at'])
        _log_task_activity(task, actor=request.user, action_type=TaskActivityLog.ActionType.CANCELLED, reason=reason)
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def add_subtask(self, request, pk=None):
        task = self.get_object()
        self._assert_task_permission(task, allow_assigned=True)
        description = (request.data.get('description') or '').strip()
        if not description:
            return Response({'error': 'description is required'}, status=status.HTTP_400_BAD_REQUEST)

        subtask = SubTask.objects.create(task=task, description=description)
        _log_task_activity(task, actor=request.user, action_type=TaskActivityLog.ActionType.SUBTASK_ADDED, new_value=description)
        return Response(SubTaskSerializer(subtask).data, status=status.HTTP_201_CREATED)


class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TaskComment.objects.select_related('task', 'task__project', 'author')
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        if not (_member_is_leadership(task.project, self.request.user) or TeamMembership.objects.filter(team=task.project.team, user=self.request.user).exists()):
            raise PermissionDenied('You do not have permission to comment on this task')

        comment = serializer.save(author=self.request.user)
        _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.COMMENTED, new_value=comment.content)

        mentioned_usernames = set(re.findall(r'@([A-Za-z0-9_]+)', comment.content or ''))
        if mentioned_usernames:
            mentioned_users = CustomUser.objects.filter(username__in=mentioned_usernames, id__in=_project_member_user_ids(task.project))
            _notify_task(
                task=task,
                recipients=list(mentioned_users),
                notification_type=Notification.Type.TASK_COMMENTED,
                title='You were mentioned in a task comment',
                message=f'You were mentioned in a comment on "{task.title}".',
            )

    def perform_update(self, serializer):
        comment = self.get_object()
        if comment.author_id != self.request.user.id:
            raise PermissionDenied('Only the author can edit this comment')
        if not comment.can_edit():
            raise PermissionDenied('Comments can only be edited within 10 minutes')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        return Response({'error': 'Comments cannot be deleted'}, status=status.HTTP_400_BAD_REQUEST)


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = TaskAttachment.objects.select_related('task', 'task__project', 'uploaded_by')
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(task__project__supervisor=user)
        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(task__project_id__in=member_project_ids)

    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        if not (_member_is_leadership(task.project, self.request.user) or TeamMembership.objects.filter(team=task.project.team, user=self.request.user).exists()):
            raise PermissionDenied('You do not have permission to attach files to this task')

        uploaded_file = self.request.FILES.get('file')
        if not uploaded_file:
            raise PermissionDenied('A file is required')

        attachment = serializer.save(
            uploaded_by=self.request.user,
            file_name=uploaded_file.name,
            file_size=uploaded_file.size,
        )
        _log_task_activity(task, actor=self.request.user, action_type=TaskActivityLog.ActionType.ATTACHMENT_ADDED, new_value=attachment.file_name)

    @action(detail=True, methods=['post'])
    def promote_to_library(self, request, pk=None):
        attachment = self.get_object()
        task = attachment.task
        project = task.project

        if not _member_is_leadership(project, request.user) and request.user.role != CustomUser.Role.ADMIN:
            return Response({'error': 'Only leaders and co-leaders can promote task attachments to the project file library'}, status=status.HTTP_403_FORBIDDEN)

        folder_id = request.data.get('folder_id')
        folder = get_object_or_404(FileFolder, id=folder_id, project=project) if folder_id else _general_folder(project)
        tag = request.data.get('tag') or ProjectFile.Tag.REFERENCE
        display_name = (request.data.get('display_name') or attachment.file_name).strip()
        version_note = (request.data.get('version_note') or 'Promoted from task attachment').strip()
        description = (request.data.get('description') or '').strip()

        if not attachment.file:
            return Response({'error': 'Attachment file is not available'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = attachment.file
        file_extension = _extract_file_extension(uploaded_file.name)
        mime_type, _ = mimetypes.guess_type(uploaded_file.name)

        with transaction.atomic():
            project_file = ProjectFile.objects.create(
                project=project,
                folder=folder,
                display_name=display_name,
                stored_file_name=_normalise_file_name(uploaded_file.name),
                file_extension=file_extension,
                file_size=attachment.file_size or 0,
                mime_type=mime_type or 'application/octet-stream',
                tag=tag,
                description=description,
                uploaded_by=request.user,
                current_version_number=1,
                current_version_note=version_note,
                linked_task=task,
            )
            version = ProjectFileVersion.objects.create(
                parent_file=project_file,
                version_number=1,
                stored_file=uploaded_file,
                file_size=attachment.file_size or 0,
                uploader=request.user,
                version_note=version_note,
                tag_at_time=tag,
            )
            project_file.current_version_file = version
            project_file.save(update_fields=['current_version_file'])

        ProjectFileActivityLog.objects.create(
            project=project,
            file=project_file,
            actor=request.user,
            action_type=ProjectFileActivityLog.ActionType.UPLOADED,
            metadata={'source': 'task_attachment', 'task_id': task.id, 'attachment_id': attachment.id},
        )

        create_notification(
            recipients=_project_members(project).values_list('user', flat=True),
            notification_type=Notification.Type.FILE_UPLOADED,
            title='Task attachment promoted to library',
            message=f'{request.user.get_full_name() or request.user.username} promoted "{project_file.display_name}" from task "{task.title}" to the project file library.',
            project=project,
        )

        return Response(ProjectFileSerializer(project_file, context={'request': request}).data, status=status.HTTP_201_CREATED)


class FileFolderViewSet(viewsets.ModelViewSet):
    serializer_class = FileFolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = FileFolder.objects.select_related('project', 'created_by')
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)

        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        if not _member_is_leadership(project, self.request.user) and self.request.user.role != CustomUser.Role.ADMIN:
            raise PermissionDenied('Only leaders and co-leaders can create folders')
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        if folder.name.lower() == 'general':
            return Response({'error': 'The General folder cannot be deleted'}, status=status.HTTP_400_BAD_REQUEST)
        if not _member_is_leadership(folder.project, request.user) and request.user.role != CustomUser.Role.ADMIN:
            raise PermissionDenied('Only leaders and co-leaders can delete folders')

        general_folder = _general_folder(folder.project)
        folder.project_files.update(folder=general_folder)
        folder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = ProjectFile.objects.select_related(
            'project', 'folder', 'uploaded_by', 'linked_task', 'current_version_file', 'version_lock_by'
        ).prefetch_related('versions', 'activity_logs')
        project_id = self.request.query_params.get('project')
        folder_id = self.request.query_params.get('folder')
        tag = self.request.query_params.get('tag')
        uploaded_by = self.request.query_params.get('uploaded_by')
        search_term = self.request.query_params.get('q')
        include_deleted = self.request.query_params.get('include_deleted') == '1'

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if folder_id:
            queryset = queryset.filter(folder_id=folder_id)
        if tag:
            queryset = queryset.filter(tag=tag)
        if uploaded_by:
            queryset = queryset.filter(uploaded_by_id=uploaded_by)
        if search_term:
            queryset = queryset.filter(
                Q(display_name__icontains=search_term)
                | Q(description__icontains=search_term)
                | Q(stored_file_name__icontains=search_term)
                | Q(folder__name__icontains=search_term)
                | Q(uploaded_by__first_name__icontains=search_term)
                | Q(uploaded_by__last_name__icontains=search_term)
                | Q(uploaded_by__username__icontains=search_term)
            )

        if not include_deleted:
            queryset = queryset.filter(is_deleted=False)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)

        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)

    def _can_edit_file(self, file_obj):
        if self.request.user.role == CustomUser.Role.ADMIN:
            return True
        if self.request.user.role == CustomUser.Role.LECTURER and file_obj.project.supervisor_id == self.request.user.id:
            return True
        membership = _project_membership(file_obj.project, self.request.user)
        if not membership:
            return False
        if membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]:
            return True
        return file_obj.uploaded_by_id == self.request.user.id

    def _owner_members(self, project):
        return list(_project_members(project).select_related('user'))

    def _project_owner(self, project):
        return _project_members(project).filter(role=Team.Role.LEADER).select_related('user').first()

    def _ensure_upload_permission(self, project):
        if self.request.user.role == CustomUser.Role.ADMIN:
            return
        if not TeamMembership.objects.filter(team=project.team, user=self.request.user).exists():
            raise PermissionDenied('You do not have permission to upload files to this project')

    def _create_activity(self, file_obj, action_type, metadata=None):
        ProjectFileActivityLog.objects.create(
            project=file_obj.project,
            file=file_obj,
            actor=self.request.user,
            action_type=action_type,
            metadata=metadata or {},
        )

    def _project_total_usage(self, project):
        current_usage = _project_file_storage_usage(project)
        return current_usage

    def _quota_warning_recipients(self, project):
        owner = self._project_owner(project)
        recipients = [owner.user] if owner else []
        if project.supervisor:
            recipients.append(project.supervisor)
        return recipients

    def _maybe_warn_quota(self, project, before_usage, after_usage):
        quota = PROJECT_STORAGE_QUOTA_BYTES
        thresholds = [0.8, 0.95]
        for threshold in thresholds:
            crossed = before_usage < quota * threshold <= after_usage
            if crossed:
                label = f'{int(threshold * 100)}%'
                create_notification(
                    recipients=self._quota_warning_recipients(project),
                    notification_type=Notification.Type.FILE_QUOTA_WARNING,
                    title='Project storage quota warning',
                    message=f'Project "{project.title}" has reached {label} of its storage quota.',
                    project=project,
                )

    def _lock_version_upload(self, file_obj):
        if file_obj.version_lock_expires_at and file_obj.version_lock_expires_at > timezone.now() and file_obj.version_lock_by_id not in (None, self.request.user.id):
            locked_by = file_obj.version_lock_by.get_full_name() or file_obj.version_lock_by.username
            raise PermissionDenied(f'{locked_by} is currently uploading a new version of this file. Please wait a few minutes and try again.')
        file_obj.version_lock_by = self.request.user
        file_obj.version_lock_expires_at = timezone.now() + timedelta(minutes=10)
        file_obj.save(update_fields=['version_lock_by', 'version_lock_expires_at'])

    def _release_version_lock(self, file_obj):
        file_obj.version_lock_by = None
        file_obj.version_lock_expires_at = None
        file_obj.save(update_fields=['version_lock_by', 'version_lock_expires_at'])

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        self._ensure_upload_permission(project)

        uploaded_file = self.request.FILES.get('file')
        file_extension, mime_type = _validate_project_file_upload(uploaded_file)

        folder = serializer.validated_data.get('folder') or _general_folder(project)
        display_name = (self.request.data.get('display_name') or uploaded_file.name).strip()
        tag = self.request.data.get('tag') or ProjectFile.Tag.DRAFT
        description = (self.request.data.get('description') or '').strip()
        version_note = (self.request.data.get('version_note') or description or 'Initial upload').strip()
        linked_task = serializer.validated_data.get('linked_task')
        if linked_task and linked_task.project_id != project.id:
            raise ValidationError('Linked task must belong to the selected project')

        before_usage = _project_file_storage_usage(project)

        with transaction.atomic():
            project_file = serializer.save(
                folder=folder,
                display_name=display_name,
                stored_file_name=_normalise_file_name(uploaded_file.name),
                file_extension=file_extension,
                file_size=uploaded_file.size,
                mime_type=mime_type,
                tag=tag,
                description=description,
                uploaded_by=self.request.user,
                current_version_number=1,
                current_version_note=version_note,
                linked_task=linked_task,
            )
            version = ProjectFileVersion.objects.create(
                parent_file=project_file,
                version_number=1,
                stored_file=uploaded_file,
                file_size=uploaded_file.size,
                uploader=self.request.user,
                version_note=version_note,
                tag_at_time=tag,
            )
            project_file.current_version_file = version
            project_file.save(update_fields=['current_version_file'])

        after_usage = self._project_total_usage(project)
        self._create_activity(project_file, ProjectFileActivityLog.ActionType.UPLOADED, {
            'folder': folder.name,
            'version': 1,
            'tag': tag,
        })
        create_notification(
            recipients=_project_members(project).values_list('user', flat=True),
            notification_type=Notification.Type.FILE_UPLOADED,
            title='New file uploaded',
            message=f'{self.request.user.get_full_name() or self.request.user.username} uploaded "{project_file.display_name}" to {folder.name} in {project.title}.',
            project=project,
        )
        if tag == ProjectFile.Tag.FINAL:
            recipients = [project.supervisor] if project.supervisor else []
            owner = self._project_owner(project)
            if owner:
                recipients.append(owner.user)
            create_notification(
                recipients=recipients,
                notification_type=Notification.Type.FILE_UPLOADED,
                title='Final file uploaded',
                message=f'Final file "{project_file.display_name}" was uploaded to {project.title}.',
                project=project,
            )
            maybe_send_email(
                subject=f'Final file uploaded for {project.title}',
                message=f'Final file "{project_file.display_name}" was uploaded in project {project.title}.',
                recipient_list=[u.email for u in recipients if u and u.email],
            )
        self._maybe_warn_quota(project, before_usage, after_usage)

    @action(detail=True, methods=['post'])
    def upload_version(self, request, pk=None):
        file_obj = self.get_object()
        if not self._can_edit_file(file_obj):
            raise PermissionDenied('You do not have permission to upload a new version for this file')

        uploaded_file = request.FILES.get('file')
        file_extension, mime_type = _validate_project_file_upload(uploaded_file)
        if file_extension != file_obj.file_extension:
            # Keep it lenient but consistent with the original file type
            file_extension = file_obj.file_extension or file_extension

        if request.user.role == CustomUser.Role.STUDENT and file_obj.uploaded_by_id != request.user.id and not _member_is_leadership(file_obj.project, request.user):
            raise PermissionDenied('Members can only upload new versions for files they originally uploaded')

        version_note = (request.data.get('version_note') or '').strip()
        if not version_note:
            return Response({'error': 'version_note is required'}, status=status.HTTP_400_BAD_REQUEST)

        new_tag = request.data.get('tag') or file_obj.tag
        new_display_name = (request.data.get('display_name') or file_obj.display_name).strip()
        self._lock_version_upload(file_obj)
        before_usage = _project_file_storage_usage(file_obj.project)

        try:
            with transaction.atomic():
                next_version_number = file_obj.current_version_number + 1
                version = ProjectFileVersion.objects.create(
                    parent_file=file_obj,
                    version_number=next_version_number,
                    stored_file=uploaded_file,
                    file_size=uploaded_file.size,
                    uploader=self.request.user,
                    version_note=version_note,
                    tag_at_time=new_tag,
                )
                file_obj.current_version_number = next_version_number
                file_obj.current_version_file = version
                file_obj.file_size = uploaded_file.size
                file_obj.mime_type = mime_type
                file_obj.file_extension = file_extension
                file_obj.tag = new_tag
                file_obj.display_name = new_display_name
                file_obj.current_version_note = version_note
                file_obj.stored_file_name = _normalise_file_name(uploaded_file.name)
                file_obj.save(update_fields=['current_version_number', 'current_version_file', 'file_size', 'mime_type', 'file_extension', 'tag', 'display_name', 'current_version_note', 'stored_file_name'])

            after_usage = self._project_total_usage(file_obj.project)
            self._create_activity(file_obj, ProjectFileActivityLog.ActionType.VERSION_CREATED, {
                'version': file_obj.current_version_number,
                'version_note': version_note,
                'tag': new_tag,
            })
            create_notification(
                recipients=_project_members(file_obj.project).values_list('user', flat=True),
                notification_type=Notification.Type.FILE_VERSION_CREATED,
                title='New file version uploaded',
                message=f'{self.request.user.get_full_name() or self.request.user.username} uploaded a new version of "{file_obj.display_name}" in {file_obj.project.title}. {version_note}',
                project=file_obj.project,
            )
            self._maybe_warn_quota(file_obj.project, before_usage, after_usage)
            if new_tag == ProjectFile.Tag.FINAL:
                recipients = [file_obj.project.supervisor] if file_obj.project.supervisor else []
                owner = self._project_owner(file_obj.project)
                if owner:
                    recipients.append(owner.user)
                create_notification(
                    recipients=recipients,
                    notification_type=Notification.Type.FILE_UPLOADED,
                    title='Final version uploaded',
                    message=f'Final version of "{file_obj.display_name}" was uploaded to {file_obj.project.title}.',
                    project=file_obj.project,
                )
            return Response(self.get_serializer(file_obj).data)
        finally:
            self._release_version_lock(file_obj)

    @action(detail=True, methods=['post'])
    def start_version_lock(self, request, pk=None):
        file_obj = self.get_object()
        if not self._can_edit_file(file_obj):
            raise PermissionDenied('You do not have permission to update this file')
        self._lock_version_upload(file_obj)
        return Response({'message': 'Version upload lock enabled', 'expires_at': file_obj.version_lock_expires_at})

    @action(detail=True, methods=['post'])
    def move_folder(self, request, pk=None):
        file_obj = self.get_object()
        if not self._can_edit_file(file_obj):
            raise PermissionDenied('You do not have permission to move this file')
        if request.user.role == CustomUser.Role.STUDENT and file_obj.uploaded_by_id != request.user.id and not _member_is_leadership(file_obj.project, request.user):
            raise PermissionDenied('Members can only move files they originally uploaded')
        folder_id = request.data.get('folder_id')
        folder = get_object_or_404(FileFolder, id=folder_id, project=file_obj.project) if folder_id else _general_folder(file_obj.project)
        previous_folder = file_obj.folder
        file_obj.folder = folder
        file_obj.save(update_fields=['folder'])
        self._create_activity(file_obj, ProjectFileActivityLog.ActionType.MOVED, {
            'from': previous_folder.name if previous_folder else 'General',
            'to': folder.name,
        })
        return Response(self.get_serializer(file_obj).data)

    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        file_obj = self.get_object()
        if not self._can_edit_file(file_obj):
            raise PermissionDenied('You do not have permission to rename this file')
        if request.user.role == CustomUser.Role.STUDENT and file_obj.uploaded_by_id != request.user.id and not _member_is_leadership(file_obj.project, request.user):
            raise PermissionDenied('Members can only rename files they originally uploaded')
        new_name = (request.data.get('display_name') or '').strip()
        if not new_name:
            return Response({'error': 'display_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        old_name = file_obj.display_name
        file_obj.display_name = new_name
        file_obj.save(update_fields=['display_name'])
        self._create_activity(file_obj, ProjectFileActivityLog.ActionType.RENAMED, {'old': old_name, 'new': new_name})
        return Response(self.get_serializer(file_obj).data)

    def destroy(self, request, *args, **kwargs):
        file_obj = self.get_object()
        if not self._can_edit_file(file_obj):
            raise PermissionDenied('You do not have permission to delete this file')
        file_obj.is_deleted = True
        file_obj.deletion_timestamp = timezone.now()
        file_obj.save(update_fields=['is_deleted', 'deletion_timestamp'])
        ProjectTrash.objects.update_or_create(
            original_file=file_obj,
            defaults={
                'project': file_obj.project,
                'deleted_by': request.user,
                'deletion_timestamp': timezone.now(),
                'scheduled_purge_date': timezone.now() + timedelta(days=14),
            },
        )
        self._create_activity(file_obj, ProjectFileActivityLog.ActionType.DELETED, {'deleted_by': request.user.id})
        create_notification(
            recipients=_project_members(file_obj.project).values_list('user', flat=True),
            notification_type=Notification.Type.FILE_DELETED,
            title='File deleted',
            message=f'{request.user.get_full_name() or request.user.username} deleted "{file_obj.display_name}" from {file_obj.project.title}.',
            project=file_obj.project,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFileVersionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProjectFileVersionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProjectFileVersion.objects.select_related('parent_file', 'uploader', 'parent_file__project')
        file_id = self.request.query_params.get('file')
        if file_id:
            queryset = queryset.filter(parent_file_id=file_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(parent_file__project__supervisor=user)
        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(parent_file__project_id__in=member_project_ids)


class ProjectFileActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProjectFileActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProjectFileActivityLog.objects.select_related('project', 'file', 'actor')
        project_id = self.request.query_params.get('project')
        file_id = self.request.query_params.get('file')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if file_id:
            queryset = queryset.filter(file_id=file_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)
        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)


class ProjectTrashViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectTrashSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProjectTrash.objects.select_related('project', 'original_file', 'deleted_by', 'original_file__uploaded_by')
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)
        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        trash_entry = self.get_object()
        file_obj = trash_entry.original_file
        can_restore = False
        if request.user.role == CustomUser.Role.ADMIN:
            can_restore = True
        elif request.user.role == CustomUser.Role.LECTURER and file_obj.project.supervisor_id == request.user.id:
            can_restore = True
        elif _member_is_leadership(file_obj.project, request.user):
            can_restore = True
        elif file_obj.uploaded_by_id == request.user.id:
            can_restore = True

        if not can_restore:
            raise PermissionDenied('You do not have permission to restore this file')
        file_obj.is_deleted = False
        file_obj.deletion_timestamp = None
        file_obj.save(update_fields=['is_deleted', 'deletion_timestamp'])
        trash_entry.delete()
        ProjectFileActivityLog.objects.create(
            project=file_obj.project,
            file=file_obj,
            actor=request.user,
            action_type=ProjectFileActivityLog.ActionType.RESTORED,
            metadata={'restored_by': request.user.id},
        )
        create_notification(
            recipients=_project_members(file_obj.project).values_list('user', flat=True),
            notification_type=Notification.Type.FILE_RESTORED,
            title='File restored',
            message=f'{request.user.get_full_name() or request.user.username} restored "{file_obj.display_name}" in {file_obj.project.title}.',
            project=file_obj.project,
        )
        return Response({'message': 'File restored'})


class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CalendarEvent.objects.select_related('project', 'created_by')
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return queryset
        if user.role == CustomUser.Role.LECTURER:
            return queryset.filter(project__supervisor=user)

        member_project_ids = user.teammembership_set.values_list('team__project_id', flat=True)
        return queryset.filter(project_id__in=member_project_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        project_id = request.query_params.get('project')
        scope = (request.query_params.get('scope') or 'personal').lower()

        if project_id:
            projects = Project.objects.filter(id=project_id)
        else:
            if request.user.role == CustomUser.Role.STUDENT:
                projects = Project.objects.filter(team__teammembership__user=request.user).distinct()
            elif request.user.role == CustomUser.Role.LECTURER:
                projects = Project.objects.filter(supervisor=request.user)
            else:
                projects = Project.objects.all()

        events = []
        for project in projects:
            if scope == 'project' and project_id and str(project.id) != str(project_id):
                continue

            for task in project.tasks.filter(is_cancelled=False):
                events.append({
                    'id': f'task-{task.id}',
                    'project': project.id,
                    'title': f'Task deadline: {task.title}',
                    'event_type': CalendarEvent.EventType.TASK_DEADLINE,
                    'related_object_id': task.id,
                    'start_datetime': task.deadline.isoformat(),
                    'end_datetime': task.deadline.isoformat(),
                    'is_visible_to_all_members': True,
                    'source': 'derived',
                })

            events.append({
                'id': f'project-deadline-{project.id}',
                'project': project.id,
                'title': f'Project submission deadline: {project.title}',
                'event_type': CalendarEvent.EventType.PROJECT_DEADLINE,
                'related_object_id': project.id,
                'start_datetime': timezone.make_aware(datetime.combine(project.deadline, time.min)).isoformat(),
                'end_datetime': timezone.make_aware(datetime.combine(project.deadline, time.min)).isoformat(),
                'is_visible_to_all_members': True,
                'source': 'derived',
            })

            for milestone in project.milestones.all():
                milestone_dt = timezone.make_aware(datetime.combine(milestone.due_date, time.min))
                events.append({
                    'id': f'milestone-{milestone.id}',
                    'project': project.id,
                    'title': f'Milestone: {milestone.title}',
                    'event_type': CalendarEvent.EventType.MILESTONE,
                    'related_object_id': milestone.id,
                    'start_datetime': milestone_dt.isoformat(),
                    'end_datetime': milestone_dt.isoformat(),
                    'is_visible_to_all_members': True,
                    'source': 'derived',
                })

        MeetingPoll = apps.get_model('communication', 'MeetingPoll')
        for poll in MeetingPoll.objects.filter(project__in=projects, confirmed_slot__isnull=False).select_related('confirmed_slot', 'project'):
            events.append({
                'id': f'meeting-{poll.id}',
                'project': poll.project_id,
                'title': f'Confirmed meeting: {poll.title}',
                'event_type': CalendarEvent.EventType.MEETING,
                'related_object_id': poll.id,
                'start_datetime': poll.confirmed_slot.start_datetime.isoformat(),
                'end_datetime': poll.confirmed_slot.end_datetime.isoformat(),
                'is_visible_to_all_members': True,
                'source': 'derived',
            })

        custom_events = CalendarEventSerializer(queryset, many=True).data
        for event in custom_events:
            event['source'] = 'custom'

        combined = custom_events + events
        combined.sort(key=lambda item: item['start_datetime'])
        return Response(combined)

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        membership = _project_membership(project, self.request.user)
        if self.request.user.role != CustomUser.Role.ADMIN:
            if not membership or membership.role not in [Team.Role.LEADER, Team.Role.CO_LEADER]:
                raise PermissionDenied('Only leaders and co-leaders can create custom calendar events')
        if serializer.validated_data.get('event_type') != CalendarEvent.EventType.CUSTOM:
            raise ValidationError('Only custom calendar events can be created manually')
        serializer.save(created_by=self.request.user)


class InvitationViewSet(viewsets.ModelViewSet):
    """API endpoint for invitations"""
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        expire_stale_invitations_for_queryset(Invitation.objects.all())
        user = self.request.user
        
        # Students see invitations they received
        if user.role == CustomUser.Role.STUDENT:
            return Invitation.objects.filter(receiver=user)
        
        # Lecturers see invitations for projects they supervise
        elif user.role == CustomUser.Role.LECTURER:
            supervised_projects = Project.objects.filter(supervisor=user)
            return Invitation.objects.filter(project__in=supervised_projects)
        
        # Admins see all
        return Invitation.objects.all()
    
    def perform_create(self, serializer):
        """Create invitation with current user as sender"""
        invitation = serializer.save(
            sender=self.request.user,
            expires_at=timezone.now() + timedelta(days=7),
            status=Invitation.Status.PENDING,
        )
        create_notification(
            recipients=[invitation.receiver],
            notification_type=Notification.Type.INVITATION,
            title='New project invitation',
            message=f'You have been invited to join "{invitation.project.title}".',
            project=invitation.project,
            invitation=invitation,
        )
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept an invitation"""
        invitation = self.get_object()
        
        if invitation.receiver != request.user:
            return Response(
                {'error': 'You can only accept invitations sent to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if invitation.status != Invitation.Status.PENDING:
            return Response(
                {'error': 'Invitation has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if invitation.expires_at <= timezone.now():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=['status'])
            return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.status = Invitation.Status.ACCEPTED
        invitation.save()
        
        # Add user to team
        TeamMembership.objects.get_or_create(
            user=request.user,
            team=invitation.project.team,
            defaults={'role': Team.Role.MEMBER}
        )

        create_notification(
            recipients=[invitation.sender],
            notification_type=Notification.Type.INVITATION_ACCEPTED,
            title='Invitation accepted',
            message=f'{request.user.get_full_name() or request.user.username} accepted invitation to "{invitation.project.title}".',
            project=invitation.project,
            invitation=invitation,
        )
        
        return Response({'message': 'Invitation accepted'})
    
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline an invitation"""
        invitation = self.get_object()
        
        if invitation.receiver != request.user:
            return Response(
                {'error': 'You can only decline invitations sent to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if invitation.status != Invitation.Status.PENDING:
            return Response(
                {'error': 'Invitation has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if invitation.expires_at <= timezone.now():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=['status'])
            return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.status = Invitation.Status.DECLINED
        invitation.save()

        create_notification(
            recipients=[invitation.sender],
            notification_type=Notification.Type.INVITATION_DECLINED,
            title='Invitation declined',
            message=f'{request.user.get_full_name() or request.user.username} declined invitation to "{invitation.project.title}".',
            project=invitation.project,
            invitation=invitation,
        )
        
        return Response({'message': 'Invitation declined'})

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        invitation = get_object_or_404(Invitation.objects.select_related('project', 'receiver', 'sender'), pk=pk)

        requester_membership = TeamMembership.objects.filter(team=invitation.project.team, user=request.user).first()
        has_team_permission = requester_membership and requester_membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]
        if invitation.sender_id != request.user.id and not has_team_permission and request.user.role != CustomUser.Role.ADMIN:
            return Response({'error': 'You do not have permission to resend this invitation'}, status=status.HTTP_403_FORBIDDEN)

        if invitation.status == Invitation.Status.ACCEPTED:
            return Response({'error': 'Cannot resend an accepted invitation'}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = Invitation.Status.PENDING
        invitation.expires_at = timezone.now() + timedelta(days=7)
        invitation.save(update_fields=['status', 'expires_at'])

        create_notification(
            recipients=[invitation.receiver],
            notification_type=Notification.Type.INVITATION,
            title='Invitation resent',
            message=f'Your invitation to "{invitation.project.title}" was resent.',
            project=invitation.project,
            invitation=invitation,
        )
        maybe_send_email(
            subject=f'Resent invitation for {invitation.project.title}',
            message=f'Your invitation for "{invitation.project.title}" has been resent. It expires on {invitation.expires_at.date()}.',
            recipient_list=[invitation.receiver.email] if invitation.receiver.email else [],
        )

        return Response({'message': 'Invitation resent', 'expires_at': invitation.expires_at})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invitation = get_object_or_404(Invitation.objects.select_related('project', 'receiver', 'sender'), pk=pk)

        requester_membership = TeamMembership.objects.filter(team=invitation.project.team, user=request.user).first()
        has_team_permission = requester_membership and requester_membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]
        if invitation.sender_id != request.user.id and not has_team_permission and request.user.role != CustomUser.Role.ADMIN:
            return Response({'error': 'You do not have permission to cancel this invitation'}, status=status.HTTP_403_FORBIDDEN)

        if invitation.status == Invitation.Status.ACCEPTED:
            return Response({'error': 'Cannot cancel an accepted invitation'}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = Invitation.Status.CANCELLED
        invitation.save(update_fields=['status'])

        create_notification(
            recipients=[invitation.receiver],
            notification_type=Notification.Type.INVITATION_CANCELLED,
            title='Invitation cancelled',
            message=f'Invitation to "{invitation.project.title}" was cancelled.',
            project=invitation.project,
            invitation=invitation,
        )

        return Response({'message': 'Invitation cancelled'})

    @action(detail=False, methods=['post'])
    def expire_stale(self, request):
        expired_count = expire_stale_invitations_for_queryset(Invitation.objects.all())
        return Response({'expired_count': expired_count})


class ProjectTemplateViewSet(viewsets.ModelViewSet):
    """API endpoint for project templates"""
    queryset = ProjectTemplate.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectTemplateCreateSerializer
        return ProjectTemplateSerializer
    
    def get_queryset(self):
        # Everyone can see templates
        return ProjectTemplate.objects.all()
    
    def perform_create(self, serializer):
        """Create template with current user as creator (lecturer only)"""
        if self.request.user.role != CustomUser.Role.LECTURER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only lecturers can create templates')
        
        serializer.save(creator=self.request.user)


class MilestoneTemplateViewSet(viewsets.ModelViewSet):
    """API endpoint for milestone templates"""
    queryset = MilestoneTemplate.objects.all()
    serializer_class = MilestoneTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Everyone can see milestone templates
        return MilestoneTemplate.objects.all()


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for in-app notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related(
            'project', 'invitation', 'milestone'
        )

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(read_at__isnull=True).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'message': 'Notification marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response({'message': 'All notifications marked as read'})
