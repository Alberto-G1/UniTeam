from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .api_views import (
    register_view, login_view, current_user_view,
    UserViewSet, StudentProfileViewSet, LecturerProfileViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'student-profiles', StudentProfileViewSet, basename='studentprofile')
router.register(r'lecturer-profiles', LecturerProfileViewSet, basename='lecturerprofile')

urlpatterns = [
    # Authentication endpoints
    path('register/', register_view, name='api_register'),
    path('login/', login_view, name='api_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', current_user_view, name='current_user'),
    
    # Router URLs
    path('', include(router.urls)),
]
