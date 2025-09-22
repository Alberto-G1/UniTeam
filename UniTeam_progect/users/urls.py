# users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # --- Auth URLs ---
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # --- Profile URL ---
    path('profile/', views.profile_details_view, name='profile_details'),
    path('profile/edit/', views.profile_edit_view, name='profile_edit'),
    
    # --- Dashboard URLs ---
    path('dashboard/', views.dashboard_redirect_view, name='dashboard_redirect'),
    path('dashboard/student/', views.student_dashboard, name='student_dashboard'),
    path('dashboard/lecturer/', views.lecturer_dashboard, name='lecturer_dashboard'),
    path('dashboard/admin/', views.admin_dashboard, name='admin_dashboard'),

    # --- NEW: Admin User Management URLs ---
    path('admin/users/', views.admin_user_list, name='admin_user_list'),
    path('admin/users/edit/<int:user_id>/', views.admin_edit_user, name='admin_edit_user'),
    path('admin/users/delete/<int:user_id>/', views.admin_delete_user, name='admin_delete_user'),
    path('admin/users/toggle-approval/<int:user_id>/', views.admin_toggle_approval, name='admin_toggle_approval'),
]