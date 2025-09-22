# python manage.py makemigrations users --empty --name create_superuser

from django.db import migrations
import os

def create_superuser(apps, schema_editor):
    """Creates a superuser for the application."""
    CustomUser = apps.get_model('users', 'CustomUser')
    
    # Use an environment variable for the password for security.
    # Provide a default for local development.
    password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    
    # Check if the user already exists to avoid errors on subsequent migrations
    if not CustomUser.objects.filter(username='Administrator').exists():
        CustomUser.objects.create_superuser(
            username='Administrator',
            email='admin@uniteam.com',
            password=password,
            role='ADMIN'  # Set our custom role field
        )
        print("\nDefault superuser 'Administrator' created.")
    else:
        print("\nSuperuser 'Administrator' already exists. Skipping creation.")


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_superuser),
    ]