from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from .forms import SignUpForm, LoginForm
from .models import CustomUser
from .forms import SignUpForm, LoginForm, UserUpdateForm, StudentProfileUpdateForm, LecturerProfileUpdateForm
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password

# --- Role Checkers ---
# These functions are used by the @user_passes_test decorator to protect views
def is_student(user):
    return user.is_authenticated and user.role == CustomUser.Role.STUDENT

def is_lecturer(user):
    return user.is_authenticated and user.role == CustomUser.Role.LECTURER

def is_admin(user):
    return user.is_authenticated and user.role == CustomUser.Role.ADMIN

# --- Authentication Views ---

def signup_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard_redirect') # Redirect logged-in users

    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Account created successfully! Welcome, {user.username}.")
            return redirect('dashboard_redirect')
        else:
            # Add error messages to be displayed in the template
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field.capitalize()}: {error}")
    else:
        form = SignUpForm()
    
    return render(request, 'auth/signup.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard_redirect') # Redirect logged-in users

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            
            # We need to check if the user is trying to log in with an email
            user = authenticate(request, username=username, password=password)
            if user is None:
                # Try authenticating with email
                try:
                    user_by_email = CustomUser.objects.get(email=username)
                    user = authenticate(request, username=user_by_email.username, password=password)
                except CustomUser.DoesNotExist:
                    user = None

            if user is not None:
                login(request, user)
                return redirect('dashboard_redirect')
            else:
                messages.error(request, 'Invalid username or password.')
    else:
        form = LoginForm()
        
    return render(request, 'auth/login.html', {'form': form})

@login_required
def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out successfully.")
    return redirect('login')

# --- Dashboard Views & Redirector ---

@login_required
def dashboard_redirect_view(request):
    """Redirects user to their appropriate dashboard based on their role."""
    if request.user.role == CustomUser.Role.ADMIN:
        return redirect('admin_dashboard')
    elif request.user.role == CustomUser.Role.LECTURER:
        return redirect('lecturer_dashboard')
    else: # Default to student
        return redirect('student_dashboard')

@login_required
@user_passes_test(is_student)
def student_dashboard(request):
    return render(request, 'base/base_student.html')

@login_required
@user_passes_test(is_lecturer)
def lecturer_dashboard(request):
    return render(request, 'base/base_lecturer.html')


@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    return render(request, 'users/admin_dashboard.html')


@login_required
@user_passes_test(is_lecturer)
def lecturer_dashboard(request):
    # This now renders the dashboard CONTENT template, which extends the base.
    return render(request, 'users/lecturer_dashboard.html')

# --- Profile Views ---
@login_required
def profile_details_view(request):
    """Displays the user's profile information."""
    # Determine the correct template based on user role
    if request.user.role == CustomUser.Role.STUDENT:
        template_name = 'users/profile_details_student.html'
    elif request.user.role == CustomUser.Role.LECTURER:
        template_name = 'users/profile_details_lecturer.html'
    elif request.user.role == CustomUser.Role.ADMIN:
        template_name = 'users/profile_details_admin.html'
    else:
        return redirect('dashboard_redirect')
        
    return render(request, template_name, {'user': request.user})

# --- RENAMED: Profile Edit View ---
@login_required
def profile_edit_view(request): # <-- Renamed from profile_view
    """Handles the form for editing a user's profile."""
    # This logic is mostly the same, just rendering to the edit templates
    if request.user.role == CustomUser.Role.STUDENT:
        template_name = 'users/profile_edit_student.html'
        ProfileForm = StudentProfileUpdateForm
        profile_instance = request.user.studentprofile
    # ... (the rest of the logic from the old profile_view remains the same) ...
    elif request.user.role == CustomUser.Role.LECTURER:
        template_name = 'users/profile_edit_lecturer.html'
        ProfileForm = LecturerProfileUpdateForm
        profile_instance = request.user.lecturerprofile
    elif request.user.role == CustomUser.Role.ADMIN:
        template_name = 'users/profile_edit_admin.html'
        ProfileForm = None
        profile_instance = None # Add this for clarity
    else:
        return redirect('dashboard_redirect')
        
    if request.method == 'POST':
        user_form = UserUpdateForm(request.POST, request.FILES, instance=request.user)
        profile_form = ProfileForm(request.POST, instance=profile_instance) if ProfileForm else None
        
        if user_form.is_valid() and (profile_form is None or profile_form.is_valid()):
            user_form.save()
            if profile_form:
                profile_form.save()
            messages.success(request, 'Your profile has been updated successfully!')
            return redirect('profile_details') # <-- Redirect back to the details page
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        user_form = UserUpdateForm(instance=request.user)
        profile_form = ProfileForm(instance=profile_instance) if ProfileForm else None

    context = {
        'user_form': user_form,
        'profile_form': profile_form
    }
    return render(request, template_name, context)

@login_required
@user_passes_test(is_admin)
def admin_user_list(request):
    """Displays a list of all users for the admin."""
    # We exclude the current admin from the list to prevent self-deletion
    users = CustomUser.objects.all().exclude(id=request.user.id).order_by('role', 'date_joined')
    context = {
        'users': users
    }
    return render(request, 'users/admin_user_list.html', context)


@login_required
@user_passes_test(is_admin)
def admin_toggle_approval(request, user_id):
    """Approves or un-approves a lecturer."""
    user_to_toggle = get_object_or_404(CustomUser, id=user_id)
    if user_to_toggle.role == CustomUser.Role.LECTURER:
        user_to_toggle.is_approved = not user_to_toggle.is_approved
        user_to_toggle.save()
        status = "approved" if user_to_toggle.is_approved else "un-approved"
        messages.success(request, f"Lecturer '{user_to_toggle.username}' has been {status}.")
    else:
        messages.error(request, "This action is only applicable to lecturers.")
    return redirect('admin_user_list')


@login_required
@user_passes_test(is_admin)
def admin_edit_user(request, user_id):
    """Allows admin to edit a user's details."""
    user_to_edit = get_object_or_404(CustomUser, id=user_id)
    if request.method == 'POST':
        # Simple form processing from POST data
        user_to_edit.username = request.POST.get('username')
        user_to_edit.email = request.POST.get('email')
        user_to_edit.first_name = request.POST.get('first_name')
        user_to_edit.last_name = request.POST.get('last_name')
        user_to_edit.role = request.POST.get('role')

        # Handle password change if a new password is provided
        new_password = request.POST.get('new_password')
        if new_password:
            user_to_edit.password = make_password(new_password)
        
        user_to_edit.save()
        messages.success(request, f"User '{user_to_edit.username}' updated successfully.")
        return redirect('admin_user_list')

    context = {
        'user_to_edit': user_to_edit,
        'roles': CustomUser.Role.choices # Pass roles for the dropdown
    }
    return render(request, 'users/admin_edit_user.html', context)


@login_required
@user_passes_test(is_admin)
def admin_delete_user(request, user_id):
    """Deletes a user. Handled via POST for security."""
    if request.method == 'POST':
        user_to_delete = get_object_or_404(CustomUser, id=user_id)
        username = user_to_delete.username
        user_to_delete.delete()
        messages.success(request, f"User '{username}' has been deleted.")
    return redirect('admin_user_list')