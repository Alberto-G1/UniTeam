from rest_framework import serializers
from .models import (
    Project, Team, TeamMembership, Milestone, Invitation, Notification,
    ProjectTemplate, MilestoneTemplate
)
from users.serializers import UserSerializer
from users.models import CustomUser


class MilestoneSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True, read_only=True)
    assigned_to_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=CustomUser.objects.all(),
        source='assigned_to',
        required=False
    )
    
    class Meta:
        model = Milestone
        fields = ['id', 'project', 'title', 'description', 'due_date', 'status',
                  'assigned_to', 'assigned_to_ids']
        read_only_fields = ['id']


class TeamMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=CustomUser.objects.all(),
        source='user'
    )
    
    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'user_id', 'team', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    members = TeamMembershipSerializer(source='teammembership_set', many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'project', 'members']
        read_only_fields = ['id']


class ProjectSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='lifecycle_status', read_only=True)
    linked_lecturer_email = serializers.EmailField(write_only=True, required=False, allow_blank=True, allow_null=True)
    supervisor = UserSerializer(read_only=True)
    supervisor_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=CustomUser.objects.filter(role='LECTURER'),
        source='supervisor',
        required=False,
        allow_null=True
    )
    supervisor_name = serializers.SerializerMethodField()
    can_link_as_supervisor = serializers.SerializerMethodField()
    current_membership = serializers.SerializerMethodField()
    team_size = serializers.SerializerMethodField()
    team = TeamSerializer(read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    template_used_title = serializers.CharField(source='template_used.title', read_only=True, allow_null=True)

    def create(self, validated_data):
        linked_email = (validated_data.pop('linked_lecturer_email', '') or '').strip()
        project = Project.objects.create(**validated_data)

        request = self.context.get('request')
        current_user = getattr(request, 'user', None)

        lecturer = project.supervisor
        if lecturer is None and linked_email:
            lecturer = CustomUser.objects.filter(
                email__iexact=linked_email,
                role=CustomUser.Role.LECTURER,
                is_approved=True,
            ).first()

        if lecturer is None and current_user and current_user.role == CustomUser.Role.LECTURER and current_user.is_approved:
            lecturer = current_user

        if lecturer and lecturer.role == CustomUser.Role.LECTURER and lecturer.is_approved and project.supervisor_id != lecturer.id:
            project.supervisor = lecturer
            project.save(update_fields=['supervisor'])

        return project
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'course_code', 'deadline', 'lifecycle_status', 'status',
                  'linked_lecturer_email', 'supervisor', 'supervisor_id', 'supervisor_name',
                  'can_link_as_supervisor', 'current_membership', 'team_size', 'template_used',
                  'template_used_title', 'created_at', 'updated_at', 'team', 'milestones']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_supervisor_name(self, obj):
        if not obj.supervisor:
            return None
        return obj.supervisor.get_full_name() or obj.supervisor.username

    def get_can_link_as_supervisor(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or user.role != CustomUser.Role.LECTURER:
            return False
        return obj.supervisor_id in (None, user.id)

    def get_current_membership(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user:
            return None

        try:
            team = obj.team
        except Team.DoesNotExist:
            return None

        membership = TeamMembership.objects.filter(team=team, user=user).first()
        if not membership:
            return None

        return {
            'id': membership.id,
            'role': membership.role,
        }

    def get_team_size(self, obj):
        try:
            team = obj.team
        except Team.DoesNotExist:
            return 0
        return team.members.count()


class InvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=CustomUser.objects.filter(role='STUDENT'),
        source='receiver'
    )
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=Project.objects.all(),
        source='project'
    )
    
    class Meta:
        model = Invitation
        fields = ['id', 'project', 'project_id', 'sender', 'receiver', 
                  'receiver_id', 'status', 'sent_at', 'expires_at', 'is_expired']
        read_only_fields = ['id', 'sender', 'sent_at']


class NotificationSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    invitation_id = serializers.IntegerField(source='invitation.id', read_only=True)
    milestone_title = serializers.CharField(source='milestone.title', read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'project', 'project_title',
            'invitation_id', 'milestone_title', 'created_at', 'read_at', 'is_read'
        ]
        read_only_fields = fields

    def get_is_read(self, obj):
        return obj.read_at is not None


class MilestoneTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MilestoneTemplate
        fields = ['id', 'project_template', 'title', 'description', 'order']
        read_only_fields = ['id']


class ProjectTemplateSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    milestone_templates = MilestoneTemplateSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProjectTemplate
        fields = ['id', 'title', 'creator', 'course_code', 'description', 
                  'milestone_templates']
        read_only_fields = ['id', 'creator']


class ProjectTemplateCreateSerializer(serializers.ModelSerializer):
    milestone_templates_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ProjectTemplate
        fields = ['id', 'title', 'course_code', 'description', 'milestone_templates_data']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        milestones_data = validated_data.pop('milestone_templates_data', [])
        template = ProjectTemplate.objects.create(**validated_data)
        
        for milestone_data in milestones_data:
            MilestoneTemplate.objects.create(
                project_template=template,
                **milestone_data
            )
        
        return template
