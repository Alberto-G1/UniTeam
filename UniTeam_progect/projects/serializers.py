from rest_framework import serializers
from .models import (
    Project, Team, TeamMembership, Milestone, Invitation,
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
    supervisor = UserSerializer(read_only=True)
    supervisor_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=CustomUser.objects.filter(role='LECTURER'),
        source='supervisor',
        required=False,
        allow_null=True
    )
    team = TeamSerializer(read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    template_used_title = serializers.CharField(source='template_used.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'course_code', 'deadline',
                  'supervisor', 'supervisor_id', 'template_used', 'template_used_title',
                  'created_at', 'updated_at', 'team', 'milestones']
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
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
                  'receiver_id', 'status', 'sent_at']
        read_only_fields = ['id', 'sender', 'sent_at']


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
