from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.core.exceptions import MultipleObjectsReturned

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        
        # Try to fetch the user by username
        try:
            user = UserModel.objects.get(username=username)
        except UserModel.DoesNotExist:
            # If not found, try by email
            try:
                user = UserModel.objects.get(email=username)
            except UserModel.DoesNotExist:
                # If still not found, no user matches, so return None
                return None
            except MultipleObjectsReturned:
                # This should not happen if your emails are unique
                return None
        
        # Check the password and user status
        if user.check_password(password) and self.user_can_authenticate(user):
            
            # --- LECTURER APPROVAL CHECK ---
            if user.role == UserModel.Role.LECTURER and not user.is_approved:
                # If a lecturer is not approved, authentication fails.
                return None
            
            return user