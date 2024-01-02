from django.db import models
from .validators import hex_color_validator


class HexColorField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 7
        kwargs['validators'] = [hex_color_validator]
        super().__init__(*args, **kwargs)
