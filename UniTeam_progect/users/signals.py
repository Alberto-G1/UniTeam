from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, StudentProfile, LecturerProfile, AdminProfile

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a profile for the user based on their role when they are first created."""
    if created:
        if instance.role == CustomUser.Role.STUDENT:
            StudentProfile.objects.create(user=instance)
        elif instance.role == CustomUser.Role.LECTURER:
            LecturerProfile.objects.create(user=instance)
        elif instance.role == CustomUser.Role.ADMIN:
            AdminProfile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """Save the profile whenever the user object is saved."""
    if hasattr(instance, 'studentprofile'):
        instance.studentprofile.save()
    elif hasattr(instance, 'lecturerprofile'):
        instance.lecturerprofile.save()
    elif hasattr(instance, 'adminprofile'):
        instance.adminprofile.save()