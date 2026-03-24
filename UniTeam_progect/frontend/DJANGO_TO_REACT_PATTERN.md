# Django Templates → React Migration Pattern Guide

## Overview
This document shows how Django template files map to the new React component structure, making it easier to build more pages following the same pattern.

---

## Profile Pages Mapping

### Django Side
```
Django Templates:
├── templates/users/profile_details_student.html    [85 lines]
├── templates/users/profile_edit_student.html       [161 lines]
├── templates/users/profile_details_lecturer.html   [104 lines]
├── templates/users/profile_edit_lecturer.html      [168 lines]
├── templates/users/profile_details_admin.html      [82 lines]
└── templates/users/profile_edit_admin.html         [124 lines]

Django Views:
├── users/views.py → profile_details (3 role-specific templates)
└── users/views.py → profile_edit (3 role-specific templates)

Django URLs:
├── /profile/ → profile_details view
└── /profile/edit/ → profile_edit view
```

### React Side (New)
```
React Components:
├── frontend/src/pages/StudentProfile.jsx           [115 lines]
├── frontend/src/pages/StudentProfileEdit.jsx       [240 lines]
├── frontend/src/pages/LecturerProfile.jsx          [130 lines]
├── frontend/src/pages/LecturerProfileEdit.jsx      [255 lines]
├── frontend/src/pages/AdminProfile.jsx             [125 lines]
└── frontend/src/pages/AdminProfileEdit.jsx         [225 lines]

React Styling:
├── frontend/src/styles/Profile.css                 [850+ lines]
└── frontend/src/styles/ProfileEdit.css             [750+ lines]

React Routing (App.jsx):
├── /student/profile → StudentProfile
├── /student/profile/edit → StudentProfileEdit
├── /lecturer/profile → LecturerProfile
├── /lecturer/profile/edit → LecturerProfileEdit
├── /admin/profile → AdminProfile
└── /admin/profile/edit → AdminProfileEdit
```

---

## Component Structure Pattern

### Profile Display Pattern

**Django Template Structure:**
```html
{% extends "base/base_student.html" %}
<div class="surface">
  <!-- Header with Edit Button -->
  <div class="flex justify-between items-center">
    <h1>My Student Profile</h1>
    <a href="{% url 'profile_edit' %}" class="btn btn-primary">Edit Profile</a>
  </div>
  
  <!-- Messages (alerts) -->
  {% if messages %}...{% endif %}
  
  <!-- Main Grid: 3-column (1 left, 2 right) -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- Left Column: Avatar & Contact -->
    <div>
      {% if user.avatar %}
        <img src="{{ user.avatar.url }}">
      {% else %}
        <div>{{ user.first_name.0 }}{{ user.last_name.0 }}</div>
      {% endif %}
      <h2>{{ user.get_full_name }}</h2>
      <p>@{{ user.username }}</p>
      
      <!-- Contact Items -->
      <p><i class="fas fa-envelope"></i>{{ user.email }}</p>
    </div>
    
    <!-- Right Column: Sections -->
    <div class="md:col-span-2 space-y-6">
      <!-- Section 1: About -->
      <section>
        <h3>About Me</h3>
        <p>{{ user.studentprofile.bio }}</p>
      </section>
      
      <!-- Section 2: Academic Info -->
      <section>
        <h3>Academic Information</h3>
        <dl>
          <dt>University</dt>
          <dd>{{ user.studentprofile.university }}</dd>
          <!-- ... more fields ... -->
        </dl>
      </section>
      
      <!-- Section 3: Skills -->
      <section>
        <h3>Skills</h3>
        <div class="flex flex-wrap gap-2">
          {% for skill in user.studentprofile.skills.all %}
            <span class="badge">{{ skill.name }}</span>
          {% endfor %}
        </div>
      </section>
    </div>
  </div>
</div>
```

**React Component Structure:**
```jsx
export default function StudentProfile() {
  const { user } = useAuth();
  const studentProfile = user?.studentprofile || {};
  
  return (
    <div className="profile-wrapper">
      {/* Header Section */}
      <div className="profile-header surface">
        <div className="profile-header-content">
          <div>
            <h1 className="profile-title">My Student Profile</h1>
            <p className="profile-subtitle">Your personal and academic information</p>
          </div>
          <Link to="/student/profile/edit" className="btn btn-primary">
            <i className="fa-solid fa-pencil"></i> Edit Profile
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-grid">
        {/* Left Column: Avatar and Contact */}
        <div className="profile-sidebar surface">
          {/* Avatar Display */}
          {profile.avatar ? (
            <img src={profile.avatar} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              <span>{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
            </div>
          )}
          
          {/* Identity & Contact */}
          <div className="profile-identity">
            <h2 className="profile-fullname">{profile.first_name} {profile.last_name}</h2>
            <p className="profile-username">@{profile.username}</p>
          </div>
          
          <div className="profile-contact-section">
            <div className="contact-item">
              <i className="fa-solid fa-envelope"></i>
              <div>
                <p className="contact-label">School Email</p>
                <p className="contact-value">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="profile-details">
          {/* About Section */}
          <div className="profile-section surface">
            <h3 className="section-title">About Me</h3>
            <p className="section-content">{studentProfile.bio}</p>
          </div>
          
          {/* Academic Info Section */}
          <div className="profile-section surface">
            <h3 className="section-title">Academic Information</h3>
            <div className="profile-info-grid">
              <div className="info-item">
                <label className="info-label">University</label>
                <p className="info-value">{studentProfile.university}</p>
              </div>
              {/* ... more fields ... */}
            </div>
          </div>
          
          {/* Skills Section */}
          <div className="profile-section surface">
            <h3 className="section-title">Skills</h3>
            <div className="skills-container">
              {studentProfile.skills?.map((skill, i) => (
                <span key={i} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## CSS Organization Pattern

### Django CSS Structure
```css
/* templates/users/profile_details_student.html */
<style>
  .grid { display: grid; grid-template-columns: 1fr 2fr; }
  .col-span-1 { /* avatar & contact */ }
  .col-span-2 { /* details */ }
  
  .profile-avatar { /* styling */ }
  .badge { /* skill badges */ }
  /* ... scattered throughout HTML ... */
</style>
```

### React CSS Structure (Best Practice)
```css
/* frontend/src/styles/Profile.css */

/* 1. Header Section */
.profile-header { ... }
.profile-title { ... }
.profile-subtitle { ... }

/* 2. Grid Layout */
.profile-grid { ... }

/* 3. Sidebar (Avatar & Contact) */
.profile-sidebar { ... }
.profile-avatar { ... }
.profile-avatar-placeholder { ... }
.profile-identity { ... }
.profile-contact-section { ... }
.contact-item { ... }
.contact-label { ... }
.contact-value { ... }

/* 4. Details Section */
.profile-details { ... }
.profile-section { ... }
.section-title { ... }
.section-content { ... }

/* 5. Info Grid */
.profile-info-grid { ... }
.info-item { ... }
.info-label { ... }
.info-value { ... }

/* 6. Skills & Tags */
.skills-container { ... }
.skill-badge { ... }

/* 7. Button Styles */
.btn { ... }
.btn-primary { ... }
.btn-secondary { ... }

/* 8. Responsive Design */
@media (max-width: 768px) { ... }

/* 9. Dark Mode Support */
@media (prefers-color-scheme: dark) { ... }
```

---

## Step-by-Step Migration Pattern

### For Any Django Template → React Page

**Step 1: Analyze Django Template**
- Identify HTML structure
- Note data bindings (`{{ }}` expressions)
- Find conditional blocks (`{% if %}`)
- Spot loops (`{% for %}`)
- List CSS classes and styles

**Step 2: Create React Component**
```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/PageName.css';

export default function PageName() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch data
  }, []);
  
  return (
    <div className="page-wrapper">
      {/* Header */}
      {/* Content */}
      {/* Footer */}
    </div>
  );
}
```

**Step 3: Build CSS File**
```css
/* styles/PageName.css */

/* Section 1: Container & Layout */
.page-wrapper { ... }

/* Section 2: Header */
.page-header { ... }
.page-title { ... }

/* Section 3: Content Sections */
.page-section { ... }
.section-title { ... }

/* Section 4: Responsive */
@media (max-width: 768px) { ... }

/* Section 5: Dark Mode */
@media (prefers-color-scheme: dark) { ... }
```

**Step 4: Update Routing (App.jsx)**
```jsx
import PageName from './pages/PageName';

// In Routes:
<Route path="/page-path" element={<PageName />} />
```

---

## Data Structure Mapping

### Django QuerySet → React State

**Django Template (Django Pass Context):**
```python
# views.py
context = {
    'user': request.user,
    'user.studentprofile': request.user.studentprofile,
    'user.studentprofile.skills': request.user.studentprofile.skills.all()
}
```

**Django Template (Access in HTML):**
```html
{{ user.first_name }}
{{ user.studentprofile.bio }}
{% for skill in user.studentprofile.skills.all %}
  {{ skill.name }}
{% endfor %}
```

**React Component (Fetch & Store):**
```jsx
const { user } = useAuth();
const studentProfile = user?.studentprofile || {};
const skills = studentProfile.skills || [];

// In JSX:
<p>{user.first_name}</p>
<p>{studentProfile.bio}</p>
{skills.map(skill => <span key={skill}>{skill}</span>)}
```

---

## Common Django → React Patterns

### 1. Conditional Rendering

**Django:**
```html
{% if user.avatar %}
  <img src="{{ user.avatar.url }}">
{% else %}
  <div>Placeholder</div>
{% endif %}
```

**React:**
```jsx
{user.avatar ? (
  <img src={user.avatar} />
) : (
  <div>Placeholder</div>
)}
```

### 2. Loops/Lists

**Django:**
```html
{% for skill in user.studentprofile.skills.all %}
  <span class="badge">{{ skill.name }}</span>
{% empty %}
  <p>No skills</p>
{% endfor %}
```

**React:**
```jsx
{skills.length > 0 ? (
  skills.map(skill => <span key={skill}>{skill}</span>)
) : (
  <p>No skills</p>
)}
```

### 3. URL Generation

**Django:**
```html
<a href="{% url 'profile_edit' %}">Edit</a>
```

**React:**
```jsx
<Link to="/student/profile/edit">Edit</Link>
```

### 4. Form Handling

**Django:**
```html
<form method="POST">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Save</button>
</form>
```

**React:**
```jsx
<form onSubmit={handleSubmit}>
  <input value={formData.field} onChange={handleChange} />
  <button type="submit">Save</button>
</form>
```

---

## File Organization Rules

When creating a new page-set (display + edit), follow this pattern:

```
Example: Project Pages

1. Create Page Components
   frontend/src/pages/ProjectList.jsx
   frontend/src/pages/ProjectEdit.jsx

2. Create CSS File
   frontend/src/styles/Project.css

3. Update App.jsx
   Add imports and routes

4. Document
   Update PROJECT_STRUCTURE.md
```

---

## Checklist for New Pages

- [ ] Django template analyzed
- [ ] React component created
- [ ] CSS file in styles/ folder
- [ ] Routes added to App.jsx
- [ ] API calls integrated
- [ ] Responsive design tested
- [ ] Dark mode support added
- [ ] Documentation updated
- [ ] Build tested (npm run build)

---

## Key Takeaways

✅ **Component per role** - StudentProfile, LecturerProfile, AdminProfile
✅ **CSS per page type** - Profile.css, Project.css, etc.
✅ **Consistent structure** - Header, Grid, Sidebar, Details, Footer
✅ **Mobile-first** - Desktop-friendly responsive design
✅ **Dark mode** - Built-in support via media query
✅ **Clean code** - Well-organized, documented, maintainable
