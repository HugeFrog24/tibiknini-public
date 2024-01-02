from django.db import models


class ContactMessage(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]

    subject = models.CharField(max_length=200)
    message = models.TextField()
    name = models.CharField(max_length=200)
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    status = models.CharField(max_length=6, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
