from django.db import models
from django.contrib.auth.models import AbstractUser
from taggit.managers import TaggableManager
from taggit.models import TaggedItemBase

# --- Through Models for TaggableManager ---
class CourseTag(TaggedItemBase):
    content_object = models.ForeignKey('LecturerProfile', on_delete=models.CASCADE)

class ResearchAreaTag(TaggedItemBase):
    content_object = models.ForeignKey('LecturerProfile', on_delete=models.CASCADE)


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        LECTURER = "LECTURER", "Lecturer"
        STUDENT = "STUDENT", "Student"

    role = models.CharField(max_length=50, choices=Role.choices)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_approved = models.BooleanField(default=True)
    phone_number = models.CharField(max_length=20, blank=True)


    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    personal_email = models.EmailField(blank=True)
    university = models.CharField(max_length=200, blank=True)
    department = models.CharField(max_length=200, blank=True)
    course_name = models.CharField(max_length=200, blank=True)
    year_of_study = models.PositiveIntegerField(null=True, blank=True)
    skills = TaggableManager(blank=True, verbose_name="Skills", help_text="A comma-separated list of skills.")
    bio = models.TextField(blank=True, help_text="A short bio about yourself.")

    def __str__(self):
        return f"{self.user.username}'s Student Profile"

class LecturerProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    department = models.CharField(max_length=200, blank=True)
    
    courses_taught = TaggableManager(
        verbose_name="Courses Taught", 
        through=CourseTag,
        blank=True,
        help_text="A comma-separated list of course codes you teach.",
        related_name="course_lecturers"  # <--- ADD THIS UNIQUE NAME
    )
    
    office_location = models.CharField(max_length=100, blank=True)
    
    research_areas = TaggableManager(
        verbose_name="Research Areas", 
        through=ResearchAreaTag,
        blank=True, 
        help_text="A comma-separated list of research areas.",
        related_name="research_lecturers" # <--- ADD THIS UNIQUE NAME
    )
    
    def __str__(self):
        return f"{self.user.username}'s Lecturer Profile"

class AdminProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    role_title = models.CharField(max_length=100, default="System Administrator")
    responsibilities = models.TextField(blank=True, help_text="Notes on admin responsibilities.")

    def __str__(self):
        return f"{self.user.username}'s Admin Profile"