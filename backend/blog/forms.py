from django import forms
from markdownx.fields import MarkdownxFormField
from .models import BlogPost


class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'content', 'image', 'hidden', 'tags']
        widgets = {
            'content': MarkdownxFormField(),
        }
