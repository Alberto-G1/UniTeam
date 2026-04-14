from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone

from communication.models import MeetingSlot, Notification
from users.models import CustomUser


class Command(BaseCommand):
    help = 'Send meeting reminder notifications 1 hour before confirmed meeting slot.'

    def handle(self, *args, **options):
        now = timezone.now()
        window_end = now + timedelta(hours=1)

        slots = MeetingSlot.objects.select_related('poll', 'poll__project').filter(
            confirmed=True,
            reminder_sent_at__isnull=True,
            start_datetime__gt=now,
            start_datetime__lte=window_end,
        )

        sent = 0
        for slot in slots:
            project = slot.poll.project
            members = CustomUser.objects.filter(teammembership__team=project.team).distinct()
            notifications = []
            emails = []
            for user in members:
                notifications.append(
                    Notification(
                        recipient=user,
                        type=Notification.Type.MEETING_REMINDER,
                        title=f'Meeting starts in 1 hour: {slot.poll.title}',
                        message_body=f'{slot.poll.title} starts at {slot.start_datetime}.',
                        project=project,
                        related_object_type='meeting_poll',
                        related_object_id=slot.poll_id,
                    )
                )
                if user.email:
                    emails.append(user.email)

            Notification.objects.bulk_create(notifications)

            if getattr(settings, 'ENABLE_EMAIL_NOTIFICATIONS', False) and emails:
                send_mail(
                    subject=f'[UniTeam] Meeting reminder: {slot.poll.title}',
                    message=f'{slot.poll.title} starts in 1 hour at {slot.start_datetime}.',
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@uniteam.local'),
                    recipient_list=emails,
                    fail_silently=True,
                )

            slot.reminder_sent_at = now
            slot.save(update_fields=['reminder_sent_at'])
            sent += 1

        self.stdout.write(self.style.SUCCESS(f'Sent reminders for {sent} meeting slot(s).'))
