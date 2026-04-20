from rest_framework.permissions import BasePermission

from users.models import CustomUser


class IsPublicFroAdmin(BasePermission):
    message = 'Admin access required.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or getattr(user, 'role', None) == CustomUser.Role.ADMIN))
