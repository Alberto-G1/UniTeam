from django.core.management.base import BaseCommand
from django.utils import timezone

from communication.models import Channel


class Command(BaseCommand):
    help = 'Permanently purge channels that are archived past retention period.'

    def handle(self, *args, **options):
        now = timezone.now()
        queryset = Channel.objects.filter(
            is_deleted=True,
            archived_until__isnull=False,
            archived_until__lte=now,
        )
        count = queryset.count()
        queryset.delete()
        self.stdout.write(self.style.SUCCESS(f'Purged {count} archived channel(s).'))
