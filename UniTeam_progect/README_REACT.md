# UniTeam - Modern React Frontend

## Project Structure

This project has been upgraded to use a **modern React + Vite frontend** with a **Django REST API backend**.

```
UniTeam_progect/
├── backend (Django)
│   ├── users/           # User management, authentication API
│   ├── projects/        # Projects, teams, milestones API
│   └── uniteam_project/ # Django settings
│
└── frontend (React + Vite)
    ├── src/
    │   ├── components/   # Reusable components (ProtectedRoute, etc.)
    │   ├── context/      # React Context (AuthContext)
    │   ├── layouts/      # Role-based layouts (Student, Lecturer, Admin)
    │   ├── pages/        # Page components (Login, Dashboards, etc.)
    │   └── services/     # API service layer (axios)
    └── package.json
```

## Quick Start

### 1. Start Backend (Django API)

```bash
# Navigate to project root
cd "c:\Users\user\Desktop\CSC YEAR 3\SEM 1\USER INTERFACE DESIGN\PROJECT\UniTeam\UNITEAM\UniTeam_progect"

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

Backend API runs at: `http://localhost:8000`

### 2. Start Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Start Vite dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Architecture Overview

### Backend (Django REST API)

- **Authentication**: JWT-based (access + refresh tokens)
- **Custom Authentication Backend**: Supports username OR email login
- **Role-Based Access Control**: Student, Lecturer, Admin
- **API Endpoints**:
  - `/api/auth/` - Authentication (login, register, token refresh)
  - `/api/projects/` - Project management
  - `/api/milestones/` - Milestone management
  - `/api/invitations/` - Team invitations
  - `/api/team-memberships/` - Team member management
  - `/api/project-templates/` - Project templates (lecturers)

### Frontend (React + Vite)

- **Build Tool**: Vite with SWC (super fast)
- **Router**: React Router v6 with role-based routing
- **State Management**: React Context API for auth
- **API Client**: Axios with interceptors for JWT refresh
- **Styling**: Modern CSS with custom properties

#### Key Features

1. **JWT Authentication**
   - Automatic token refresh
   - Secure token storage (localStorage)
   - Protected routes

2. **Role-Based UI**
   - Separate layouts for Student, Lecturer, Admin
   - Role-specific navigation menus
   - Conditional rendering based on user role

3. **Modern UX**
   - Responsive design
   - Loading states
   - Error handling
   - Clean, professional UI

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/register/`
Register a new user.

```json
{
  "username": "john_doe",
  "email": "john@university.edu",
  "password": "secure_password",
  "password2": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "role": "STUDENT",
  "phone_number": "+1234567890"
}
```

#### POST `/api/auth/login/`
Login with username or email.

```json
{
  "username": "john_doe",  // or email
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@university.edu",
    "role": "STUDENT",
    ...
  }
}
```

#### GET `/api/auth/me/`
Get current authenticated user (requires Bearer token).

### Project Endpoints

#### GET `/api/projects/`
List all projects accessible to current user.

#### POST `/api/projects/`
Create a new project (students only).

```json
{
  "title": "My Project",
  "description": "Project description",
  "course_code": "CS101",
  "deadline": "2026-12-31",
  "supervisor_id": 5,  // lecturer ID
  "template_used": 1   // optional template ID
}
```

## Development Guidelines

### Adding New Pages

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Use appropriate layout (Student/Lecturer/Admin)
4. Wrap with `<ProtectedRoute>` if authentication required

### Making API Calls

Use the API service layer:

```javascript
import { projectsAPI } from '../services/api';

// In your component
const fetchProjects = async () => {
  try {
    const projects = await projectsAPI.list();
    setProjects(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
};
```

### Role-Based Rendering

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isStudent, isLecturer, isAdmin } = useAuth();
  
  if (isStudent) {
    return <StudentView />;
  }
  
  if (isLecturer) {
    return <LecturerView />;
  }
  
  return <AdminView />;
}
```

## Next Steps

### Core Features to Implement

1. **Projects Module** (frontend/src/pages/)
   - ProjectsList.jsx
   - ProjectDetails.jsx
   - CreateProject.jsx
   - EditProject.jsx

2. **Team Management** (frontend/src/pages/)
   - TeamView.jsx
   - InviteMembers.jsx
   - ManageRoles.jsx

3. **Milestones** (frontend/src/pages/)
   - MilestonesList.jsx
   - CreateMilestone.jsx
   - EditMilestone.jsx

4. **Invitations** (frontend/src/pages/)
   - InvitationsList.jsx
   - ViewInvitation.jsx

5. **Templates** (Lecturer feature)
   - TemplatesList.jsx
   - CreateTemplate.jsx
   - TemplateDetails.jsx

6. **User Management** (Admin feature)
   - UsersList.jsx
   - EditUser.jsx
   - PendingLecturers.jsx

## Technology Stack

### Backend
- Django 5.2
- Django REST Framework 3.16
- djangorestframework-simplejwt 5.5
- django-cors-headers 4.9
- django-taggit (for skills/tags)

### Frontend
- React 18+
- Vite 7.3
- React Router 6
- Axios
- Modern CSS

## Security Notes

- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- CORS configured for local development (update for production)
- Django SECRET_KEY should be moved to environment variable
- Lecturer accounts require admin approval
- Role-based access control on both frontend and backend

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure:
1. Django server is running on port 8000
2. Frontend is running on port 5173
3. `CORS_ALLOWED_ORIGINS` in settings.py includes frontend URL

### Authentication Issues
- Check browser console for JWT token
- Verify tokens in localStorage: `access_token` and `refresh_token`
- Check network tab for 401/403 errors
- Lecturer accounts need admin approval to login

### API Errors
- Ensure backend is running
- Check Django server logs for errors
- Verify API endpoints in browser: `http://localhost:8000/api/projects/`

## Contributing

When adding new features:
1. Create API endpoints in Django first (serializers, viewsets, URLs)
2. Test endpoints with Django REST Framework browsable API
3. Create React components and integrate with API
4. Update this README with new features

---

**Upgrade Complete!** 🎉 

Your UniTeam project now has a modern, fast, and scalable React frontend powered by Vite!
