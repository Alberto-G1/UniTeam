from django.core.management.base import BaseCommand
from django.utils import timezone

from projects.models import Invitation, Notification


class Command(BaseCommand):
    help = 'Expire stale project invitations and create in-app notifications.'

    def handle(self, *args, **options):
        now = timezone.now()
        stale_invitations = Invitation.objects.filter(
            status=Invitation.Status.PENDING,
            expires_at__lte=now,
        ).select_related('sender', 'receiver', 'project')

        expired_count = 0
        for invitation in stale_invitations:
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=['status'])
            expired_count += 1

            Notification.objects.bulk_create([
                Notification(
                    recipient=invitation.sender,
                    type=Notification.Type.INVITATION_EXPIRED,
                    title='Invitation expired',
                    message=f'Invitation for project "{invitation.project.title}" has expired.',
                    project=invitation.project,
                    invitation=invitation,
                ),
                Notification(
                    recipient=invitation.receiver,
                    type=Notification.Type.INVITATION_EXPIRED,
                    title='Invitation expired',
                    message=f'Invitation for project "{invitation.project.title}" has expired.',
                    project=invitation.project,
                    invitation=invitation,
                ),
            ])

        self.stdout.write(self.style.SUCCESS(f'Expired invitations: {expired_count}'))
