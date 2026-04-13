from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ProjectViewSet, TeamMembershipViewSet, MilestoneViewSet,
    InvitationViewSet, ProjectTemplateViewSet, MilestoneTemplateViewSet,
    NotificationViewSet, SectionViewSet, TaskViewSet, TaskCommentViewSet, TaskAttachmentViewSet,
    FileFolderViewSet, ProjectFileViewSet, ProjectFileVersionViewSet, ProjectFileActivityLogViewSet,
    ProjectTrashViewSet
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
router.register(r'file-folders', FileFolderViewSet, basename='filefolder')
router.register(r'project-files', ProjectFileViewSet, basename='projectfile')
router.register(r'project-file-versions', ProjectFileVersionViewSet, basename='projectfileversion')
router.register(r'project-file-activity', ProjectFileActivityLogViewSet, basename='projectfileactivity')
router.register(r'project-trash', ProjectTrashViewSet, basename='projecttrash')

urlpatterns = [
    path('', include(router.urls)),
]
