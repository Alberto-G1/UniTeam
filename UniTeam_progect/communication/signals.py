from django.db.models.signals import post_save
from django.dispatch import receiver

from projects.models import Project

from .models import Channel


@receiver(post_save, sender=Project)
def ensure_default_communication_channels(sender, instance, created, **kwargs):
    if not created:
        return

    defaults = [
        ('announcements', Channel.Type.ANNOUNCEMENT),
        ('general', Channel.Type.DISCUSSION),
        ('random', Channel.Type.DISCUSSION),
    ]

    for name, channel_type in defaults:
        Channel.objects.get_or_create(
            project=instance,
            slug=name,
            defaults={
                'name': name,
                'channel_type': channel_type,
                'created_by': None,
                'is_default': True,
            },
        )
