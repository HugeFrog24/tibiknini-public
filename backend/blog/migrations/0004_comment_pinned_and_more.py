# Generated by Django 4.2 on 2023-09-09 18:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_rename_user_comment_author_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='pinned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name='comment',
            constraint=models.UniqueConstraint(condition=models.Q(('pinned', True)), fields=('blog_post', 'pinned'), name='unique_pinned_comment_per_post'),
        ),
    ]