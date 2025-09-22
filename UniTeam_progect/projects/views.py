from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .forms import ProjectCreationForm
from .models import Project, Team, TeamMembership, Invitation
from users.models import CustomUser, StudentProfile
from django.db.models import Case, When, Value, IntegerField
from django.db import models
from .forms import ProjectCreationForm, ProjectTemplateForm, MilestoneTemplateForm, MilestoneForm
from .models import Project, Team, TeamMembership, Invitation, ProjectTemplate, MilestoneTemplate, Milestone
from users.models import CustomUser


@login_required
def create_project_view(request):
    if request.method == 'POST':
        form = ProjectCreationForm(request.POST)
        if form.is_valid():
            project = form.save(commit=False)
            template = form.cleaned_data.get('template')
            if template:
                project.template_used = template
            project.save()
            
            team = Team.objects.create(project=project)
            TeamMembership.objects.create(user=request.user, team=team, role=Team.Role.LEADER)
            
            # If a template was used, create milestones from it
            if template:
                for mt in template.milestone_templates.all():
                    # You may want to calculate due dates more intelligently here
                    Milestone.objects.create(
                        project=project,
                        title=mt.title,
                        description=mt.description,
                        due_date=project.deadline 
                    )
            
            messages.success(request, f"Project '{project.title}' created successfully!")
            return redirect(project.get_absolute_url())
    else:
        form = ProjectCreationForm()
        # Filter templates by course code if one is provided as a query param
        course_code = request.GET.get('course_code')
        if course_code:
            form.fields['template'].queryset = ProjectTemplate.objects.filter(course_code__iexact=course_code)
        
    return render(request, 'projects/create_project.html', {'form': form})


@login_required
def list_project_templates_view(request):
    templates = ProjectTemplate.objects.filter(creator=request.user)
    return render(request, 'projects/template_list.html', {'templates': templates})

@login_required
def create_project_template_view(request):
    if request.method == 'POST':
        form = ProjectTemplateForm(request.POST)
        if form.is_valid():
            template = form.save(commit=False)
            template.creator = request.user
            template.save()
            messages.success(request, 'Project template created.')
            return redirect('project_template_details', template_id=template.id)
    else:
        form = ProjectTemplateForm()
    return render(request, 'projects/template_form.html', {'form': form, 'title': 'Create New Project Template'})

@login_required
def project_template_details_view(request, template_id):
    template = get_object_or_404(ProjectTemplate, pk=template_id, creator=request.user)
    milestone_form = MilestoneTemplateForm()
    return render(request, 'projects/template_details.html', {'template': template, 'milestone_form': milestone_form})

@login_required
def add_milestone_template_view(request, template_id):
    template = get_object_or_404(ProjectTemplate, pk=template_id, creator=request.user)
    if request.method == 'POST':
        form = MilestoneTemplateForm(request.POST)
        if form.is_valid():
            milestone = form.save(commit=False)
            milestone.project_template = template
            milestone.save()
            messages.success(request, 'Milestone added to template.')
    return redirect('project_template_details', template_id=template.id)


@login_required
def manage_team_view(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    # Security: must be a leader
    if not project.team.teammembership_set.filter(Q(user=request.user, role=Team.Role.LEADER) | Q(user=request.user, role=Team.Role.CO_LEADER)).exists():
        messages.error(request, "You don't have permission to manage this team.")
        return redirect(project.get_absolute_url())

    memberships = project.team.teammembership_set.all()
    return render(request, 'projects/manage_team.html', {'project': project, 'memberships': memberships})

@login_required
def update_member_role_view(request, membership_id):
    membership = get_object_or_404(TeamMembership, pk=membership_id)
    project = membership.team.project
    
    # Security: must be a leader of this project
    if not project.team.teammembership_set.filter(user=request.user, role=Team.Role.LEADER).exists():
        messages.error(request, "Only the main Group Leader can change roles.")
        return redirect('manage_team', project_id=project.id)

    if request.method == 'POST':
        new_role = request.POST.get('role')
        if new_role in [Team.Role.CO_LEADER, Team.Role.MEMBER]:
            # Prevent demoting the only leader
            if membership.role == Team.Role.LEADER and project.team.teammembership_set.filter(role=Team.Role.LEADER).count() == 1:
                messages.error(request, "You cannot demote the only Group Leader.")
            else:
                membership.role = new_role
                membership.save()
                messages.success(request, f"{membership.user.username}'s role has been updated.")
    return redirect('manage_team', project_id=project.id)


@login_required
def project_dashboard_view(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    
    # Security Check
    user_membership = project.team.teammembership_set.filter(user=request.user).first()
    is_supervisor = project.supervisor == request.user

    if not (user_membership or is_supervisor):
        messages.error(request, "You do not have permission to view this project.")
        return redirect('student_dashboard') # Or wherever your main dashboard is

    # Determine user's role in this specific project
    user_role_in_project = None
    template_name = '' # Initialize template name

    if is_supervisor:
        user_role_in_project = "SUPERVISOR"
        template_name = 'projects/project_dashboard_supervisor.html'
    elif user_membership:
        if user_membership.role == Team.Role.LEADER:
            user_role_in_project = Team.Role.LEADER
            template_name = 'projects/project_dashboard_leader.html'
        else:
            user_role_in_project = Team.Role.MEMBER
            template_name = 'projects/project_dashboard_student.html'
    
    # If for some reason a role couldn't be determined, redirect
    if not template_name:
        messages.error(request, "Could not determine your role for this project.")
        return redirect('student_dashboard')

    context = {
        'project': project,
        'team_memberships': project.team.teammembership_set.all(),
        'user_role_in_project': user_role_in_project,
        # A simple boolean for quick checks in the template
        'is_leader': user_role_in_project == Team.Role.LEADER,
    }
    # Render the dynamically chosen template
    return render(request, template_name, context)

@login_required
def invite_member_view(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    
    # Security Check: Allow Leaders and Co-Leaders to invite
    is_leader_or_coleader = project.team.teammembership_set.filter(
        user=request.user, 
        role__in=[Team.Role.LEADER, Team.Role.CO_LEADER]
    ).exists()

    if not is_leader_or_coleader:
        messages.error(request, "Only Group Leaders or Co-Leaders can invite members.")
        return redirect(project.get_absolute_url())

    if request.method == 'POST':
        receiver_id = request.POST.get('receiver_id')
        receiver = get_object_or_404(CustomUser, id=receiver_id)
        
        if project.team.members.filter(id=receiver.id).exists():
            messages.warning(request, f"'{receiver.username}' is already in the team.")
        elif Invitation.objects.filter(project=project, receiver=receiver, status=Invitation.Status.PENDING).exists():
            messages.warning(request, f"You have already sent a pending invitation to '{receiver.username}'.")
        else:
            Invitation.objects.create(project=project, sender=request.user, receiver=receiver)
            messages.success(request, f"Invitation sent to '{receiver.username}'.")
        # Redirect back to the same invite page to see the updated status or search again
        return redirect('invite_member', project_id=project.id)

    # --- Search logic for GET request ---
    query = request.GET.get('q', '')
    course_filter = request.GET.get('course', '')
    skills_filter = request.GET.get('skills', '')

    excluded_user_ids = list(project.team.members.values_list('id', flat=True))
    search_results = CustomUser.objects.filter(role=CustomUser.Role.STUDENT).exclude(id__in=excluded_user_ids)

    if query:
        search_results = search_results.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )
    if course_filter:
        search_results = search_results.filter(studentprofile__course_name__icontains=course_filter)
    if skills_filter:
        search_results = search_results.filter(studentprofile__skills__name__in=[skill.strip() for skill in skills_filter.split(',')])

    search_results = search_results.distinct()

    # --- THIS WAS THE MISSING PART ---
    context = {
        'project': project,
        'search_results': search_results,
    }
    return render(request, 'projects/invite_member.html', context)


@login_required
def view_invitations_view(request):
    invitations = Invitation.objects.filter(receiver=request.user, status=Invitation.Status.PENDING)
    return render(request, 'projects/view_invitations.html', {'invitations': invitations})


@login_required
def respond_to_invitation_view(request, invitation_id, response):
    invitation = get_object_or_404(Invitation, id=invitation_id, receiver=request.user)
    
    if response == 'accept':
        invitation.status = Invitation.Status.ACCEPTED
        # Add user to the team
        TeamMembership.objects.create(
            user=request.user,
            team=invitation.project.team,
            role=Team.Role.MEMBER
        )
        messages.success(request, f"You have joined the project: '{invitation.project.title}'")
    elif response == 'decline':
        invitation.status = Invitation.Status.DECLINED
        messages.info(request, f"You have declined the invitation for '{invitation.project.title}'.")
        
    invitation.save()
    return redirect('view_invitations')


# --- NEW PROJECT MANAGEMENT VIEWS ---

@login_required
def my_projects_view(request):
    """
    Displays all projects the user is associated with, either as a
    team member or as a supervisor.
    """
    # Determine which template to use based on the user's primary role
    if request.user.role == CustomUser.Role.LECTURER:
        template_name = 'projects/my_projects_lecturer.html'
    else: # Default to student
        template_name = 'projects/my_projects_student.html'

    # Get projects where the user is a team member
    member_of_projects = Project.objects.filter(team__members=request.user)
    
    # Get projects where the user is the supervisor
    supervised_projects = Project.objects.filter(supervisor=request.user)
    
    all_projects_qs = (member_of_projects | supervised_projects).distinct().order_by('-created_at')
    
    projects_with_roles = all_projects_qs.annotate(
        user_role_in_project=Case(
            When(supervisor=request.user, then=Value('Supervisor')),
            When(team__teammembership__user=request.user, team__teammembership__role='LEADER', then=Value('Group Leader')),
            When(team__teammembership__user=request.user, team__teammembership__role='CO_LEADER', then=Value('Co-Leader')),
            When(team__teammembership__user=request.user, team__teammembership__role='MEMBER', then=Value('Member')),
            default=Value(''),
            output_field=models.CharField(),
        )
    )

    context = {
        'projects': projects_with_roles,
    }
    return render(request, template_name, context)



@login_required
def edit_project_view(request, project_id):
    """
    Allows a Group Leader to edit the details of their project.
    """
    project = get_object_or_404(Project, pk=project_id)
    
    # --- SECURITY CHECK: User must be a Group Leader of this project ---
    is_leader = project.team.teammembership_set.filter(user=request.user, role=Team.Role.LEADER).exists()
    if not is_leader:
        messages.error(request, "You do not have permission to edit this project.")
        return redirect('my_projects')
        
    if request.method == 'POST':
        form = ProjectCreationForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            messages.success(request, f"Project '{project.title}' has been updated successfully.")
            return redirect('project_dashboard', project_id=project.id)
    else:
        form = ProjectCreationForm(instance=project)
        
    context = {
        'form': form,
        'project': project
    }
    return render(request, 'projects/edit_project.html', context)

@login_required
def edit_project_template_view(request, template_id):
    template = get_object_or_404(ProjectTemplate, pk=template_id, creator=request.user)
    if request.method == 'POST':
        form = ProjectTemplateForm(request.POST, instance=template)
        if form.is_valid():
            form.save()
            messages.success(request, 'Template details updated.')
            return redirect('project_template_details', template_id=template.id)
    else:
        form = ProjectTemplateForm(instance=template)
    return render(request, 'projects/template_form.html', {'form': form, 'title': 'Edit Project Template'})


@login_required
def delete_project_view(request, project_id):
    """
    Allows a Group Leader to delete their project.
    This view only accepts POST requests for security.
    """
    project = get_object_or_404(Project, pk=project_id)
    
    # --- SECURITY CHECK: User must be a Group Leader of this project ---
    is_leader = project.team.teammembership_set.filter(user=request.user, role=Team.Role.LEADER).exists()
    if not is_leader:
        messages.error(request, "You do not have permission to delete this project.")
        return redirect('my_projects')

    if request.method == 'POST':
        project_title = project.title
        project.delete()
        messages.success(request, f"Project '{project_title}' and all its data have been permanently deleted.")
        return redirect('my_projects')
    else:
        # If accessed via GET, just redirect away.
        return redirect('project_dashboard', project_id=project.id)

@login_required
def add_milestone_view(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    # Security: Only leaders/co-leaders can add milestones
    if not project.team.teammembership_set.filter(user=request.user,
                                                  role__in=[Team.Role.LEADER, Team.Role.CO_LEADER]).exists():
        messages.error(request, "You do not have permission to add milestones.")
        return redirect(project.get_absolute_url())

    if request.method == 'POST':
        form = MilestoneForm(request.POST, project=project)
        if form.is_valid():
            milestone = form.save(commit=False)
            milestone.project = project
            milestone.save()
            form.save_m2m()  # Important for saving ManyToMany fields
            messages.success(request, f"Milestone '{milestone.title}' added successfully.")
            return redirect(project.get_absolute_url())
    else:
        form = MilestoneForm(project=project)

    return render(request, 'projects/milestone_form.html',
                  {'form': form, 'project': project, 'title': 'Add New Milestone'})


@login_required
def update_milestone_status_view(request, milestone_id):
    milestone = get_object_or_404(Milestone, pk=milestone_id)
    project = milestone.project
    
    # Security Check: User must be assigned to this milestone to update its status
    if not milestone.assigned_to.filter(id=request.user.id).exists():
        messages.error(request, "You can only update the status of milestones assigned to you.")
        return redirect(project.get_absolute_url())

    if request.method == 'POST':
        new_status = request.POST.get('status')
        # Ensure the new status is a valid choice
        if new_status in Milestone.Status.values:
            milestone.status = new_status
            milestone.save()
            messages.success(request, f"Status for '{milestone.title}' updated to '{milestone.get_status_display()}'.")
    
    return redirect(project.get_absolute_url())

@login_required
def edit_milestone_view(request, milestone_id):
    milestone = get_object_or_404(Milestone, pk=milestone_id)
    project = milestone.project
    # Security: NOW STRICTLY for leaders/co-leaders
    is_leader_or_coleader = project.team.teammembership_set.filter(
        user=request.user, role__in=[Team.Role.LEADER, Team.Role.CO_LEADER]
    ).exists()
    if not is_leader_or_coleader:
        messages.error(request, "Only Group Leaders or Co-Leaders can edit milestone details.")
        return redirect(project.get_absolute_url())
    # ... (the rest of the view is the same)
    if request.method == 'POST':
        form = MilestoneForm(request.POST, instance=milestone, project=project)
        if form.is_valid():
            form.save()
            messages.success(request, f"Milestone '{milestone.title}' updated successfully.")
            return redirect(project.get_absolute_url())
    else:
        form = MilestoneForm(instance=milestone, project=project)
    return render(request, 'projects/milestone_form.html', {'form': form, 'project': project, 'title': 'Edit Milestone'})

@login_required
def delete_milestone_view(request, milestone_id):
    milestone = get_object_or_404(Milestone, pk=milestone_id)
    project = milestone.project
    # Security: NOW STRICTLY for leaders/co-leaders
    is_leader_or_coleader = project.team.teammembership_set.filter(
        user=request.user, role__in=[Team.Role.LEADER, Team.Role.CO_LEADER]
    ).exists()
    if not is_leader_or_coleader:
        messages.error(request, "Only Group Leaders or Co-Leaders can delete milestones.")
        return redirect(project.get_absolute_url())
    # ... (the rest of the view is the same)
    if request.method == 'POST':
        milestone_title = milestone.title
        milestone.delete()
        messages.success(request, f"Milestone '{milestone_title}' has been deleted.")
    return redirect(project.get_absolute_url())
