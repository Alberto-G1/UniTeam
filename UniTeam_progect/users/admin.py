from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    StudentProfile,
    LecturerProfile,
    AdminProfile,
    ContactTicket,
    PublicAnnouncement,
)

# Action to approve selected lecturers
@admin.action(description='Approve selected lecturers')
def make_approved(modeladmin, request, queryset):
    queryset.update(is_approved=True)

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_approved', 'is_staff']
    list_filter = ('role', 'is_approved', 'is_staff', 'is_superuser', 'groups')
    actions = [make_approved] # Add the custom action
    
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'avatar', 'is_approved')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'avatar', 'is_approved')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)

# Register profile models to be editable in the admin
admin.site.register(StudentProfile)
admin.site.register(LecturerProfile)
admin.site.register(AdminProfile)


@admin.register(ContactTicket)
class ContactTicketAdmin(admin.ModelAdmin):
    list_display = ('reference', 'name', 'email', 'inquiry_type', 'status', 'created_at')
    list_filter = ('inquiry_type', 'status', 'created_at')
    search_fields = ('reference', 'name', 'email', 'subject', 'message')
    readonly_fields = ('reference', 'created_at', 'updated_at')


@admin.register(PublicAnnouncement)
class PublicAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_published', 'published_at', 'created_by')
    list_filter = ('is_published', 'published_at', 'created_at')
    search_fields = ('title', 'slug', 'excerpt', 'content')
    prepopulated_fields = {'slug': ('title',)}