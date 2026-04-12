from django.db import models
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta


def default_invitation_expiry():
    return timezone.now() + timedelta(days=7)

# --- NEW MODELS for Templates ---
class ProjectTemplate(models.Model):
    title = models.CharField(max_length=200)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'LECTURER'})
    course_code = models.CharField(max_length=20, help_text="e.g., SOFTENG 350")
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} ({self.course_code})"

class MilestoneTemplate(models.Model):
    project_template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, related_name='milestone_templates')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0, help_text="e.g., 1 for the first milestone, 2 for the second...")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

# --- EXISTING MODELS (with updates) ---
class Project(models.Model):
    class LifecycleStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        ARCHIVED = 'ARCHIVED', 'Archived'

    title = models.CharField(max_length=200)
    description = models.TextField()
    course_code = models.CharField(max_length=20, blank=True)
    deadline = models.DateField()
    lifecycle_status = models.CharField(
        max_length=20,
        choices=LifecycleStatus.choices,
        default=LifecycleStatus.ACTIVE,
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'LECTURER'}, related_name='supervised_projects'
    )
    # Link to the template used to create this project
    template_used = models.ForeignKey(ProjectTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    def get_absolute_url(self):
        return reverse('project_dashboard', kwargs={'project_id': self.pk})

    class Meta:
        ordering = ['deadline', '-created_at']

class Team(models.Model):
    # --- ADD CO_LEADER ROLE ---
    class Role(models.TextChoices):
        LEADER = "LEADER", "Group Leader"
        CO_LEADER = "CO_LEADER", "Co-Leader" # New Role
        MEMBER = "MEMBER", "Member"
    
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="team")
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='TeamMembership')

    def __str__(self):
        return f"Team for {self.project.title}"

# ... (TeamMembership, Milestone, and Invitation models are the same for now) ...
class TeamMembership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=Team.Role.choices, default=Team.Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'team')
    def __str__(self):
        return f"{self.user.username} in {self.team.project.title} as {self.get_role_display()}"


class Milestone(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        OVERDUE = 'OVERDUE', 'Overdue'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # --- NEW FIELD ---
    # Tracks which team members are responsible for this milestone.
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='milestones'
    )

    class Meta:
        ordering = ['due_date']  # Order milestones by their due date by default

    def __str__(self):
        return f"{self.title} for {self.project.title}"

class Invitation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        DECLINED = 'DECLINED', 'Declined'
        EXPIRED = 'EXPIRED', 'Expired'
        CANCELLED = 'CANCELLED', 'Cancelled'
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invitations')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_invitations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    sent_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_invitation_expiry)

    @property
    def is_expired(self):
        return self.status == self.Status.EXPIRED or timezone.now() >= self.expires_at

    class Meta:
        unique_together = ('project', 'receiver')
    def __str__(self):
        return f"Invitation from {self.sender.username} to {self.receiver.username} for {self.project.title}"


class Notification(models.Model):
    class Type(models.TextChoices):
        INVITATION = 'INVITATION', 'Invitation'
        INVITATION_ACCEPTED = 'INVITATION_ACCEPTED', 'Invitation Accepted'
        INVITATION_DECLINED = 'INVITATION_DECLINED', 'Invitation Declined'
        INVITATION_EXPIRED = 'INVITATION_EXPIRED', 'Invitation Expired'
        INVITATION_CANCELLED = 'INVITATION_CANCELLED', 'Invitation Cancelled'
        TASK_ASSIGNED = 'TASK_ASSIGNED', 'Task Assigned'
        TASK_REASSIGNED = 'TASK_REASSIGNED', 'Task Reassigned'
        TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED', 'Task Status Changed'
        TASK_BLOCKED = 'TASK_BLOCKED', 'Task Blocked'
        TASK_DEADLINE_REMINDER = 'TASK_DEADLINE_REMINDER', 'Task Deadline Reminder'
        TASK_OVERDUE = 'TASK_OVERDUE', 'Task Overdue'
        TASK_COMMENTED = 'TASK_COMMENTED', 'Task Commented'
        MILESTONE = 'MILESTONE', 'Milestone'
        PROJECT = 'PROJECT', 'Project'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')

    class Meta:
        ordering = ['-created_at']

    def mark_as_read(self):
        if not self.read_at:
            self.read_at = timezone.now()
            self.save(update_fields=['read_at'])

    def __str__(self):
        return f"{self.get_type_display()} for {self.recipient.username}: {self.title}"


class Section(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.project.title})"


class Task(models.Model):
    class Priority(models.TextChoices):
        URGENT = 'URGENT', 'Urgent'
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    class Status(models.TextChoices):
        TODO = 'TODO', 'To-Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        DONE = 'DONE', 'Done'
        BLOCKED = 'BLOCKED', 'Blocked'
        CANCELLED = 'CANCELLED', 'Cancelled'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    progress_percentage = models.PositiveSmallIntegerField(default=0)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    deadline = models.DateTimeField()
    tags = models.JSONField(default=list, blank=True)
    is_cancelled = models.BooleanField(default=False)
    cancellation_reason = models.TextField(blank=True)
    blocked_reason = models.TextField(blank=True)
    in_progress_at = models.DateTimeField(null=True, blank=True)
    under_review_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['deadline', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        return not self.is_cancelled and self.status != self.Status.DONE and timezone.now() > self.deadline


class SubTask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    description = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Sub-task for {self.task.title}: {self.description}"


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def can_edit(self):
        if not self.created_at:
            return False
        return timezone.now() <= self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"


class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_attachments')
    file = models.FileField(upload_to='task_attachments/%Y/%m/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name


class TaskActivityLog(models.Model):
    class ActionType(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        STATUS_CHANGED = 'STATUS_CHANGED', 'Status Changed'
        REASSIGNED = 'REASSIGNED', 'Reassigned'
        COMMENTED = 'COMMENTED', 'Commented'
        ATTACHMENT_ADDED = 'ATTACHMENT_ADDED', 'Attachment Added'
        DETAILS_UPDATED = 'DETAILS_UPDATED', 'Details Updated'
        BLOCKED = 'BLOCKED', 'Blocked'
        CANCELLED = 'CANCELLED', 'Cancelled'
        SUBTASK_ADDED = 'SUBTASK_ADDED', 'Sub-task Added'
        SUBTASK_COMPLETED = 'SUBTASK_COMPLETED', 'Sub-task Completed'

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity_logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='task_activities')
    action_type = models.CharField(max_length=40, choices=ActionType.choices)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_action_type_display()} - {self.task.title}"


class TaskNotification(models.Model):
    class Type(models.TextChoices):
        TASK_ASSIGNED = 'TASK_ASSIGNED', 'Task Assigned'
        TASK_REASSIGNED = 'TASK_REASSIGNED', 'Task Reassigned'
        TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED', 'Task Status Changed'
        TASK_BLOCKED = 'TASK_BLOCKED', 'Task Blocked'
        TASK_DEADLINE_REMINDER = 'TASK_DEADLINE_REMINDER', 'Task Deadline Reminder'
        TASK_OVERDUE = 'TASK_OVERDUE', 'Task Overdue'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_notifications')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_notifications')
    notification_type = models.CharField(max_length=40, choices=Type.choices)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.recipient.username}"