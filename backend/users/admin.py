from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm
from django.core.exceptions import ValidationError
from .models import CustomUser, Profile, Follow
from .validators import validate_unique_username


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = '__all__'

    def clean_username(self):
        username = self.cleaned_data['username']

        try:
            validate_unique_username(username, user_instance=self.instance)
        except ValidationError as e:
            self.add_error('username', e)

        return username

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    pass


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    pass
