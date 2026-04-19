from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactTicket, PublicAnnouncement


class PublicApiTests(APITestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username='adminseed',
			email='admin@uni.edu',
			password='StrongPass123!',
			role='ADMIN',
		)

	def test_contact_submit_creates_ticket(self):
		payload = {
			'name': 'Alex Student',
			'email': 'alex@example.com',
			'inquiry_type': 'GENERAL',
			'subject': 'Need onboarding info',
			'message': 'Please share onboarding documentation.',
		}

		response = self.client.post(reverse('public_contact_submit'), payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(ContactTicket.objects.count(), 1)
		ticket = ContactTicket.objects.first()
		self.assertEqual(ticket.email, 'alex@example.com')
		self.assertTrue(ticket.reference.startswith('UT-'))
		self.assertIn('ticket', response.data)

	def test_news_list_only_returns_published_items(self):
		PublicAnnouncement.objects.create(
			title='Visible News',
			excerpt='Visible excerpt',
			content='Visible content',
			is_published=True,
			published_at=timezone.now(),
			created_by=self.user,
		)
		PublicAnnouncement.objects.create(
			title='Draft News',
			excerpt='Draft excerpt',
			content='Draft content',
			is_published=False,
			created_by=self.user,
		)

		response = self.client.get(reverse('public_news_list'))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]['title'], 'Visible News')

	def test_news_detail_by_slug(self):
		item = PublicAnnouncement.objects.create(
			title='Semester Kickoff',
			excerpt='Kickoff details',
			content='Welcome to the new semester.',
			is_published=True,
			published_at=timezone.now(),
			created_by=self.user,
		)

		response = self.client.get(reverse('public_news_detail', kwargs={'slug': item.slug}))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['slug'], item.slug)
		self.assertEqual(response.data['title'], 'Semester Kickoff')
