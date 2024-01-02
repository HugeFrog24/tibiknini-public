# Generated by Django 4.2 on 2023-08-24 20:08

import blog.utils
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='blogpost',
            name='accent_color',
            field=models.CharField(default=blog.utils.get_random_accent_color, max_length=7),
        ),
    ]
