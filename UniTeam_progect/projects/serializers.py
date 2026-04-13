from rest_framework import serializers
from django.utils import timezone
from .models import (
    Project, Team, TeamMembership, Milestone, Invitation, Notification,
    ProjectTemplate, MilestoneTemplate, Section, Task, SubTask, TaskAttachment, TaskComment, TaskActivityLog, TaskNotification,
    FileFolder, ProjectFile, ProjectFileVersion, ProjectFileActivityLog, ProjectTrash
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
    task_progress_percentage = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
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
                  'template_used_title', 'created_at', 'updated_at', 'team', 'milestones',
                  'task_progress_percentage', 'task_count']
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

    def get_task_progress_percentage(self, obj):
        tasks = obj.tasks.filter(is_cancelled=False)
        total = tasks.count()
        if total == 0:
            return 0

        completed_weight = 0.0
        for task in tasks:
            if task.status == Task.Status.DONE:
                completed_weight += 1
            elif task.status == Task.Status.IN_PROGRESS:
                completed_weight += (task.progress_percentage or 0) / 100
            elif task.status == Task.Status.UNDER_REVIEW:
                completed_weight += max((task.progress_percentage or 75), 0) / 100

        return round((completed_weight / total) * 100)

    def get_task_count(self, obj):
        return obj.tasks.filter(is_cancelled=False).count()


class SectionSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'project', 'name', 'order', 'created_at', 'task_count']
        read_only_fields = ['id', 'created_at', 'task_count']

    def get_task_count(self, obj):
        return obj.tasks.filter(is_cancelled=False).count()


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=CustomUser.objects.all(), source='author', required=False)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_id', 'content', 'created_at', 'updated_at', 'can_edit']
        read_only_fields = ['id', 'created_at', 'updated_at', 'can_edit']

    def get_can_edit(self, obj):
        return obj.can_edit()


class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ['id', 'task', 'description', 'is_completed', 'completed_at', 'created_at']
        read_only_fields = ['id', 'completed_at', 'created_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'uploaded_by', 'file', 'file_name', 'file_size', 'file_url', 'created_at']
        read_only_fields = ['id', 'uploaded_by', 'file_name', 'file_size', 'file_url', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class TaskActivityLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = TaskActivityLog
        fields = ['id', 'task', 'actor', 'action_type', 'old_value', 'new_value', 'reason', 'created_at']
        read_only_fields = fields


class TaskNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskNotification
        fields = ['id', 'recipient', 'task', 'notification_type', 'message', 'is_read', 'created_at']
        read_only_fields = fields


class FileFolderSerializer(serializers.ModelSerializer):
    file_count = serializers.SerializerMethodField()

    class Meta:
        model = FileFolder
        fields = ['id', 'project', 'name', 'order', 'created_by', 'created_at', 'updated_at', 'file_count']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'file_count']

    def get_file_count(self, obj):
        return obj.project_files.filter(is_deleted=False).count()


class ProjectFileVersionSerializer(serializers.ModelSerializer):
    uploader = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFileVersion
        fields = ['id', 'parent_file', 'version_number', 'stored_file', 'file_url', 'file_size', 'uploader', 'version_note', 'upload_timestamp', 'tag_at_time']
        read_only_fields = ['id', 'version_number', 'file_url', 'file_size', 'uploader', 'upload_timestamp']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.stored_file:
            return None
        url = obj.stored_file.url
        return request.build_absolute_uri(url) if request else url


class ProjectFileActivityLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = ProjectFileActivityLog
        fields = ['id', 'project', 'file', 'actor', 'action_type', 'metadata', 'created_at']
        read_only_fields = fields


class ProjectTrashSerializer(serializers.ModelSerializer):
    original_file = serializers.SerializerMethodField()
    deleted_by = UserSerializer(read_only=True)

    class Meta:
        model = ProjectTrash
        fields = ['id', 'project', 'original_file', 'deleted_by', 'deletion_timestamp', 'scheduled_purge_date']
        read_only_fields = fields

    def get_original_file(self, obj):
        return {
            'id': obj.original_file.id,
            'display_name': obj.original_file.display_name,
            'folder': obj.original_file.folder_id,
        }


class ProjectFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    version_lock_by = UserSerializer(read_only=True)
    folder = FileFolderSerializer(read_only=True)
    folder_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=FileFolder.objects.all(), source='folder', required=False, allow_null=True)
    linked_task = serializers.SerializerMethodField()
    linked_task_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=Task.objects.all(), source='linked_task', required=False, allow_null=True)
    current_version_file = ProjectFileVersionSerializer(read_only=True)
    versions = ProjectFileVersionSerializer(many=True, read_only=True)
    version_count = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    current_file_url = serializers.SerializerMethodField()
    activity_logs = ProjectFileActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectFile
        fields = [
            'id', 'project', 'folder', 'folder_id', 'display_name', 'stored_file_name', 'file_extension', 'file_size',
            'mime_type', 'current_version_number', 'tag', 'description', 'uploaded_by', 'upload_timestamp',
            'linked_task', 'linked_task_id', 'current_version_file', 'versions', 'version_count', 'is_locked',
            'current_file_url', 'activity_logs', 'is_deleted', 'deletion_timestamp', 'current_version_note',
            'version_lock_by', 'version_lock_expires_at',
        ]
        read_only_fields = ['id', 'stored_file_name', 'file_extension', 'file_size', 'mime_type', 'current_version_number', 'uploaded_by', 'upload_timestamp', 'current_version_file', 'versions', 'version_count', 'is_locked', 'current_file_url', 'activity_logs', 'is_deleted', 'deletion_timestamp', 'version_lock_by', 'version_lock_expires_at']

    def get_linked_task(self, obj):
        if not obj.linked_task:
            return None
        return {
            'id': obj.linked_task.id,
            'title': obj.linked_task.title,
            'status': obj.linked_task.status,
        }

    def get_version_count(self, obj):
        return obj.versions.count()

    def get_is_locked(self, obj):
        if not obj.version_lock_expires_at:
            return False
        return obj.version_lock_expires_at >= timezone.now()

    def get_current_file_url(self, obj):
        request = self.context.get('request')
        version = obj.current_version_file
        if not version or not version.stored_file:
            return None
        url = version.stored_file.url
        return request.build_absolute_uri(url) if request else url

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        linked_task = attrs.get('linked_task') or getattr(self.instance, 'linked_task', None)
        if linked_task and project and linked_task.project_id != project.id:
            raise serializers.ValidationError({'linked_task_id': 'Linked task must belong to the selected project.'})
        return attrs


class TaskSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=Project.objects.all(), source='project', required=False)
    section = SectionSerializer(read_only=True)
    section_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=Section.objects.all(), source='section', required=False, allow_null=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=CustomUser.objects.filter(role='STUDENT'), source='assigned_to', required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=CustomUser.objects.all(), source='created_by', required=False)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    activity_logs = TaskActivityLogSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    subtask_count = serializers.SerializerMethodField()
    completed_subtask_count = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_id', 'section', 'section_id', 'section_name', 'title', 'description',
            'assigned_to', 'assigned_to_id', 'created_by', 'created_by_id', 'priority', 'status',
            'progress_percentage', 'estimated_hours', 'deadline', 'tags', 'is_cancelled',
            'cancellation_reason', 'blocked_reason', 'in_progress_at', 'under_review_at', 'completed_at',
            'cancelled_at', 'created_at', 'updated_at', 'subtasks', 'comments', 'attachments', 'activity_logs',
            'comment_count', 'attachment_count', 'subtask_count', 'completed_subtask_count', 'is_overdue',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'in_progress_at', 'under_review_at', 'completed_at', 'cancelled_at']

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        section = attrs.get('section') or getattr(self.instance, 'section', None)
        deadline = attrs.get('deadline') or getattr(self.instance, 'deadline', None)

        if section and project and section.project_id != project.id:
            raise serializers.ValidationError({'section_id': 'Section must belong to the selected project.'})

        if deadline and project and deadline.date() > project.deadline:
            raise serializers.ValidationError({'deadline': 'Task deadline cannot be after the project deadline.'})

        if deadline and deadline < timezone.now():
            raise serializers.ValidationError({'deadline': 'Task deadline cannot be in the past.'})

        tags = attrs.get('tags')
        if isinstance(tags, str):
            attrs['tags'] = [tag.strip() for tag in tags.split(',') if tag.strip()]

        return attrs

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_attachment_count(self, obj):
        return obj.attachments.count()

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_completed_subtask_count(self, obj):
        return obj.subtasks.filter(is_completed=True).count()

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_section_name(self, obj):
        return obj.section.name if obj.section else 'General'


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
