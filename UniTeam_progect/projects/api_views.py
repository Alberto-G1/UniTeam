from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import (
    Project, Team, TeamMembership, Milestone, Invitation,
    ProjectTemplate, MilestoneTemplate
)
from .serializers import (
    ProjectSerializer, TeamSerializer, TeamMembershipSerializer,
    MilestoneSerializer, InvitationSerializer,
    ProjectTemplateSerializer, ProjectTemplateCreateSerializer,
    MilestoneTemplateSerializer
)
from users.models import CustomUser


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
            return Project.objects.filter(id__in=project_ids)
        
        # Lecturers see projects they supervise
        elif user.role == CustomUser.Role.LECTURER:
            return Project.objects.filter(supervisor=user)
        
        # Admins see all
        return Project.objects.all()
    
    def perform_create(self, serializer):
        """Create project and assign creator as leader"""
        project = serializer.save()
        
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


class InvitationViewSet(viewsets.ModelViewSet):
    """API endpoint for invitations"""
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
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
        serializer.save(sender=self.request.user)
    
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
        
        invitation.status = Invitation.Status.ACCEPTED
        invitation.save()
        
        # Add user to team
        TeamMembership.objects.get_or_create(
            user=request.user,
            team=invitation.project.team,
            defaults={'role': Team.Role.MEMBER}
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
        
        invitation.status = Invitation.Status.DECLINED
        invitation.save()
        
        return Response({'message': 'Invitation declined'})


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
