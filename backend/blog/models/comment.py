from django.db import models
from django.contrib.auth import get_user_model
from blog.models import BlogPost

User = get_user_model()


class Comment(models.Model):
    blog_post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    pub_date = models.DateTimeField(auto_now_add=True)
    pinned = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['blog_post', 'pinned'], name='unique_pinned_comment_per_post', condition=models.Q(pinned=True))
        ]

    def save(self, *args, **kwargs):
        if self.pinned:
            Comment.objects.filter(blog_post=self.blog_post, pinned=True).update(pinned=False)
        super().save(*args, **kwargs)
