from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from ..models import CustomUser, Follow


class ProfileAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = CustomUser.objects.create_user(username='user1', email='user1@example.com',
                                                    password='testpassword')
        self.user2 = CustomUser.objects.create_user(username='user2', email='user2@example.com',
                                                    password='testpassword')

    def test_profile_list_view(self):
        response = self.client.get(reverse('profile_list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_profile_detail_view(self):
        response = self.client.get(reverse('profile_detail', kwargs={'username': self.user1.username}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user1.username)

    def test_current_user_view(self):
        self.client.login(username='user1', password='testpassword')
        response = self.client.get(reverse('current_user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user1.username)

    def test_profile_image_update_view(self):
        self.client.login(username='user1', password='testpassword')
        image = SimpleUploadedFile(name='test_image.jpg', content=b'', content_type='image/jpeg')
        response = self.client.patch(reverse('profile-image-update', kwargs={'username': self.user1.username}),
                                     {'image': image})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['image'])

    def test_profile_image_delete_view(self):
        self.client.login(username='user1', password='testpassword')
        self.user1.profile.image = SimpleUploadedFile(name='test_image.jpg', content=b'', content_type='image/jpeg')
        self.user1.profile.save()
        response = self.client.delete(reverse('profile-image-delete'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.user1.profile.refresh_from_db()
        self.assertIsNone(self.user1.profile.image)

    def test_follow_toggle_view(self):
        self.client.login(username='user1', password='testpassword')
        response = self.client.post(reverse('follow_toggle'), {'username': self.user2.username})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Follow.objects.filter(follower=self.user1.profile, following=self.user2.profile).exists())
        response = self.client.post(reverse('follow_toggle'), {'username': self.user2.username})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Follow.objects.filter(follower=self.user1.profile, following=self.user2.profile).exists())
