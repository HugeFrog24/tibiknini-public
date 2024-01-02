from django.contrib import admin
from .models import BlogPost, Tag, Comment, Like


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    pass


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    pass


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color')
    search_fields = ('name',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('blog_post', 'author', 'content', 'pub_date')
    search_fields = ('content',)
    list_filter = ('blog_post', 'author', 'pub_date')
    date_hierarchy = 'pub_date'
    ordering = ('-pub_date',)
