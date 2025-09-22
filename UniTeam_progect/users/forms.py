from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser, StudentProfile, LecturerProfile

class SignUpForm(UserCreationForm):
    ROLE_CHOICES = (('STUDENT', 'Student'), ('LECTURER', 'Lecturer'),)
    role = forms.ChoiceField(choices=ROLE_CHOICES, required=True, widget=forms.HiddenInput())
    
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        # We now need first_name and last_name at sign-up
        fields = ('username', 'first_name', 'last_name', 'email', 'role')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Update styling for new fields
        self.fields['first_name'].widget.attrs.update({'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg', 'placeholder': 'First Name'})
        self.fields['last_name'].widget.attrs.update({'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg', 'placeholder': 'Last Name'})
        # ... (rest of the __init__ method is the same as before) ...
        self.fields['username'].widget.attrs.update({'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg', 'placeholder': 'Choose a username'})
        self.fields['email'].widget.attrs.update({'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg', 'placeholder': 'Enter your university email'})
        self.fields['password1'].widget.attrs.update({'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg', 'placeholder': 'Create a password'})
        self.fields['password2'].widget.attrs.update({'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg', 'placeholder': 'Confirm your password'})
        self.fields['password2'].label = "Confirm Password"


    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = self.cleaned_data['role']
        
        # --- LECTURER APPROVAL LOGIC ---
        if user.role == CustomUser.Role.LECTURER:
            user.is_approved = False # A new lecturer must be approved by an admin
        else:
            user.is_approved = True # Students are approved by default
            
        if commit:
            user.save()
        return user


class LoginForm(forms.Form):
    username = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg',
                'placeholder': 'Enter your email or username',
                'id': 'emailOrUsername', # Match the ID in your HTML
                'required': True
            }
        )
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                'class': 'input-field w-full pl-10 pr-3 py-3 rounded-lg',
                'placeholder': 'Enter your password',
                'id': 'password', # Match the ID in your HTML
                'required': True
            }
        )
    )

class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'avatar']
        
class StudentProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = StudentProfile
        fields = ['university', 'department', 'course_name', 'year_of_study', 'skills', 'bio', 'personal_email']

class LecturerProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = LecturerProfile
        fields = ['department', 'courses_taught', 'office_location', 'research_areas']