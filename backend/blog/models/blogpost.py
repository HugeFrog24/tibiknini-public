from django.contrib.auth import get_user_model
from django.db import models

from ..fields import HexColorField
from ..utils import get_random_accent_color
from ..validators import tag_name_validator

User = get_user_model()


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, validators=[tag_name_validator])
    color = HexColorField(default='#000000')

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        self.color = self.color.upper()
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    pub_date = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='blog_images/', blank=True)
    is_draft = models.BooleanField(default=True)
    hidden = models.BooleanField(default=False)
    tags = models.ManyToManyField(Tag, blank=True)
    accent_color = HexColorField(max_length=7, default=get_random_accent_color)

    def __str__(self):
        return self.title


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"{self.user.username} likes {self.post.title}"
