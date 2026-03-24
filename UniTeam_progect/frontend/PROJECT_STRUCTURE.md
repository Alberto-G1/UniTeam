# UniTeam Frontend - Project Structure Documentation

## Overview
The React frontend has been restructured to match the Django template organization, with improved separation of concerns and CSS organization.

## Folder Structure

```
frontend/src/
├── pages/                          # Page Components
│   ├── StudentProfile.jsx          # Student profile display
│   ├── StudentProfileEdit.jsx      # Student profile editing
│   ├── LecturerProfile.jsx         # Lecturer profile display
│   ├── LecturerProfileEdit.jsx     # Lecturer profile editing
│   ├── AdminProfile.jsx            # Admin profile display
│   ├── AdminProfileEdit.jsx        # Admin profile editing
│   ├── MyProjects.jsx              # Student projects list
│   ├── Invitations.jsx             # Student invitations
│   ├── ManageUsers.jsx             # Admin user management
│   ├── StudentDashboard.jsx        # Student dashboard
│   ├── LecturerDashboard.jsx       # Lecturer dashboard
│   ├── AdminDashboard.jsx          # Admin dashboard
│   ├── Login.jsx                   # Login page
│   ├── Signup.jsx                  # Signup page
│   ├── NotFound.jsx                # 404/Coming soon page
│   ├── Profile.jsx                 # (DEPRECATED - use role-specific pages)
│   ├── Profile.css                 # (OLD - moved to styles/)
│   ├── components/                 # Reusable page components
│   │   └── (future page subcomponents)
│   └── ...
│
├── styles/                         # Centralized CSS Files
│   ├── Profile.css                 # Profile display styling
│   │   ├── Header section
│   │   ├── Grid layout
│   │   ├── Sidebar styling
│   │   ├── Details sections
│   │   ├── Skills/tags styling
│   │   ├── Button styles
│   │   └── Responsive design
│   │
│   ├── ProfileEdit.css            # Profile edit form styling
│   │   ├── Header section
│   │   ├── Two-column layout
│   │   ├── Avatar upload
│   │   ├── Form groups & inputs
│   │   ├── Form sections
│   │   ├── Form actions
│   │   ├── Alert messages
│   │   └── Responsive design
│   │
│   └── (future page-specific CSS files)
│
├── layouts/                        # Role-based Layouts
│   ├── StudentLayout.jsx
│   ├── LecturerLayout.jsx
│   └── AdminLayout.jsx
│
├── components/                     # Reusable Components
│   ├── ProtectedRoute.jsx
│   ├── ComingSoon.jsx              # (currently replaced by NotFound)
│   └── ...
│
├── context/                        # React Context
│   └── AuthContext.jsx
│
├── services/                       # API Layer
│   └── api.js
│
├── App.jsx                         # Main router with updated imports
└── index.css                       # Global styles
```

## Key Changes & Best Practices

### 1. **Role-Specific Profile Pages**
   - **Before**: Single generic `Profile.jsx` that tried to handle all roles
   - **After**: Three role-specific pages
     - `StudentProfile.jsx` → `/student/profile`
     - `LecturerProfile.jsx` → `/lecturer/profile`
     - `AdminProfile.jsx` → `/admin/profile`
   - **Why**: Each role has different data structure and display requirements

### 2. **Profile Edit Forms**
   - **Before**: Using generic `ComingSoon` component
   - **After**: Three role-specific edit pages
     - `StudentProfileEdit.jsx` → `/student/profile/edit`
     - `LecturerProfileEdit.jsx` → `/lecturer/profile/edit`
     - `AdminProfileEdit.jsx` → `/admin/profile/edit`
   - **Why**: Each role has different profile fields to edit

### 3. **CSS Organization**
   - **Before**: All profile CSS in `pages/Profile.css`
   - **After**: Centralized in `styles/` folder
     - `styles/Profile.css` - Display-only styling
     - `styles/ProfileEdit.css` - Form and edit styling
   - **Why**: Better organization and room for growth with other page styles

### 4. **CSS Structure (Profile.css)**
   ```
   ├── Header Section (.profile-header)
   ├── Grid Layout (.profile-grid)
   ├── Sidebar (.profile-sidebar)
   │   ├── Avatar (.profile-avatar)
   │   ├── Identity (.profile-identity)
   │   └── Contact (.profile-contact-section)
   ├── Details (.profile-details)
   │   ├── Sections (.profile-section)
   │   ├── Info Grid (.profile-info-grid)
   │   └── Skills (.skills-container)
   └── Responsive & Dark Mode Support
   ```

### 5. **CSS Structure (ProfileEdit.css)**
   ```
   ├── Header Section (.profile-edit-header)
   ├── Form Layout (.profile-edit-grid)
   ├── Sidebar - Avatar Upload (.profile-edit-sidebar)
   ├── Details - Form Fields (.profile-edit-details)
   │   ├── Form Sections (.form-section)
   │   ├── Form Groups (.form-group)
   │   ├── Input Styling (.form-input)
   │   └── Form Actions (.form-actions)
   ├── Alert Messages (.alert)
   └── Responsive & Dark Mode Support
   ```

## Page Flow

### Student Profile Flow
```
StudentDashboard (view projects/invitations)
    ↓
Click "View Profile" 
    ↓
StudentProfile (display read-only profile)
    ↓
Click "Edit Profile"
    ↓
StudentProfileEdit (edit form with avatar upload)
    ↓
Submit → Save Changes
    ↓
Back to StudentProfile
```

### Lecturer Profile Flow
```
LecturerDashboard
    ↓
Click "View Profile"
    ↓
LecturerProfile (display courses taught, research areas)
    ↓
Click "Edit Profile"
    ↓
LecturerProfileEdit (edit professional info)
    ↓
Submit → Save Changes
    ↓
Back to LecturerProfile
```

### Admin Profile Flow
```
AdminDashboard
    ↓
Click "View Profile"
    ↓
AdminProfile (display role information)
    ↓
Click "Edit Profile"
    ↓
AdminProfileEdit (edit role title, responsibilities)
    ↓
Submit → Save Changes
    ↓
Back to AdminProfile
```

## Data Structure Per Role

### StudentProfile
```javascript
{
  // User fields
  first_name: string
  last_name: string
  email: string
  phone_number: string
  avatar: url | null
  
  // studentprofile fields
  personal_email: string
  university: string
  department: string
  course_name: string
  year_of_study: string
  bio: string
  skills: string[] (TaggableManager)
}
```

### LecturerProfile
```javascript
{
  // User fields
  first_name: string
  last_name: string
  email: string
  phone_number: string
  avatar: url | null
  
  // lecturerprofile fields
  department: string
  office_location: string
  courses_taught: string[] (TaggableManager)
  research_areas: string[] (TaggableManager)
}
```

### AdminProfile
```javascript
{
  // User fields
  first_name: string
  last_name: string
  email: string
  phone_number: string
  avatar: url | null
  
  // adminprofile fields
  role_title: string
  responsibilities: string
}
```

## Styling Conventions

### Color Scheme
- **Primary Accent**: `--accent-1: #C0392B` (Crimson/Red)
- **Secondary Accent**: `--accent-2: #2C3E50` (Navy)
- **Light Gray**: `--light-gray: #DFE6EC`
- **Dark Gray**: `--dark-gray: #A6B0B9`

### Responsive Breakpoints
```css
Desktop:   > 1024px
Tablet:    768px - 1024px  
Mobile:    < 768px
```

### CSS Variables Used
```css
--surface              /* Card/section background */
--text-dark           /* Primary text */
--text-secondary      /* Secondary text */
--text-tertiary       /* Tertiary text */
--border-color        /* Border color */
--input-bg            /* Input field background */
--accent-1            /* Primary button color */
--accent-2            /* Secondary button color */
```

## Future Structure Additions

When adding new pages, follow this pattern:

1. **Create page component**: `frontend/src/pages/PageName.jsx`
2. **Create CSS file**: `frontend/src/styles/PageName.css`
3. **Import in App.jsx**: Add to routing
4. **Follow structure**: Use consistent grid layouts and component patterns

## Migration from Old Profile.jsx

If you still have references to the old `Profile.jsx`:
- Replace with role-specific imports
- Update components to use new folder structure
- Clean up old `pages/Profile.css` (now in `styles/Profile.css`)

## Why This Structure?

1. **Scalability**: Easy to add new pages with corresponding CSS
2. **Consistency**: All pages follow the same pattern from Django templates
3. **Maintainability**: CSS is centralized and organized by feature
4. **Separation of Concerns**: Pages handle logic, styles handle presentation
5. **Theme Support**: Built-in dark mode and accessibility
