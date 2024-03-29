# Generated by Django 4.2.3 on 2023-07-31 13:37

from django.db import migrations, models
import users.utils
import users.validators


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_alter_customuser_username'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to=users.utils.rename_profile_picture, validators=[users.validators.validate_image_file_size]),
        ),
    ]
