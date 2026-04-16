from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from projects.models import Project, ProjectSnapshot, Task


class Command(BaseCommand):
    help = 'Create daily project snapshots and auto-archive projects 30 days after deadline.'

    def handle(self, *args, **options):
        today = timezone.localdate()
        now = timezone.now()

        snap_count = 0
        archived_count = 0

        projects = Project.objects.exclude(lifecycle_status=Project.LifecycleStatus.ARCHIVED)

        for project in projects:
            tasks = project.tasks.filter(is_cancelled=False)
            task_total = tasks.count()
            done = tasks.filter(status=Task.Status.DONE).count()
            in_progress = tasks.filter(status=Task.Status.IN_PROGRESS).count()
            blocked = tasks.filter(status=Task.Status.BLOCKED).count()
            overdue = tasks.exclude(status=Task.Status.DONE).filter(deadline__lt=now).count()
            remaining = tasks.exclude(status=Task.Status.DONE).count()
            progress = int(round((done / task_total) * 100)) if task_total else 0

            _, created = ProjectSnapshot.objects.get_or_create(
                project=project,
                snapshot_date=today,
                defaults={
                    'metrics': {
                        'task_total': task_total,
                        'done': done,
                        'in_progress': in_progress,
                        'blocked': blocked,
                        'overdue': overdue,
                        'remaining_tasks': remaining,
                        'progress_percentage': progress,
                    }
                },
            )
            if created:
                snap_count += 1

            archive_threshold = project.deadline + timedelta(days=30)
            if today >= archive_threshold and project.lifecycle_status != Project.LifecycleStatus.ARCHIVED:
                project.lifecycle_status = Project.LifecycleStatus.ARCHIVED
                project.save(update_fields=['lifecycle_status', 'updated_at'])
                archived_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Phase 6 maintenance complete. Snapshots created: {snap_count}. Auto-archived projects: {archived_count}.'
            )
        )
