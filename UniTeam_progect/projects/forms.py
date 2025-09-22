from django import forms
from .models import Project
from users.models import CustomUser
from .models import Project, ProjectTemplate, MilestoneTemplate, Milestone

class ProjectTemplateForm(forms.ModelForm):
    class Meta:
        model = ProjectTemplate
        fields = ['title', 'course_code', 'description']
        # --- THIS IS THE NEW PART ---
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'input-field w-full',
                'placeholder': 'e.g., Final Year Project Structure'
            }),
            'course_code': forms.TextInput(attrs={
                'class': 'input-field w-full',
                'placeholder': 'e.g., SOFTENG 350'
            }),
            'description': forms.Textarea(attrs={
                'class': 'input-field w-full',
                'rows': 4,
                'placeholder': 'A brief description of what this template is for...'
            }),
        }

class MilestoneTemplateForm(forms.ModelForm):
    class Meta:
        model = MilestoneTemplate
        fields = ['title', 'description', 'order']
        # You can add similar widgets here if needed
        widgets = {
            'title': forms.TextInput(attrs={'class': 'input-field w-full'}),
            'description': forms.Textarea(attrs={'class': 'input-field w-full', 'rows': 2}),
            'order': forms.NumberInput(attrs={'class': 'input-field w-full'}),
        }

class ProjectCreationForm(forms.ModelForm):

    template = forms.ModelChoiceField(
    queryset=ProjectTemplate.objects.all(),
    required=False,
    label="Use Project Template (Optional)",
    empty_label="Start with a blank project"
    )
    class Meta:
        model = Project
        fields = ['title', 'description', 'course_code', 'deadline', 'supervisor','template']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'input-field'}),
            'description': forms.Textarea(attrs={'class': 'input-field', 'rows': 4}),
            'course_code': forms.TextInput(attrs={'class': 'input-field'}),
            'deadline': forms.DateInput(attrs={'class': 'input-field', 'type': 'date'}),
            'supervisor': forms.Select(attrs={'class': 'input-field'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filter the supervisor dropdown to only show lecturers
        self.fields['supervisor'].queryset = CustomUser.objects.filter(role=CustomUser.Role.LECTURER)
        self.fields['supervisor'].label_from_instance = lambda obj: obj.get_full_name()
        self.fields['supervisor'].empty_label = "No supervisor (self-managed)"

# --- NEW FORM for project milestones ---
class MilestoneForm(forms.ModelForm):
    class Meta:
        model = Milestone
        fields = ['title', 'description', 'due_date', 'status', 'assigned_to']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'input-field w-full'}),
            'description': forms.Textarea(attrs={'class': 'input-field w-full', 'rows': 4}),
            'due_date': forms.DateInput(attrs={'class': 'input-field w-full', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'input-field w-full'}),
            'assigned_to': forms.SelectMultiple(attrs={'class': 'input-field w-full', 'size': 5}),
        }

    def __init__(self, *args, **kwargs):
        # We need to pass the project object to the form to filter the queryset
        project = kwargs.pop('project', None)
        super().__init__(*args, **kwargs)

        if project:
            # The 'assigned_to' dropdown should only show members of this project's team
            self.fields['assigned_to'].queryset = project.team.members.all()
            self.fields['assigned_to'].label_from_instance = lambda obj: obj.get_full_name()