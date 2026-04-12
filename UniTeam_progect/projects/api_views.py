from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import (
    Project, Team, TeamMembership, Milestone, Invitation, Notification,
    ProjectTemplate, MilestoneTemplate
)
from .serializers import (
    ProjectSerializer, TeamSerializer, TeamMembershipSerializer,
    MilestoneSerializer, InvitationSerializer,
    ProjectTemplateSerializer, ProjectTemplateCreateSerializer, NotificationSerializer,
    MilestoneTemplateSerializer
)
from users.models import CustomUser
from users.serializers import UserSerializer


def create_notification(*, recipients, notification_type, title, message, project=None, invitation=None, milestone=None):
    unique_recipients = {user.id: user for user in recipients if user}.values()
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

        return Response({'message': 'Project submitted', 'lifecycle_status': project.lifecycle_status})

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
