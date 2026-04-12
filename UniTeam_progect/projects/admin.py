from django.contrib import admin
from .models import (
	Project, Team, TeamMembership, Milestone, Invitation,
	ProjectTemplate, MilestoneTemplate, Notification
)

admin.site.register(Project)
admin.site.register(Team)
admin.site.register(TeamMembership)
admin.site.register(Milestone)
admin.site.register(Invitation)
admin.site.register(ProjectTemplate)
admin.site.register(MilestoneTemplate)
admin.site.register(Notification)
