# Generated by Django 4.2 on 2023-05-07 00:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_siteinfo_tos_version'),
    ]

    operations = [
        migrations.AlterField(
            model_name='siteinfo',
            name='tos_version',
            field=models.IntegerField(default=0),
        ),
    ]
