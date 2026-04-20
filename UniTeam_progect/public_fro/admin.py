from django.contrib import admin

from .models import PublicPage, PublicPageSection


class PublicPageSectionInline(admin.TabularInline):
    model = PublicPageSection
    extra = 1
    fields = ('title', 'body', 'order', 'is_visible')


@admin.register(PublicPage)
class PublicPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_published', 'updated_at', 'updated_by')
    list_filter = ('is_published', 'updated_at')
    search_fields = ('title', 'slug', 'meta_title', 'meta_description', 'hero_title', 'body')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at')
    inlines = [PublicPageSectionInline]
