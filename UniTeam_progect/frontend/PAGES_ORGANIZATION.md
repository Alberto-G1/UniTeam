# Pages Organization Guide

## Overview
The React frontend pages are now organized by **role and feature**, making it easier to navigate, maintain, and extend functionality. This matches the Django template structure and improves code organization.

---

## Directory Structure

```
frontend/src/pages/
├── auth/                              # Public authentication pages
│   ├── Login.jsx                      # ✅ (imported from parent)
│   ├── Signup.jsx                     # ✅ (imported from parent)
│   └── ForgotPassword.jsx             # ✅ NEW (password recovery)
│
├── student/                           # Student role pages
│   ├── profile/
│   │   ├── StudentProfile.jsx         # ✅ View profile
│   │   └── StudentProfileEdit.jsx     # ✅ Edit profile
│   ├── projects/
│   │   ├── MyProjects.jsx             # ✅ (from parent)
│   │   ├── CreateProject.jsx          # ✅ NEW
│   │   ├── EditProject.jsx            # ✅ NEW
│   │   ├── ProjectDashboard.jsx       # ✅ NEW (view project details)
│   │   ├── ManageTeam.jsx             # ✅ NEW (manage team members)
│   │   └── MilestoneForm.jsx          # ✅ NEW (create/edit milestones)
│   └── invitations/
│       └── Invitations.jsx            # ✅ (from parent)
│
├── lecturer/                          # Lecturer role pages
│   ├── profile/
│   │   ├── LecturerProfile.jsx        # ✅ View profile
│   │   └── LecturerProfileEdit.jsx    # ✅ Edit profile
│   ├── projects/
│   │   ├── MyProjects.jsx             # ✅ NEW (supervised projects)
│   │   ├── CreateProject.jsx          # ✅ NEW
│   │   ├── EditProject.jsx            # ✅ NEW
│   │   ├── ProjectDashboard.jsx       # ✅ NEW (view project)
│   │   ├── ManageTeam.jsx             # ✅ NEW (view team members)
│   │   └── MilestoneForm.jsx          # ✅ NEW (create/edit milestones)
│   └── templates/
│       ├── TemplateList.jsx           # ✅ NEW (list all templates)
│       ├── TemplateForm.jsx           # ✅ NEW (create/edit template)
│       └── TemplateDetails.jsx        # ✅ NEW (view template details)
│
├── admin/                             # Admin role pages
│   ├── profile/
│   │   ├── AdminProfile.jsx           # ✅ View profile
│   │   └── AdminProfileEdit.jsx       # ✅ Edit profile
│   ├── users/
│   │   ├── UserList.jsx               # ✅ NEW (manage all users)
│   │   └── EditUser.jsx               # ✅ NEW (edit user details)
│   └── dashboard/
│       ├── AdminDashboard.jsx         # ✅ (from parent)
│       └── PendingLecturers.jsx       # ✅ NEW (approve lecturers)
│
├── shared/                            # Shared/common pages
│   └── NotFound.jsx                   # ✅ (from parent)
│
├── StudentDashboard.jsx               # ✅ Student home/dashboard
├── LecturerDashboard.jsx              # ✅ Lecturer home/dashboard
├── AdminDashboard.jsx                 # ✅ Admin home/dashboard
├── Login.jsx                          # ✅ Auth login
├── Signup.jsx                         # ✅ Auth signup
├── MyProjects.jsx                     # ✅ Student projects (kept for imports)
├── Invitations.jsx                    # ✅ Student invitations (kept for imports)
└── NotFound.jsx                       # ✅ 404 page (kept for imports)

```

---

## Page-to-Route Mapping

### Auth Routes (Public)
| File | Route | Purpose |
|------|-------|---------|
| `auth/Login.jsx` | `/login` | User login |
| `auth/Signup.jsx` | `/signup` | User registration |
| `auth/ForgotPassword.jsx` | `/forgot-password` | Password recovery |

### Student Routes
| File | Route | Purpose |
|------|-------|---------|
| `student/profile/StudentProfile.jsx` | `/student/profile` | View student profile |
| `student/profile/StudentProfileEdit.jsx` | `/student/profile/edit` | Edit student profile |
| `student/projects/MyProjects.jsx` | `/student/projects` | List student's projects |
| `student/projects/CreateProject.jsx` | `/student/projects/create` | Create new project |
| `student/projects/ProjectDashboard.jsx` | `/student/projects/:id` | View project details |
| `student/projects/EditProject.jsx` | `/student/projects/:id/edit` | Edit project |
| `student/projects/ManageTeam.jsx` | `/student/projects/:id/manage-team` | Manage team members |
| `student/projects/MilestoneForm.jsx` | `/student/projects/:id/milestones/create` | Create milestone |
| `student/projects/MilestoneForm.jsx` | `/student/projects/:id/milestones/:milestoneId/edit` | Edit milestone |
| `student/invitations/Invitations.jsx` | `/student/invitations` | View pending invitations |

### Lecturer Routes
| File | Route | Purpose |
|------|-------|---------|
| `lecturer/profile/LecturerProfile.jsx` | `/lecturer/profile` | View lecturer profile |
| `lecturer/profile/LecturerProfileEdit.jsx` | `/lecturer/profile/edit` | Edit lecturer profile |
| `lecturer/projects/MyProjects.jsx` | `/lecturer/projects` | List supervised projects |
| `lecturer/projects/CreateProject.jsx` | `/lecturer/projects/create` | Create new project |
| `lecturer/projects/ProjectDashboard.jsx` | `/lecturer/projects/:id` | View project |
| `lecturer/projects/EditProject.jsx` | `/lecturer/projects/:id/edit` | Edit project |
| `lecturer/projects/ManageTeam.jsx` | `/lecturer/projects/:id/manage-team` | View team members |
| `lecturer/projects/MilestoneForm.jsx` | `/lecturer/projects/:id/milestones/create` | Create milestone |
| `lecturer/projects/MilestoneForm.jsx` | `/lecturer/projects/:id/milestones/:milestoneId/edit` | Edit milestone |
| `lecturer/templates/TemplateList.jsx` | `/lecturer/templates` | List templates |
| `lecturer/templates/TemplateForm.jsx` | `/lecturer/templates/create` | Create new template |
| `lecturer/templates/TemplateDetails.jsx` | `/lecturer/templates/:id` | View template |
| `lecturer/templates/TemplateForm.jsx` | `/lecturer/templates/:id/edit` | Edit template |

### Admin Routes
| File | Route | Purpose |
|------|-------|---------|
| `admin/profile/AdminProfile.jsx` | `/admin/profile` | View admin profile |
| `admin/profile/AdminProfileEdit.jsx` | `/admin/profile/edit` | Edit admin profile |
| `admin/users/UserList.jsx` | `/admin/users` | List all users |
| `admin/users/EditUser.jsx` | `/admin/users/:id/edit` | Edit user details |
| `admin/dashboard/PendingLecturers.jsx` | `/admin/lecturers/pending` | Approve pending lecturers |

---

## Importing Pages in App.jsx

### Student Example
```jsx
import StudentProfile from './pages/StudentProfile';
import StudentProfileEdit from './pages/StudentProfileEdit';
import CreateProject from './pages/student/projects/CreateProject';
import ProjectDashboard from './pages/student/projects/ProjectDashboard';
```

### Lecturer Example
```jsx
import LecturerProfile from './pages/LecturerProfile';
import TemplateList from './pages/lecturer/templates/TemplateList';
import TemplateForm from './pages/lecturer/templates/TemplateForm';
```

### Admin Example
```jsx
import AdminProfile from './pages/AdminProfile';
import UserList from './pages/admin/users/UserList';
import PendingLecturers from './pages/admin/dashboard/PendingLecturers';
```

---

## Features by Page

### Student Pages

#### MyProjects (`student/projects/MyProjects.jsx`)
- Lists all projects where student is a member
- Filter by status (all, active, completed)
- Click to view project details

#### CreateProject (`student/projects/CreateProject.jsx`)
- Create new project with title & description
- Optional: Select project template to auto-generate milestones
- Assign supervisor (lecturer email)

#### ProjectDashboard (`student/projects/ProjectDashboard.jsx`)
- View project details
- See milestones list with status
- View team members
- If leader: Edit project, manage team buttons

#### ManageTeam (`student/projects/ManageTeam.jsx`)
- View current team members
- Send invitations to other students
- Change member roles (Member, Co-Leader, Leader)
- Remove members (enforce at least 1 leader)
- See pending invitations

#### MilestoneForm (`student/projects/MilestoneForm.jsx`)
- Create/Edit milestone
- Fields: Title, Description, Due Date, Status

### Lecturer Pages

#### MyProjects (`lecturer/projects/MyProjects.jsx`)
- Lists all projects supervisor is overseeing
- Filter by status
- Click to view/manage project

#### TemplateList (`lecturer/templates/TemplateList.jsx`)
- List all templates created by lecturer
- Create new template button
- Edit/Delete actions per template

#### TemplateForm (`lecturer/templates/TemplateForm.jsx`)
- Create or edit a template
- Add multiple milestone templates
- Milestone template fields: Title, Description

#### TemplateDetails (`lecturer/templates/TemplateDetails.jsx`)
- View template with all milestone templates
- Edit/Delete buttons

### Admin Pages

#### UserList (`admin/users/UserList.jsx`)
- Table of all users
- Filter by role (Student, Lecturer, Admin)
- Edit user button

#### EditUser (`admin/users/EditUser.jsx`)
- Edit user details
- Change role
- Activate/Deactivate account

#### PendingLecturers (`admin/dashboard/PendingLecturers.jsx`)
- Table of unapproved lecturers (is_approved = false)
- Approve/Reject buttons
- Refresh list after action

---

## File Naming Conventions

- **Component files**: PascalCase (e.g., `StudentProfile.jsx`, `ManageTeam.jsx`)
- **Export style**: `export const` or `export default` (check existing patterns)
- **Always export**: Each page should export the main component
- **CSS files**: Placed in `frontend/src/styles/` and imported in components

```jsx
// Example import
import '../../../styles/Project.css';  // Styles for all project pages
import '../../../styles/ManageTeam.css'; // Styles for team management
```

---

## Adding New Pages

When adding a new page, follow this pattern:

1. **Create the component** in appropriate folder:
   ```jsx
   // frontend/src/pages/student/projects/NewFeature.jsx
   import { useState, useEffect } from 'react';
   import { Link } from 'react-router-dom';
   import '../../../styles/Project.css';

   export const NewFeature = () => {
     // Component logic
     return (
       <div className="feature-wrapper">
         {/* JSX */}
       </div>
     );
   };

   export default NewFeature;
   ```

2. **Import in App.jsx**:
   ```jsx
   import NewFeature from './pages/student/projects/NewFeature';
   ```

3. **Add route in App.jsx**:
   ```jsx
   <Route path="projects/new-feature" element={<NewFeature />} />
   ```

4. **Add CSS** (if needed):
   ```jsx
   // frontend/src/styles/Project.css (or create new file)
   .new-feature-wrapper { /* styles */ }
   ```

---

## CSS Organization

All page styles are in `frontend/src/styles/`:

| CSS File | Purpose |
|----------|---------|
| `Profile.css` | All profile pages (Student, Lecturer, Admin) |
| `ProfileEdit.css` | All profile edit pages |
| `Project.css` | All project and milestone pages |
| `ManageTeam.css` | Team management pages |
| `ManageUsers.css` | User management (admin) |
| `Templates.css` | Lecturer template pages |
| `Auth.css` | Login, Signup, ForgotPassword |
| `Dashboard.css` | All dashboard pages |
| `Invitations.css` | Student invitations page |

---

## API Endpoints Used

Each page communicates with the Django backend API:

### Student API Endpoints
- `GET /api/projects/` - List student's projects
- `POST /api/projects/create/` - Create project
- `GET /api/projects/:id/` - Get project details
- `PUT /api/projects/:id/` - Update project
- `GET /api/projects/:id/team/` - Get team members
- `POST /api/projects/:id/invite/` - Send invitation
- `GET /api/projects/:id/invitations/pending/` - Get pending invites
- `GET /api/projects/:id/milestones/` - Get milestones

### Lecturer API Endpoints
- `GET /api/projects/supervised/` - Get supervised projects
- `GET /api/projects/templates/` - List templates
- `POST /api/projects/templates/` - Create template
- `GET /api/projects/templates/:id/` - Get template details
- `PUT/DELETE /api/projects/templates/:id/` - Edit/Delete template

### Admin API Endpoints
- `GET /api/admin/users/` - List all users
- `GET /api/admin/users/:id/` - Get user details
- `PUT /api/admin/users/:id/` - Update user
- `GET /api/admin/lecturers/pending/` - Get pending lecturers
- `POST /api/admin/lecturers/:id/approve/` - Approve lecturer
- `POST /api/admin/lecturers/:id/reject/` - Reject lecturer

---

## Migration Checklist

If migrating from Django templates, ensure:

- ✅ All routes defined in App.jsx
- ✅ All components created and exported
- ✅ CSS files imported and organized
- ✅ API calls use `apiService` from `context/AuthContext`
- ✅ Form validation included
- ✅ Error handling implemented
- ✅ Loading states added
- ✅ Mobile responsive design
- ✅ Dark mode support via CSS
- ✅ Accessible components (labels, ARIA, etc.)

---

## Quick Reference

### Creating a Project for Student
1. Go to `/student/projects/create`
2. Fill form: Title, Description, Template (opt), Supervisor
3. Click "Create Project"
4. Redirected to project dashboard

### Creating a Team
1. Student creates project
2. Auto-creates team with creator as leader
3. Use "/manage-team" to send invitations

### Creating a Template (Lecturer)
1. Go to `/lecturer/templates/create`
2. Add template title & description
3. Add milestone templates
4. Click "Create Template"

### Using a Template
Student can select template when creating project, auto-generates milestones

### Approving Lecturers (Admin)
1. Go to `/admin/lecturers/pending`
2. See list of unapproved lecturers
3. Click Approve/Reject
4. List updates automatically

---

## Next Steps

Once this organization is complete:

1. ✅ Test all routes in browser
2. ✅ Verify all imports work
3. ✅ Test API calls
4. ✅ Mobile responsive testing
5. ✅ Dark mode testing
6. ✅ Deploy to staging

