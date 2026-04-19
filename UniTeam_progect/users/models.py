from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.text import slugify
from taggit.managers import TaggableManager
from taggit.models import TaggedItemBase
import uuid

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


class ContactTicket(models.Model):
    class InquiryType(models.TextChoices):
        GENERAL = 'GENERAL', 'General'
        ONBOARDING = 'ONBOARDING', 'Institution onboarding'
        SUPPORT = 'SUPPORT', 'Technical support'
        PARTNERSHIP = 'PARTNERSHIP', 'Partnership'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    reference = models.CharField(max_length=24, unique=True, editable=False)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    inquiry_type = models.CharField(max_length=20, choices=InquiryType.choices, default=InquiryType.GENERAL)
    subject = models.CharField(max_length=180)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"UT-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.subject}"


class PublicAnnouncement(models.Model):
    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    excerpt = models.CharField(max_length=320, blank=True)
    content = models.TextField()
    cover_image = models.ImageField(upload_to='public/news/', null=True, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='public_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:220] or 'news-item'
            slug = base_slug
            counter = 2
            while PublicAnnouncement.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug[:200]}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title