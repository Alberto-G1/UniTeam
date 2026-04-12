from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ProjectViewSet, TeamMembershipViewSet, MilestoneViewSet,
    InvitationViewSet, ProjectTemplateViewSet, MilestoneTemplateViewSet,
    NotificationViewSet, SectionViewSet, TaskViewSet, TaskCommentViewSet, TaskAttachmentViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'team-memberships', TeamMembershipViewSet, basename='teammembership')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'project-templates', ProjectTemplateViewSet, basename='projecttemplate')
router.register(r'milestone-templates', MilestoneTemplateViewSet, basename='milestonetemplate')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-comments', TaskCommentViewSet, basename='taskcomment')
router.register(r'task-attachments', TaskAttachmentViewSet, basename='taskattachment')

urlpatterns = [
    path('', include(router.urls)),
]
