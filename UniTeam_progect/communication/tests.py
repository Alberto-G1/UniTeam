from datetime import date, timedelta

from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Project, TeamMembership
from users.models import CustomUser

from .models import Channel, MeetingSlot, Notification, NotificationPreference


class CommunicationAPITests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner',
            first_name='Alice',
            last_name='Owner',
            email='owner@uni.local',
            password='pass12345',
            role=CustomUser.Role.STUDENT,
        )
        self.coleader = CustomUser.objects.create_user(
            username='coleader',
            first_name='Bob',
            last_name='Coleader',
            email='coleader@uni.local',
            password='pass12345',
            role=CustomUser.Role.STUDENT,
        )
        self.member = CustomUser.objects.create_user(
            username='member',
            first_name='Jane',
            last_name='Member',
            email='member@uni.local',
            password='pass12345',
            role=CustomUser.Role.STUDENT,
        )
        self.lecturer = CustomUser.objects.create_user(
            username='lecturer',
            email='lecturer@uni.local',
            password='pass12345',
            role=CustomUser.Role.LECTURER,
            is_approved=True,
        )

        self.client.force_authenticate(user=self.owner)
        project_resp = self.client.post(
            '/api/projects/',
            {
                'title': 'Phase 5 Project',
                'description': 'Communication scope',
                'course_code': 'SE550',
                'deadline': str(date.today() + timedelta(days=20)),
                'supervisor_id': self.lecturer.id,
            },
            format='json',
        )
        self.assertEqual(project_resp.status_code, status.HTTP_201_CREATED)
        self.project = Project.objects.get(id=project_resp.data['id'])

        for teammate in [self.coleader, self.member]:
            self.client.force_authenticate(user=self.owner)
            invite_resp = self.client.post(
                f'/api/projects/{self.project.id}/invite_member/',
                {'receiver_id': teammate.id},
                format='json',
            )
            self.assertEqual(invite_resp.status_code, status.HTTP_201_CREATED)
            invitation_id = invite_resp.data['id']

            self.client.force_authenticate(user=teammate)
            accept_resp = self.client.post(f'/api/invitations/{invitation_id}/accept/')
            self.assertEqual(accept_resp.status_code, status.HTTP_200_OK)

        TeamMembership.objects.filter(team=self.project.team, user=self.coleader).update(role='CO_LEADER')
        self.client.force_authenticate(user=self.owner)

    def _general_channel(self):
        return Channel.objects.get(project=self.project, slug='general')

    def test_default_channels_created_for_project(self):
        channels = Channel.objects.filter(project=self.project, is_deleted=False)
        self.assertTrue(channels.filter(slug='announcements').exists())
        self.assertTrue(channels.filter(slug='general').exists())
        self.assertTrue(channels.filter(slug='random').exists())

    def test_announcements_permissions_matrix(self):
        self.client.force_authenticate(user=self.owner)
        owner_resp = self.client.post(
            '/api/communication/announcements/',
            {'project': self.project.id, 'content': 'Owner announcement'},
            format='json',
        )
        self.assertEqual(owner_resp.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=self.coleader)
        coleader_resp = self.client.post(
            '/api/communication/announcements/',
            {'project': self.project.id, 'content': 'Co-leader announcement'},
            format='json',
        )
        self.assertEqual(coleader_resp.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=self.member)
        member_resp = self.client.post(
            '/api/communication/announcements/',
            {'project': self.project.id, 'content': 'Member announcement attempt'},
            format='json',
        )
        self.assertEqual(member_resp.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.lecturer)
        read_resp = self.client.get('/api/communication/announcements/', {'project': self.project.id})
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)

    def test_channel_create_and_delete_permissions(self):
        self.client.force_authenticate(user=self.member)
        denied_create = self.client.post(
            '/api/communication/channels/',
            {'project': self.project.id, 'name': 'research', 'channel_type': 'DISCUSSION'},
            format='json',
        )
        self.assertEqual(denied_create.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.coleader)
        create_resp = self.client.post(
            '/api/communication/channels/',
            {'project': self.project.id, 'name': 'research', 'channel_type': 'DISCUSSION'},
            format='json',
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        channel_id = create_resp.data['id']

        self.client.force_authenticate(user=self.coleader)
        denied_delete = self.client.delete(f'/api/communication/channels/{channel_id}/')
        self.assertEqual(denied_delete.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.owner)
        owner_delete = self.client.delete(f'/api/communication/channels/{channel_id}/')
        self.assertEqual(owner_delete.status_code, status.HTTP_204_NO_CONTENT)

    def test_message_permissions_and_soft_delete_placeholder(self):
        channel = self._general_channel()

        self.client.force_authenticate(user=self.member)
        message_resp = self.client.post(
            '/api/communication/channel-messages/',
            {'channel': channel.id, 'content': 'Message from member'},
            format='json',
        )
        self.assertEqual(message_resp.status_code, status.HTTP_201_CREATED)

        message_id = message_resp.data['id']

        self.client.force_authenticate(user=self.owner)
        leader_delete = self.client.delete(f'/api/communication/channel-messages/{message_id}/')
        self.assertEqual(leader_delete.status_code, status.HTTP_204_NO_CONTENT)

        check_resp = self.client.get(f'/api/communication/channel-messages/{message_id}/')
        self.assertEqual(check_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(check_resp.data['content'], 'This message was deleted.')

    def test_mention_resolution_with_braced_full_name(self):
        channel = self._general_channel()

        self.client.force_authenticate(user=self.owner)
        message_resp = self.client.post(
            '/api/communication/channel-messages/',
            {'channel': channel.id, 'content': 'Please review this @{Jane Member}'},
            format='json',
        )
        self.assertEqual(message_resp.status_code, status.HTTP_201_CREATED)

        mention_notifications = Notification.objects.filter(
            recipient=self.member,
            type=Notification.Type.CHANNEL_MENTION,
            related_object_type='message',
            related_object_id=message_resp.data['id'],
        )
        self.assertTrue(mention_notifications.exists())

    def test_direct_message_rules(self):
        self.client.force_authenticate(user=self.owner)
        ok_resp = self.client.post(
            '/api/communication/direct-messages/',
            {
                'project': self.project.id,
                'recipient_id': self.member.id,
                'content': 'Private clarifications',
            },
            format='json',
        )
        self.assertEqual(ok_resp.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=self.lecturer)
        denied_resp = self.client.post(
            '/api/communication/direct-messages/',
            {
                'project': self.project.id,
                'recipient_id': self.owner.id,
                'content': 'Private note from lecturer',
            },
            format='json',
        )
        self.assertEqual(denied_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_meeting_poll_workflow_and_reminder_job(self):
        self.client.force_authenticate(user=self.member)
        poll_resp = self.client.post(
            '/api/communication/meeting-polls/',
            {
                'project': self.project.id,
                'title': 'Week 3 Progress Check',
                'description': 'Status updates',
                'meeting_format': 'ONLINE',
                'meeting_link': 'https://meet.example.com/abc',
                'response_deadline': timezone.now() + timedelta(days=1),
            },
            format='json',
        )
        self.assertEqual(poll_resp.status_code, status.HTTP_201_CREATED)
        poll_id = poll_resp.data['id']

        self.client.force_authenticate(user=self.member)
        slot_resp = self.client.post(
            f'/api/communication/meeting-polls/{poll_id}/add_slot/',
            {
                'poll': poll_id,
                'start_datetime': timezone.now() + timedelta(minutes=55),
                'end_datetime': timezone.now() + timedelta(minutes=115),
            },
            format='json',
        )
        self.assertEqual(slot_resp.status_code, status.HTTP_201_CREATED)
        slot_id = slot_resp.data['id']

        self.client.force_authenticate(user=self.owner)
        vote_resp = self.client.post(
            f'/api/communication/meeting-polls/{poll_id}/respond/',
            {
                'poll': poll_id,
                'slot': slot_id,
                'slot_id': slot_id,
                'availability': 'AVAILABLE',
            },
            format='json',
        )
        self.assertEqual(vote_resp.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.owner)
        confirm_resp = self.client.post(
            f'/api/communication/meeting-polls/{poll_id}/confirm_slot/',
            {'slot_id': slot_id},
            format='json',
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_200_OK)

        call_command('send_meeting_reminders')
        slot = MeetingSlot.objects.get(id=slot_id)
        self.assertIsNotNone(slot.reminder_sent_at)
        self.assertTrue(
            Notification.objects.filter(
                type=Notification.Type.MEETING_REMINDER,
                related_object_id=poll_id,
            ).exists()
        )

    @override_settings(ENABLE_EMAIL_NOTIFICATIONS=True)
    def test_digest_and_purge_jobs(self):
        NotificationPreference.objects.create(
            user=self.member,
            notification_type=Notification.Type.ANNOUNCEMENT,
            in_app_enabled=True,
            email_enabled=True,
            email_frequency=NotificationPreference.EmailFrequency.DIGEST,
        )

        self.client.force_authenticate(user=self.owner)
        announce_resp = self.client.post(
            '/api/communication/announcements/',
            {'project': self.project.id, 'content': 'Digest test announcement'},
            format='json',
        )
        self.assertEqual(announce_resp.status_code, status.HTTP_201_CREATED)

        call_command('send_notification_digests')
        self.assertTrue(Notification.objects.filter(digest_sent_at__isnull=False).exists())

        custom_channel = Channel.objects.create(
            project=self.project,
            name='temp-archive',
            slug='temp-archive',
            channel_type='DISCUSSION',
            created_by=self.owner,
            is_deleted=True,
            archived_until=timezone.now() - timedelta(days=1),
        )
        call_command('purge_archived_channels')
        self.assertFalse(Channel.objects.filter(id=custom_channel.id).exists())
