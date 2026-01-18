from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ProjectViewSet, TeamMembershipViewSet, MilestoneViewSet,
    InvitationViewSet, ProjectTemplateViewSet, MilestoneTemplateViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'team-memberships', TeamMembershipViewSet, basename='teammembership')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'project-templates', ProjectTemplateViewSet, basename='projecttemplate')
router.register(r'milestone-templates', MilestoneTemplateViewSet, basename='milestonetemplate')

urlpatterns = [
    path('', include(router.urls)),
]
