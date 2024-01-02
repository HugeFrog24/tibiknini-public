from django.db import models


class NavbarItem(models.Model):
    label = models.CharField(max_length=100)
    destination_url = models.CharField(max_length=255)

    def __str__(self):
        return self.label
