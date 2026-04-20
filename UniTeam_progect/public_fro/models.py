from django.conf import settings
from django.db import models
from django.utils.text import slugify


class PublicPage(models.Model):
    slug = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=200)
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    hero_title = models.CharField(max_length=220, blank=True)
    hero_subtitle = models.TextField(blank=True)
    body = models.TextField(blank=True)
    cta_label = models.CharField(max_length=80, blank=True)
    cta_url = models.CharField(max_length=255, blank=True)
    hero_image = models.ImageField(upload_to='public/pages/', null=True, blank=True)
    is_published = models.BooleanField(default=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='edited_public_pages',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            self.slug = slugify(self.title)
        if not self.meta_title:
            self.meta_title = self.title
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class PublicPageSection(models.Model):
    page = models.ForeignKey(PublicPage, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.page.slug}: {self.title}'
