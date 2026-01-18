# UniTeam Project - AI Coding Agent Instructions

## Project Overview
UniTeam is a Django 5.2 project management platform for university team collaboration, connecting students, lecturers, and administrators. Students form project teams, lecturers supervise and create reusable project templates, and admins manage users.

## Architecture & Core Components

### Three-Role System
All functionality branches from `CustomUser.role` (STUDENT/LECTURER/ADMIN) defined in [users/models.py](users/models.py):
- **Students**: Join teams, manage projects they lead/co-lead, receive invitations
- **Lecturers**: Create project templates with milestone blueprints, supervise projects, require admin approval (`is_approved` field)
- **Admins**: Manage all users, approve lecturer accounts

### Profile Model Pattern
Each user role has a OneToOne profile model with role-specific fields:
- `StudentProfile`: skills (TaggableManager), year_of_study, bio
- `LecturerProfile`: courses_taught, research_areas (both TaggableManager with custom through models)
- `AdminProfile`: role_title, responsibilities

Profiles auto-create via `post_save` signal in [users/signals.py](users/signals.py). Always use `.studentprofile`, `.lecturerprofile`, or `.adminprofile` to access profile data.

### Project Template System (Lecturer Feature)
Lecturers create reusable `ProjectTemplate` objects with:
- `MilestoneTemplate` children (ordered by `order` field)
- When students create a `Project` from a template, milestones auto-generate from the template's milestone_templates

Key models: [projects/models.py](projects/models.py) - `ProjectTemplate`, `MilestoneTemplate`, `Project`, `Team`, `TeamMembership`, `Milestone`, `Invitation`

### Team Membership Hierarchy
- `Team` is OneToOne with `Project`
- `TeamMembership` links users to teams with roles: LEADER, CO_LEADER, MEMBER
- Leaders/co-leaders can manage team, edit milestones, send invitations
- View permissions check role in `TeamMembership` queryset

### Authentication Backend
Custom [users/backends.py](users/backends.py) `EmailOrUsernameModelBackend` allows login with username OR email. Blocks unapproved lecturers at authentication level.

## Developer Workflows

### Running the Server
```bash
python manage.py runserver
```
Access at `http://127.0.0.1:8000/` (redirects to login)

### Database Migrations
After model changes:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Test Users
Use Django admin (`/admin/`) or shell:
```bash
python manage.py createsuperuser
python manage.py shell
>>> from users.models import CustomUser
>>> user = CustomUser.objects.create_user(username='student1', email='s1@uni.edu', password='pass123', role='STUDENT')
```

## Project-Specific Conventions

### Template Inheritance Pattern
All templates extend role-specific base templates:
- Student views: `{% extends "base/base_student.html" %}`
- Lecturer views: `{% extends "base/base_lecturer.html" %}`
- Admin views: `{% extends "base/base_admin.html" %}`

Base templates in [templates/base/](templates/base/) include role-specific navigation, CSS ([static/css/](static/css/)), and JS ([static/js/](static/js/)).

### View Protection Decorators
Always use role checkers from [users/views.py](users/views.py):
```python
@login_required
@user_passes_test(is_student)
def student_only_view(request):
    ...
```
Available checkers: `is_student`, `is_lecturer`, `is_admin`

### Form Patterns
- Forms in [users/forms.py](users/forms.py) and [projects/forms.py](projects/forms.py)
- `SignUpForm` handles profile creation via signal
- `ProjectCreationForm` accepts optional `template` to auto-generate milestones
- Use `commit=False` for forms requiring additional field assignment before save

### URL Structure
- Root (`/`) → redirects to login
- `/accounts/` → users app (auth, profiles, dashboards)
- `/projects/` → projects app (CRUD, teams, milestones, templates)
- `/media/` → user avatars (configured in settings.py)

### Message Framework
Use Django messages for user feedback:
```python
messages.success(request, "Project created!")
messages.error(request, "Cannot delete last leader")
```

## Key Integration Points

### TaggableManager (django-taggit)
Students' skills and lecturers' courses/research areas use TaggableManager. Requires custom `through` models for multiple taggable fields on same model:
```python
courses_taught = TaggableManager(through=CourseTag, related_name="course_lecturers")
research_areas = TaggableManager(through=ResearchAreaTag, related_name="research_lecturers")
```

### Static Files
Development setup uses `STATICFILES_DIRS` pointing to [static/](static/). All CSS/JS organized by role (admin_base.css, student_base.css, etc.).

### Media Files
User avatars stored in `media/avatars/`. Configure `MEDIA_URL` and `MEDIA_ROOT` in settings, serve via URL pattern in production.

## Common Patterns

### Checking Team Role
```python
membership = TeamMembership.objects.filter(team=team, user=request.user).first()
if membership and membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]:
    # Allow action
```

### Filtering by User Role
```python
# Get all supervised projects for a lecturer
supervised_projects = Project.objects.filter(supervisor=request.user)

# Get projects where user is a member
user_teams = request.user.teammembership_set.all()
projects = [tm.team.project for tm in user_teams]
```

### Template Context for Role-Based UI
Pass membership role to templates:
```python
context = {
    'project': project,
    'is_leader': membership.role == Team.Role.LEADER,
    'is_leader_or_coleader': membership.role in [Team.Role.LEADER, Team.Role.CO_LEADER]
}
```

## Critical Notes
- **Never bypass lecturer approval**: Authentication backend handles this, don't create manual checks
- **Invitations are unique per (project, receiver)**: Database constraint prevents duplicate invites
- **Milestone status field**: Use TextChoices (PENDING/IN_PROGRESS/COMPLETED/OVERDUE), consider auto-updating based on due_date
- **Team must have at least one leader**: Enforce in views before role changes/deletions
- **Settings.py SECRET_KEY**: Currently exposed (insecure), use environment variables in production
