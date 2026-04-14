from collections import defaultdict
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone

from communication.models import Notification, NotificationPreference


class Command(BaseCommand):
    help = 'Send digest emails for communication notifications based on user preferences.'

    def handle(self, *args, **options):
        if not getattr(settings, 'ENABLE_EMAIL_NOTIFICATIONS', False):
            self.stdout.write(self.style.WARNING('Email notifications are disabled.'))
            return

        now = timezone.now()
        since = now - timedelta(days=1)

        notifications = Notification.objects.select_related('recipient', 'project').filter(
            created_at__gte=since,
            digest_sent_at__isnull=True,
        )

        grouped = defaultdict(list)
        for notification in notifications:
            pref = NotificationPreference.objects.filter(
                user=notification.recipient,
                notification_type=notification.type,
                email_enabled=True,
                email_frequency=NotificationPreference.EmailFrequency.DIGEST,
            ).first()
            if pref and notification.recipient.email:
                grouped[notification.recipient].append(notification)

        sent_users = 0
        for user, rows in grouped.items():
            lines = []
            for row in rows:
                project_label = f' [{row.project.title}]' if row.project else ''
                lines.append(f'- {row.title}{project_label}: {row.message_body}')

            send_mail(
                subject='[UniTeam] Daily notification digest',
                message='Here is your UniTeam digest for the last 24 hours:\n\n' + '\n'.join(lines),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@uniteam.local'),
                recipient_list=[user.email],
                fail_silently=True,
            )

            Notification.objects.filter(id__in=[row.id for row in rows]).update(digest_sent_at=now)
            sent_users += 1

        self.stdout.write(self.style.SUCCESS(f'Sent digest emails to {sent_users} user(s).'))
