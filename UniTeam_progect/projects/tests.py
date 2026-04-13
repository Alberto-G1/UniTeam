from datetime import date, timedelta

from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Invitation, Notification, TeamMembership, Project, FileFolder, ProjectFile, ProjectTrash
from users.models import CustomUser


class ProjectPhase2APITests(APITestCase):
	def setUp(self):
		self.student_leader = CustomUser.objects.create_user(
			username='leader',
			email='leader@example.com',
			password='pass12345',
			role=CustomUser.Role.STUDENT,
		)
		self.student_member = CustomUser.objects.create_user(
			username='member',
			email='member@example.com',
			password='pass12345',
			role=CustomUser.Role.STUDENT,
		)
		self.student_other = CustomUser.objects.create_user(
			username='other',
			email='other@example.com',
			password='pass12345',
			role=CustomUser.Role.STUDENT,
		)
		self.lecturer = CustomUser.objects.create_user(
			username='lecturer',
			email='lecturer@example.com',
			password='pass12345',
			role=CustomUser.Role.LECTURER,
			is_approved=True,
		)
		self.admin = CustomUser.objects.create_user(
			username='admin',
			email='admin@example.com',
			password='pass12345',
			role=CustomUser.Role.ADMIN,
			is_staff=True,
			is_superuser=True,
		)

	def _authenticate(self, user):
		self.client.force_authenticate(user=user)

	def _create_project(self, title='Phase 2 Project'):
		self._authenticate(self.student_leader)
		response = self.client.post('/api/projects/', {
			'title': title,
			'description': 'Project description',
			'course_code': 'SE350',
			'deadline': str(date.today() + timedelta(days=30)),
			'supervisor_id': self.lecturer.id,
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		return response.data

	def _create_project_with_payload(self, payload):
		self._authenticate(self.student_leader)
		base_payload = {
			'title': 'Phase 2 Project',
			'description': 'Project description',
			'course_code': 'SE350',
			'deadline': str(date.today() + timedelta(days=30)),
		}
		base_payload.update(payload)
		response = self.client.post('/api/projects/', base_payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		return response.data

	def _invite_member(self, project_id, receiver_id):
		self._authenticate(self.student_leader)
		response = self.client.post(f'/api/projects/{project_id}/invite_member/', {
			'receiver_id': receiver_id,
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		return response.data

	def test_create_project_sets_lifecycle_and_leader_membership(self):
		project = self._create_project()
		self.assertEqual(project['lifecycle_status'], 'ACTIVE')

		membership = TeamMembership.objects.filter(
			team__project_id=project['id'],
			user=self.student_leader,
		).first()
		self.assertIsNotNone(membership)
		self.assertEqual(membership.role, 'LEADER')

	def test_invitation_accept_flow(self):
		project = self._create_project()
		invitation = self._invite_member(project['id'], self.student_member.id)

		self._authenticate(self.student_member)
		response = self.client.post(f"/api/invitations/{invitation['id']}/accept/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		accepted = Invitation.objects.get(id=invitation['id'])
		self.assertEqual(accepted.status, Invitation.Status.ACCEPTED)
		self.assertTrue(
			TeamMembership.objects.filter(team=accepted.project.team, user=self.student_member).exists()
		)

	def test_invitation_decline_flow(self):
		project = self._create_project(title='Decline Project')
		invitation = self._invite_member(project['id'], self.student_other.id)

		self._authenticate(self.student_other)
		response = self.client.post(f"/api/invitations/{invitation['id']}/decline/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		declined = Invitation.objects.get(id=invitation['id'])
		self.assertEqual(declined.status, Invitation.Status.DECLINED)

	def test_invitation_cancel_flow(self):
		project = self._create_project(title='Cancel Project')
		invitation = self._invite_member(project['id'], self.student_other.id)

		self._authenticate(self.student_leader)
		response = self.client.post(f"/api/invitations/{invitation['id']}/cancel/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		cancelled = Invitation.objects.get(id=invitation['id'])
		self.assertEqual(cancelled.status, Invitation.Status.CANCELLED)

	def test_expire_and_resend_invitation(self):
		project = self._create_project(title='Expiry Project')
		invitation_data = self._invite_member(project['id'], self.student_member.id)
		invitation = Invitation.objects.get(id=invitation_data['id'])
		invitation.expires_at = timezone.now() - timedelta(minutes=1)
		invitation.save(update_fields=['expires_at'])

		self._authenticate(self.student_leader)
		expire_response = self.client.post('/api/invitations/expire_stale/')
		self.assertEqual(expire_response.status_code, status.HTTP_200_OK)

		invitation.refresh_from_db()
		self.assertEqual(invitation.status, Invitation.Status.EXPIRED)

		resend_response = self.client.post(f'/api/invitations/{invitation.id}/resend/')
		self.assertEqual(resend_response.status_code, status.HTTP_200_OK)
		invitation.refresh_from_db()
		self.assertEqual(invitation.status, Invitation.Status.PENDING)
		self.assertGreater(invitation.expires_at, timezone.now())

	def test_project_creation_links_approved_lecturer_by_email(self):
		project = self._create_project_with_payload({
			'title': 'Linked Lecturer Project',
			'linked_lecturer_email': self.lecturer.email,
			'supervisor_id': None,
		})
		self.assertEqual(project['supervisor']['id'], self.lecturer.id)

	def test_lecturer_course_code_search_and_link(self):
		project = self._create_project_with_payload({
			'title': 'Course Code Project',
			'course_code': 'CS410',
			'supervisor_id': None,
		})

		self._authenticate(self.lecturer)
		search = self.client.get('/api/projects/search_by_course_code/', {'course_code': 'CS410'})
		self.assertEqual(search.status_code, status.HTTP_200_OK)
		search_results = search.data if isinstance(search.data, list) else search.data.get('results', [])
		self.assertGreaterEqual(len(search_results), 1)

		link = self.client.post(f"/api/projects/{project['id']}/link_lecturer/", {
			'course_code': 'CS410',
		}, format='json')
		self.assertEqual(link.status_code, status.HTTP_200_OK)
		self.assertEqual(link.data['supervisor']['id'], self.lecturer.id)

	def test_projects_are_sorted_by_deadline(self):
		self._create_project_with_payload({
			'title': 'Later Project',
			'course_code': 'SE999',
			'deadline': str(date.today() + timedelta(days=30)),
			'supervisor_id': self.lecturer.id,
		})
		self._create_project_with_payload({
			'title': 'Sooner Project',
			'course_code': 'SE998',
			'deadline': str(date.today() + timedelta(days=5)),
			'supervisor_id': self.lecturer.id,
		})

		self._authenticate(self.student_leader)
		response = self.client.get('/api/projects/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		project_list = response.data.get('results', response.data)
		self.assertGreaterEqual(len(project_list), 2)
		self.assertEqual(project_list[0]['title'], 'Sooner Project')

	def test_project_invitation_overview_for_leader(self):
		project = self._create_project(title='Overview Project')
		invitation_data = self._invite_member(project['id'], self.student_member.id)
		invitation = Invitation.objects.get(id=invitation_data['id'])
		invitation.status = Invitation.Status.DECLINED
		invitation.save(update_fields=['status'])

		self._authenticate(self.student_leader)
		all_view = self.client.get(f"/api/projects/{project['id']}/invitations_overview/")
		self.assertEqual(all_view.status_code, status.HTTP_200_OK)
		self.assertEqual(len(all_view.data), 1)

		declined_view = self.client.get(f"/api/projects/{project['id']}/invitations_overview/?status=DECLINED")
		self.assertEqual(declined_view.status_code, status.HTTP_200_OK)
		self.assertEqual(len(declined_view.data), 1)

	def test_transfer_ownership_and_leave_constraints(self):
		project = self._create_project(title='Ownership Project')
		self._invite_member(project['id'], self.student_member.id)

		# Add member to team by accepting invite
		invitation = Invitation.objects.filter(project_id=project['id'], receiver=self.student_member).first()
		self._authenticate(self.student_member)
		self.client.post(f'/api/invitations/{invitation.id}/accept/')

		self._authenticate(self.student_leader)
		transfer = self.client.post(f"/api/projects/{project['id']}/transfer_ownership/", {
			'new_leader_id': self.student_member.id,
		}, format='json')
		self.assertEqual(transfer.status_code, status.HTTP_200_OK)

		new_leader = TeamMembership.objects.get(team__project_id=project['id'], user=self.student_member)
		former_leader = TeamMembership.objects.get(team__project_id=project['id'], user=self.student_leader)
		self.assertEqual(new_leader.role, 'LEADER')
		self.assertEqual(former_leader.role, 'CO_LEADER')

		# New leader cannot leave while sole leader
		self._authenticate(self.student_member)
		leave = self.client.post(f"/api/projects/{project['id']}/leave_team/")
		self.assertEqual(leave.status_code, status.HTTP_400_BAD_REQUEST)

	def test_submit_and_archive_transitions(self):
		project = self._create_project(title='Lifecycle Project')

		self._authenticate(self.student_leader)
		upload = self.client.post('/api/project-files/', {
			'project': project['id'],
			'display_name': 'Final Report',
			'tag': 'FINAL',
			'version_note': 'Final submission document',
			'file': SimpleUploadedFile('final_report.pdf', b'final content', content_type='application/pdf'),
		}, format='multipart')
		self.assertEqual(upload.status_code, status.HTTP_201_CREATED)

		self._authenticate(self.student_leader)
		submit = self.client.post(f"/api/projects/{project['id']}/submit_project/")
		self.assertEqual(submit.status_code, status.HTTP_200_OK)

		archive = self.client.post(f"/api/projects/{project['id']}/archive_project/")
		self.assertEqual(archive.status_code, status.HTTP_200_OK)

	def test_notifications_created_for_invitation_and_milestone_update(self):
		project = self._create_project(title='Notifications Project')
		invitation = self._invite_member(project['id'], self.student_member.id)

		self.assertTrue(
			Notification.objects.filter(
				recipient=self.student_member,
				invitation_id=invitation['id'],
				type=Notification.Type.INVITATION,
			).exists()
		)

		self._authenticate(self.student_leader)
		milestone = self.client.post('/api/milestones/', {
			'project': project['id'],
			'title': 'Draft report',
			'description': 'Draft the report',
			'due_date': str(date.today() + timedelta(days=10)),
			'status': 'PENDING',
		}, format='json')
		self.assertEqual(milestone.status_code, status.HTTP_201_CREATED)

		update = self.client.put(f"/api/milestones/{milestone.data['id']}/", {
			'project': project['id'],
			'title': 'Draft report',
			'description': 'Draft the report',
			'due_date': str(date.today() + timedelta(days=10)),
			'status': 'IN_PROGRESS',
		}, format='json')
		self.assertEqual(update.status_code, status.HTTP_200_OK)

		self.assertTrue(
			Notification.objects.filter(
				project_id=project['id'],
				type=Notification.Type.MILESTONE,
				title='Milestone status updated',
			).exists()
		)


class ProjectFilesAPITests(APITestCase):
	def setUp(self):
		self.leader = CustomUser.objects.create_user(
			username='fileleader',
			email='fileleader@example.com',
			password='pass12345',
			role=CustomUser.Role.STUDENT,
		)
		self.member = CustomUser.objects.create_user(
			username='filemember',
			email='filemember@example.com',
			password='pass12345',
			role=CustomUser.Role.STUDENT,
		)
		self.lecturer = CustomUser.objects.create_user(
			username='filelecturer',
			email='filelecturer@example.com',
			password='pass12345',
			role=CustomUser.Role.LECTURER,
			is_approved=True,
		)

		self.client.force_authenticate(user=self.leader)
		project_resp = self.client.post('/api/projects/', {
			'title': 'File Phase Project',
			'description': 'Project with file library',
			'course_code': 'SE460',
			'deadline': str(date.today() + timedelta(days=20)),
			'supervisor_id': self.lecturer.id,
		}, format='json')
		self.assertEqual(project_resp.status_code, status.HTTP_201_CREATED)
		self.project_id = project_resp.data['id']
		self.project = Project.objects.get(id=self.project_id)

		invite_resp = self.client.post(f'/api/projects/{self.project_id}/invite_member/', {
			'receiver_id': self.member.id,
		}, format='json')
		self.assertEqual(invite_resp.status_code, status.HTTP_201_CREATED)
		invitation_id = invite_resp.data['id']

		self.client.force_authenticate(user=self.member)
		accept_resp = self.client.post(f'/api/invitations/{invitation_id}/accept/')
		self.assertEqual(accept_resp.status_code, status.HTTP_200_OK)

		self.client.force_authenticate(user=self.leader)

	def _upload_base_file(self):
		payload = {
			'project': str(self.project_id),
			'display_name': 'System Design',
			'version_note': 'Initial draft',
			'tag': 'DRAFT',
			'file': SimpleUploadedFile('design.pdf', b'initial file', content_type='application/pdf'),
		}
		response = self.client.post('/api/project-files/', payload, format='multipart')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		return response.data

	def test_member_cannot_create_folder(self):
		self.client.force_authenticate(user=self.member)
		response = self.client.post('/api/file-folders/', {
			'project': self.project_id,
			'name': 'Restricted Folder',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_upload_version_and_move_to_trash_then_restore(self):
		created = self._upload_base_file()
		file_id = created['id']

		version_payload = {
			'version_note': 'Second revision',
			'tag': 'FINAL',
			'file': SimpleUploadedFile('design_v2.pdf', b'second file', content_type='application/pdf'),
		}
		version_resp = self.client.post(f'/api/project-files/{file_id}/upload_version/', version_payload, format='multipart')
		self.assertEqual(version_resp.status_code, status.HTTP_200_OK)
		self.assertEqual(version_resp.data['current_version_number'], 2)

		delete_resp = self.client.delete(f'/api/project-files/{file_id}/')
		self.assertEqual(delete_resp.status_code, status.HTTP_204_NO_CONTENT)

		project_file = ProjectFile.objects.get(id=file_id)
		self.assertTrue(project_file.is_deleted)
		trash_entry = ProjectTrash.objects.get(original_file_id=file_id)

		restore_resp = self.client.post(f'/api/project-trash/{trash_entry.id}/restore/')
		self.assertEqual(restore_resp.status_code, status.HTTP_200_OK)

		project_file.refresh_from_db()
		self.assertFalse(project_file.is_deleted)
		self.assertFalse(ProjectTrash.objects.filter(id=trash_entry.id).exists())

	def test_submission_requires_final_file(self):
		response = self.client.post(f'/api/projects/{self.project_id}/submit_project/')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(response.data.get('submission_checklist', {}).get('final_file_uploaded'))

		self._upload_base_file()
		project_file = ProjectFile.objects.filter(project_id=self.project_id).first()
		project_file.tag = 'FINAL'
		project_file.save(update_fields=['tag'])

		response_ok = self.client.post(f'/api/projects/{self.project_id}/submit_project/')
		self.assertEqual(response_ok.status_code, status.HTTP_200_OK)
		self.assertTrue(response_ok.data.get('submission_checklist', {}).get('final_file_uploaded'))

	def test_promote_task_attachment_to_library(self):
		task_resp = self.client.post('/api/tasks/', {
			'project_id': self.project_id,
			'title': 'Prepare Architecture',
			'description': 'Draft system architecture',
			'priority': 'MEDIUM',
			'deadline': str(timezone.now() + timedelta(days=3)),
		}, format='json')
		self.assertEqual(task_resp.status_code, status.HTTP_201_CREATED)

		attachment_resp = self.client.post('/api/task-attachments/', {
			'task': task_resp.data['id'],
			'file': SimpleUploadedFile('diagram.pdf', b'architecture', content_type='application/pdf'),
		}, format='multipart')
		self.assertEqual(attachment_resp.status_code, status.HTTP_201_CREATED)

		promote_resp = self.client.post(f"/api/task-attachments/{attachment_resp.data['id']}/promote_to_library/", {
			'version_note': 'Promoted from task',
		}, format='json')
		self.assertEqual(promote_resp.status_code, status.HTTP_201_CREATED)
		self.assertEqual(promote_resp.data.get('linked_task', {}).get('id'), task_resp.data['id'])
