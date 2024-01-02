from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from ..models import CustomUser, Follow


class CustomUserModelTests(TestCase):
    def test_create_custom_user(self):
        User = get_user_model()
        user = User.objects.create_user(username='testuser', email='testuser@example.com', password='testpassword')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertTrue(user.check_password('testpassword'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_custom_superuser(self):
        User = get_user_model()
        user = User.objects.create_superuser(username='testadmin', email='testadmin@example.com',
                                             password='testpassword')
        self.assertEqual(user.username, 'testadmin')
        self.assertEqual(user.email, 'testadmin@example.com')
        self.assertTrue(user.check_password('testpassword'))
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)


class ProfileModelTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(username='testuser', email='testuser@example.com',
                                                   password='testpassword')

    def test_profile_created(self):
        self.assertIsNotNone(self.user.profile)

    def test_profile_delete_image(self):
        profile = self.user.profile
        profile.image = SimpleUploadedFile(name='test_image.jpg', content=b'', content_type='image/jpeg')
        profile.save()
        self.assertIsNotNone(profile.image)
        profile.delete_image()
        self.assertIsNone(profile.image)

    def test_profile_str(self):
        self.assertEqual(str(self.user.profile), 'testuser Profile')


class FollowModelTests(TestCase):
    def setUp(self):
        self.user1 = CustomUser.objects.create_user(username='user1', email='user1@example.com',
                                                    password='testpassword')
        self.user2 = CustomUser.objects.create_user(username='user2', email='user2@example.com',
                                                    password='testpassword')

    def test_follow_created(self):
        follow = Follow.objects.create(follower=self.user1.profile, following=self.user2.profile)
        self.assertEqual(follow.follower, self.user1.profile)
        self.assertEqual(follow.following, self.user2.profile)

    def test_follow_str(self):
        follow = Follow.objects.create(follower=self.user1.profile, following=self.user2.profile)
        self.assertEqual(str(follow), 'user1 follows user2')
