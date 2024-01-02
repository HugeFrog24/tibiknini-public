# Generated by Django 4.2 on 2023-05-07 00:02

import django.core.validators
from django.db import migrations, models
import users.validators


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_alter_customuser_password_changed_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='username',
            field=models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and ./-/_ only.', max_length=150, unique=True, validators=[django.core.validators.RegexValidator('^[\\w\\.-]+$', 'Enter a valid username. This value may contain only letters, numbers, and ./-/_ characters.'), users.validators.validate_reserved_username], verbose_name='username'),
        ),
    ]
