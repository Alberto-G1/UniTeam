from django.urls import path
from . import views

urlpatterns = [
    # Existing URLs
    path('create/', views.create_project_view, name='create_project'),
    path('<int:project_id>/', views.project_dashboard_view, name='project_dashboard'),
    path('<int:project_id>/invite/', views.invite_member_view, name='invite_member'),
    path('invitations/', views.view_invitations_view, name='view_invitations'),
    path('invitations/respond/<int:invitation_id>/<str:response>/', views.respond_to_invitation_view, name='respond_to_invitation'),
    
    # --- URLs FOR PROJECT MANAGEMENT ---
    path('my-projects/', views.my_projects_view, name='my_projects'),
    path('<int:project_id>/edit/', views.edit_project_view, name='edit_project'),
    path('<int:project_id>/delete/', views.delete_project_view, name='delete_project'),

        # --- Lecturer Template Management ---
    path('templates/', views.list_project_templates_view, name='list_project_templates'),
    path('templates/create/', views.create_project_template_view, name='create_project_template'),
    path('templates/<int:template_id>/', views.project_template_details_view, name='project_template_details'),
    path('templates/<int:template_id>/edit/', views.edit_project_template_view, name='edit_project_template'),
    path('templates/<int:template_id>/add-milestone/', views.add_milestone_template_view, name='add_milestone_template'),

    # --- Team Role Management ---
    path('<int:project_id>/manage-team/', views.manage_team_view, name='manage_team'),
    path('membership/<int:membership_id>/update-role/', views.update_member_role_view, name='update_member_role'),

    # --- Milestone Management URLs ---
    path('<int:project_id>/milestones/add/', views.add_milestone_view, name='add_milestone'),
    path('milestones/<int:milestone_id>/edit/', views.edit_milestone_view, name='edit_milestone'),
    path('milestones/<int:milestone_id>/delete/', views.delete_milestone_view, name='delete_milestone'),
    path('milestones/<int:milestone_id>/update-status/', views.update_milestone_status_view,
         name='update_milestone_status'),

]