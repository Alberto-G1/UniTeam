from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PublicPage, PublicPageSection


class PublicFroApiTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            username='publicfroadmin',
            email='admin@example.com',
            password='StrongPass123!',
            role='ADMIN',
        )

    def test_public_page_list_returns_published_pages(self):
        page = PublicPage.objects.create(
            slug='about',
            title='About',
            hero_title='About UniTeam',
            body='About body text',
            is_published=True,
            updated_by=self.admin,
        )
        PublicPageSection.objects.create(page=page, title='Mission', body='Mission body', order=1)

        response = self.client.get(reverse('public_fro_page_list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'about')
        self.assertEqual(len(response.data[0]['sections']), 1)

    def test_admin_can_create_public_page(self):
        self.client.force_authenticate(self.admin)
        payload = {
            'slug': 'team',
            'title': 'Team',
            'meta_title': 'Team | UniTeam',
            'meta_description': 'Meet the team.',
            'hero_title': 'The Team',
            'hero_subtitle': 'People behind the platform',
            'body': 'Team body',
            'cta_label': 'Contact Us',
            'cta_url': '/contact',
            'is_published': True,
        }

        response = self.client.post(reverse('public_fro_admin_page_list'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PublicPage.objects.count(), 1)
        self.assertEqual(response.data['slug'], 'team')

    def test_admin_can_update_public_page(self):
        page = PublicPage.objects.create(
            slug='services',
            title='Services',
            body='Old body',
            is_published=True,
            updated_by=self.admin,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            reverse('public_fro_admin_page_detail', kwargs={'slug': page.slug}),
            {'body': 'Updated body'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        page.refresh_from_db()
        self.assertEqual(page.body, 'Updated body')
